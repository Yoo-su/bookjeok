import {
  ActiveReadersResponse,
  LoungeBookReadersResponse,
  LoungeFeedResponse,
  LoungePopularResponse,
  LoungeReader,
} from '@bookjeok/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import {
  LOUNGE_MAX_READERS,
  LOUNGE_PAGE_SIZE,
  LOUNGE_POPULAR_COUNT,
  LOUNGE_POPULAR_DAYS,
} from '../constants';
import { CreateReadingLogDto } from '../dtos/create-reading-log.dto';
import { UpdateReadingLogDto } from '../dtos/update-reading-log.dto';
import { ReadingLog } from '../entities/reading-log.entity';

interface FeedGroupAccumulator {
  isbn: string;
  book: LoungeFeedResponse['items'][number]['book'] | null;
  latestDate: string;
  readersMap: Map<number, LoungeReader>;
}

interface PopularGroupAccumulator {
  isbn: string;
  book: LoungePopularResponse['items'][number]['book'] | null;
  readerCount: number;
  readersSet: Set<number>;
  recentReaders: LoungePopularResponse['items'][number]['recentReaders'];
}

@Injectable()
export class ReadingLogService {
  constructor(
    @InjectRepository(ReadingLog)
    private readonly readingLogRepository: Repository<ReadingLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 라운지 피드를 조회합니다.
   * 공개 설정된 모든 사용자의 독서 기록을 ISBN별로 그룹화하여 반환합니다.
   * 동일 사용자가 같은 책을 여러 번 읽은 경우 최신 기록만 반영합니다.
   *
   * @param cursor 페이지네이션 커서 (format: "YYYY-MM-DD|isbn")
   * @returns 그룹화된 피드 아이템 + 다음 커서
   */
  async getLoungeFeed(cursor?: string): Promise<LoungeFeedResponse> {
    // 1단계: ISBN별 최신 독서 날짜 조회 (공개 사용자만)
    const subQuery = this.readingLogRepository
      .createQueryBuilder('rl')
      .select('rl.isbn', 'isbn')
      .addSelect('MAX(rl.date)', 'latestDate')
      .innerJoin('rl.user', 'u')
      .where('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .groupBy('rl.isbn')
      .orderBy('"latestDate"', 'DESC')
      .addOrderBy('rl.isbn', 'DESC');

    if (cursor) {
      const [cursorDate, cursorIsbn] = cursor.split('|');
      if (cursorDate && cursorIsbn) {
        subQuery.having(
          '(MAX(rl.date) < :cursorDate OR (MAX(rl.date) = :cursorDate AND rl.isbn < :cursorIsbn))',
          { cursorDate, cursorIsbn },
        );
      }
    }

    subQuery.limit(LOUNGE_PAGE_SIZE + 1);

    const bookGroups: { isbn: string; latestDate: string | Date }[] =
      await subQuery.getRawMany();

    const hasNextPage = bookGroups.length > LOUNGE_PAGE_SIZE;
    if (hasNextPage) bookGroups.pop();

    if (bookGroups.length === 0) {
      return { items: [], nextCursor: null };
    }

    const isbns = bookGroups.map((g) => g.isbn);

    // 2단계: 해당 ISBN들의 독서 기록 + 사용자 정보 + 도서 정보 조회
    const logs = await this.readingLogRepository
      .createQueryBuilder('rl')
      .leftJoinAndSelect('rl.book', 'book')
      .innerJoin('rl.user', 'u')
      .addSelect(['u.id', 'u.nickname', 'u.handle', 'u.profileImageUrl'])
      .where('rl.isbn IN (:...isbns)', { isbns })
      .andWhere('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .orderBy('rl.date', 'DESC')
      .addOrderBy('rl.createdAt', 'DESC')
      .getMany();

    // 3단계: ISBN별로 그룹화 + 사용자별 최신 기록만 유지 (재독 중복 제거)
    const groupMap = new Map<string, FeedGroupAccumulator>();

    for (const group of bookGroups) {
      const dateStr =
        group.latestDate instanceof Date
          ? group.latestDate.toISOString().split('T')[0]
          : typeof group.latestDate === 'string'
            ? group.latestDate.split('T')[0]
            : String(group.latestDate);

      groupMap.set(group.isbn, {
        isbn: group.isbn,
        book: null,
        latestDate: dateStr,
        readersMap: new Map(),
      });
    }

    for (const log of logs) {
      const group = groupMap.get(log.isbn);
      if (!group) continue;

      if (!group.book && log.book) {
        group.book = {
          isbn: log.book.isbn,
          title: log.book.title,
          author: log.book.author,
          publisher: log.book.publisher,
          image: log.book.image,
          description: log.book.description,
          link: '',
          discount: '',
          pubdate: '',
        };
      }

      // 사용자별 최신 기록만 유지 (이미 있으면 skip - 이미 date DESC 정렬됨)
      if (!group.readersMap.has(log.userId)) {
        group.readersMap.set(log.userId, {
          userId: log.userId,
          nickname: log.user?.nickname || '',
          handle: log.user?.handle || '',
          profileImageUrl: log.user?.profileImageUrl || null,
          date: log.date,
          memo: log.memo || undefined,
        });
      }
    }

    // 4단계: 응답 포맷으로 변환
    const items = bookGroups.map((bg) => {
      const group = groupMap.get(bg.isbn)!;
      const allReaders = Array.from(group.readersMap.values());

      return {
        isbn: group.isbn,
        book: group.book!,
        latestDate: group.latestDate,
        readers: allReaders.slice(0, LOUNGE_MAX_READERS),
        totalReaderCount: allReaders.length,
      };
    });

    let nextCursor: string | null = null;
    if (hasNextPage) {
      const lastGroup = bookGroups[bookGroups.length - 1];
      const formattedLatestDate = groupMap.get(lastGroup.isbn)!.latestDate;
      nextCursor = `${formattedLatestDate}|${lastGroup.isbn}`;
    }

    return { items, nextCursor };
  }

  /**
   * 라운지 인기 도서를 조회합니다.
   * 최근 1년간 가장 많은 사용자가 읽은 도서 Top 10을 반환합니다.
   *
   * @returns 인기 도서 목록
   */
  async getLoungePopular(): Promise<LoungePopularResponse> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - LOUNGE_POPULAR_DAYS);
    const sinceDateStr = sinceDate.toISOString().split('T')[0];

    // ISBN별 고유 독자 수 집계
    const popularBooks: {
      isbn: string;
      readerCount: string;
    }[] = await this.readingLogRepository
      .createQueryBuilder('rl')
      .select('rl.isbn', 'isbn')
      .addSelect('COUNT(DISTINCT rl.userId)', 'readerCount')
      .innerJoin('rl.user', 'u')
      .where('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .andWhere('rl.date >= :sinceDate', { sinceDate: sinceDateStr })
      .groupBy('rl.isbn')
      .orderBy('"readerCount"', 'DESC')
      .limit(LOUNGE_POPULAR_COUNT)
      .getRawMany();

    if (popularBooks.length === 0) {
      return { items: [] };
    }

    const isbns = popularBooks.map((pb) => pb.isbn);

    // 도서 정보 + 최근 독자 정보 조회
    const logs = await this.readingLogRepository
      .createQueryBuilder('rl')
      .leftJoinAndSelect('rl.book', 'book')
      .innerJoin('rl.user', 'u')
      .addSelect(['u.nickname', 'u.handle', 'u.profileImageUrl'])
      .where('rl.isbn IN (:...isbns)', { isbns })
      .andWhere('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .andWhere('rl.date >= :sinceDate', { sinceDate: sinceDateStr })
      .orderBy('rl.date', 'DESC')
      .getMany();

    // ISBN별 그룹화
    const bookMap = new Map<string, PopularGroupAccumulator>();
    for (const pb of popularBooks) {
      bookMap.set(pb.isbn, {
        isbn: pb.isbn,
        book: null,
        readerCount: Number(pb.readerCount),
        readersSet: new Set<number>(),
        recentReaders: [],
      });
    }

    for (const log of logs) {
      const entry = bookMap.get(log.isbn);
      if (!entry) continue;

      if (!entry.book && log.book) {
        entry.book = {
          isbn: log.book.isbn,
          title: log.book.title,
          author: log.book.author,
          publisher: log.book.publisher,
          image: log.book.image,
          description: log.book.description,
          link: '',
          discount: '',
          pubdate: '',
        };
      }

      if (
        !entry.readersSet.has(log.userId) &&
        entry.recentReaders.length < LOUNGE_MAX_READERS
      ) {
        entry.readersSet.add(log.userId);
        entry.recentReaders.push({
          nickname: log.user?.nickname || '',
          handle: log.user?.handle || '',
          profileImageUrl: log.user?.profileImageUrl || null,
        });
      }
    }

    const items = popularBooks.map((pb) => {
      const entry = bookMap.get(pb.isbn)!;
      return {
        isbn: entry.isbn,
        book: entry.book!,
        readerCount: entry.readerCount,
        recentReaders: entry.recentReaders,
      };
    });

    return { items };
  }

  /**
   * 라운지 열성 독서가를 조회합니다.
   * 최근 3개월간 가장 활발하게 독서 기록을 남긴 공개 사용자 목록을 반환합니다.
   *
   * @param limit 조회할 최대 사용자 수 (기본값: 10)
   * @returns 열성 독서가 목록
   */
  async getLoungeActiveReaders(limit = 10): Promise<ActiveReadersResponse> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 90);
    const sinceDateStr = sinceDate.toISOString().split('T')[0];

    const rawUsers: {
      id: number;
      nickname: string;
      handle: string;
      profileImageUrl: string | null;
      recentCount: string;
      totalCount: string;
    }[] = await this.userRepository
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .addSelect('u.nickname', 'nickname')
      .addSelect('u.handle', 'handle')
      .addSelect('u.profileImageUrl', 'profileImageUrl')
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(rl.id)', 'recentCount')
            .from(ReadingLog, 'rl')
            .where('rl.userId = u.id')
            .andWhere('rl.date >= :sinceDate', { sinceDate: sinceDateStr }),
        'recentCount',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(rl2.id)', 'totalCount')
            .from(ReadingLog, 'rl2')
            .where('rl2.userId = u.id'),
        'totalCount',
      )
      .where('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .orderBy('"recentCount"', 'DESC')
      .addOrderBy('"totalCount"', 'DESC')
      .limit(limit)
      .getRawMany();

    // 2. 가공하여 최종 결과 반환
    const items = rawUsers.map((ru) => ({
      user: {
        id: ru.id,
        nickname: ru.nickname,
        handle: ru.handle,
        profileImageUrl: ru.profileImageUrl,
      },
      recentCount: parseInt(ru.recentCount || '0', 10),
      totalCount: parseInt(ru.totalCount || '0', 10),
    }));

    return { items };
  }

  /**
   * 특정 도서의 전체 독자 목록을 조회합니다.
   * 상세 모달에서 무한 스크롤로 모든 독자를 보여줄 때 사용됩니다.
   *
   * @param isbn 도서 ISBN
   * @param cursor 페이지네이션 커서 (userId)
   * @returns 독자 목록 + 다음 커서 + 전체 수
   */
  async getLoungeBookReaders(
    isbn: string,
    cursor?: string,
  ): Promise<LoungeBookReadersResponse> {
    const PAGE_SIZE = 20;

    // 도서 정보 조회
    const bookEntity = await this.dataSource
      .getRepository(Book)
      .findOne({ where: { isbn } });

    const book = bookEntity
      ? {
          isbn: bookEntity.isbn,
          title: bookEntity.title,
          author: bookEntity.author,
          publisher: bookEntity.publisher,
          image: bookEntity.image,
          description: bookEntity.description,
          link: '',
          discount: '',
          pubdate: '',
        }
      : {
          isbn,
          title: '',
          author: '',
          publisher: '',
          image: '',
          description: '',
          link: '',
          discount: '',
          pubdate: '',
        };

    // 전체 독자 수 (고유 사용자)
    const totalCountResult = await this.readingLogRepository
      .createQueryBuilder('rl')
      .select('COUNT(DISTINCT rl.userId)', 'count')
      .innerJoin('rl.user', 'u')
      .where('rl.isbn = :isbn', { isbn })
      .andWhere('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .getRawOne();

    const totalCount = Number(totalCountResult?.count || 0);

    // 1단계: 사용자별 최신 독서 날짜 조회 (공개 사용자만, 재독 중복 제거)
    const userGroupsQuery = this.readingLogRepository
      .createQueryBuilder('rl')
      .select('rl.userId', 'userId')
      .addSelect('MAX(rl.date)', 'latestDate')
      .innerJoin('rl.user', 'u')
      .where('rl.isbn = :isbn', { isbn })
      .andWhere('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .groupBy('rl.userId')
      .orderBy('"latestDate"', 'DESC')
      .addOrderBy('rl.userId', 'DESC');

    if (cursor) {
      const [cursorDate, cursorUserIdStr] = cursor.split('|');
      const cursorUserId = Number(cursorUserIdStr);
      if (cursorDate && !isNaN(cursorUserId)) {
        userGroupsQuery.having(
          '(MAX(rl.date) < :cursorDate OR (MAX(rl.date) = :cursorDate AND rl.userId < :cursorUserId))',
          { cursorDate, cursorUserId },
        );
      }
    }

    userGroupsQuery.limit(PAGE_SIZE + 1);

    const userGroups: {
      userId: number;
      latestDate: string | Date;
    }[] = await userGroupsQuery.getRawMany();

    const hasNextPage = userGroups.length > PAGE_SIZE;
    if (hasNextPage) userGroups.pop();

    if (userGroups.length === 0) {
      return { book, items: [], nextCursor: null, totalCount };
    }

    const userIds = userGroups.map((ug) => ug.userId);

    // 2단계: 최신 독서 기록의 상세 정보(메모, 유저 프로필 등) 일괄 조회
    const logs = await this.readingLogRepository
      .createQueryBuilder('rl')
      .innerJoin('rl.user', 'u')
      .addSelect(['u.id', 'u.nickname', 'u.handle', 'u.profileImageUrl'])
      .where('rl.isbn = :isbn', { isbn })
      .andWhere('rl.userId IN (:...userIds)', { userIds })
      .orderBy('rl.date', 'DESC')
      .addOrderBy('rl.createdAt', 'DESC')
      .getMany();

    const userLatestLogMap = new Map<number, ReadingLog>();
    for (const log of logs) {
      if (!userLatestLogMap.has(log.userId)) {
        userLatestLogMap.set(log.userId, log);
      }
    }

    const items = userGroups.map((ug) => {
      const log = userLatestLogMap.get(ug.userId);
      const formattedDate =
        ug.latestDate instanceof Date
          ? ug.latestDate.toISOString().split('T')[0]
          : String(ug.latestDate).split('T')[0];

      return {
        userId: ug.userId,
        nickname: log?.user?.nickname || '',
        handle: log?.user?.handle || '',
        profileImageUrl: log?.user?.profileImageUrl || null,
        date: formattedDate,
        memo: log?.memo || undefined,
      };
    });

    let nextCursor: string | null = null;
    if (hasNextPage) {
      const lastGroup = userGroups[userGroups.length - 1];
      const lastDateStr =
        lastGroup.latestDate instanceof Date
          ? lastGroup.latestDate.toISOString().split('T')[0]
          : String(lastGroup.latestDate).split('T')[0];
      nextCursor = `${lastDateStr}|${lastGroup.userId}`;
    }

    return { book, items, nextCursor, totalCount };
  }

  /**
   * 독서 기록 설정을 조회합니다.
   * @param userId 사용자 ID
   * @returns 독서 기록 공개 여부
   */
  async getSettings(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['isReadingLogPublic'],
    });
    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return { isReadingLogPublic: user.isReadingLogPublic };
  }

  /**
   * 독서 기록 설정을 업데이트합니다.
   * @param userId 사용자 ID
   * @param isReadingLogPublic 독서 기록 공개 여부
   * @returns 업데이트된 독서 기록 공개 여부
   */
  async updateSettings(userId: number, isReadingLogPublic: boolean) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    user.isReadingLogPublic = isReadingLogPublic;
    const updatedUser = await this.userRepository.save(user);

    return { isReadingLogPublic: updatedUser.isReadingLogPublic };
  }

  /**
   * 새로운 독서 기록을 생성합니다.
   * @param userId 사용자 ID
   * @param createReadingLogDto 독서 기록 생성 DTO
   * @returns 생성된 독서 기록 엔티티
   */
  async create(userId: number, createReadingLogDto: CreateReadingLogDto) {
    const { isbn, ...data } = createReadingLogDto;
    const log = this.readingLogRepository.create({
      userId,
      ...data,
      isbn,
    });
    const savedLog = await this.readingLogRepository.save(log);

    // 저장 후 도서 정보를 포함하여 다시 조회
    return await this.readingLogRepository.findOne({
      where: { id: savedLog.id },
      relations: ['book'],
    });
  }

  /**
   * 독서 기록 목록을 조회합니다.
   * @param userId 유저 ID
   * @param params year, month, limit 옵션
   */
  async findAll(
    userId: number,
    params: { year?: number; month?: number; limit?: number },
  ) {
    const { year, month, limit } = params;

    // 1. 연도 및 월 지정 시 월별 기록 조회
    if (year && month) {
      const { start, end } = this.getDateRangeOfMonth(year, month);
      return await this.readingLogRepository
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.book', 'book')
        .where('log.userId = :userId', { userId })
        .andWhere('log.date >= :start AND log.date <= :end', { start, end })
        .orderBy('log.date', 'ASC')
        .getMany();
    }

    // 2. 연도만 지정 시 연간 기록 조회
    if (year) {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      return await this.readingLogRepository
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.book', 'book')
        .where('log.userId = :userId', { userId })
        .andWhere('log.date >= :start AND log.date <= :end', { start, end })
        .orderBy('log.date', 'ASC')
        .getMany();
    }

    // 3. 연/월 미지정 시 최근 기록 조회 (기본 50개)
    return await this.readingLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.book', 'book')
      .where('log.userId = :userId', { userId })
      .orderBy('log.date', 'DESC')
      .addOrderBy('log.createdAt', 'DESC')
      .take(limit || 50)
      .getMany();
  }

  /**
   * 연도와 월을 기반으로 해당 월의 시작일과 종료일(문자열)을 계산합니다.
   */
  private getDateRangeOfMonth(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }

  /**
   * 독서 기록 통계를 조회합니다.
   * @param userId 사용자 ID
   * @param year 연도
   * @param month 월
   */
  async getStats(userId: number, year: number, month: number) {
    const qb = this.readingLogRepository.createQueryBuilder('log');

    // 1. 이번 달 시작일/종료일 계산
    const { start: monthStart, end: monthEnd } = this.getDateRangeOfMonth(
      year,
      month,
    );
    const monthlyCount = await qb
      .clone()
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :start AND log.date <= :end', {
        start: monthStart,
        end: monthEnd,
      })
      .getCount();

    // 2. 올해 시작일/종료일 계산
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const yearlyCount = await qb
      .clone()
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :start AND log.date <= :end', {
        start: yearStart,
        end: yearEnd,
      })
      .getCount();

    return { monthlyCount, yearlyCount };
  }

  /**
   * 독서 기록을 페이지네이션으로 조회합니다. (Infinite Scroll용)
   * @param userId 사용자 ID
   * @param cursorId 마지막으로 로드된 기록의 ID (없으면 처음부터)
   * @param limit 가져올 개수
   */
  async findAllInfinite(userId: number, cursorId?: string, limit = 10) {
    const query = this.readingLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.book', 'book')
      .where('log.userId = :userId', { userId })
      .orderBy('log.date', 'DESC')
      .addOrderBy('log.id', 'DESC')
      .take(limit + 1);

    if (cursorId) {
      if (cursorId.includes('|')) {
        const [cursorDate, cursorIdStr] = cursorId.split('|');
        query.andWhere(
          '(log.date < :cursorDate OR (log.date = :cursorDate AND log.id < :cursorIdStr))',
          { cursorDate, cursorIdStr },
        );
      } else {
        const cursorLog = await this.readingLogRepository.findOne({
          where: { id: cursorId },
        });
        if (cursorLog) {
          query.andWhere(
            '(log.date < :date OR (log.date = :date AND log.id < :cursorLogId))',
            { date: cursorLog.date, cursorLogId: cursorLog.id },
          );
        }
      }
    }

    const items = await query.getMany();
    const hasNextPage = items.length > limit;
    if (hasNextPage) {
      items.pop(); // 확인용 +1 제거
    }

    let nextCursor: string | null = null;
    if (hasNextPage && items.length > 0) {
      const lastItem = items[items.length - 1];
      const formattedDate = String(lastItem.date).split('T')[0];
      nextCursor = `${formattedDate}|${lastItem.id}`;
    }

    return {
      items,
      nextCursor,
    };
  }

  /**
   * 독서 기록을 수정합니다.
   * @param userId 사용자 ID (본인 확인용)
   * @param id 독서 기록 ID
   * @param updateReadingLogDto 수정할 데이터 DTO
   * @returns 수정된 독서 기록 엔티티
   */
  async update(
    userId: number,
    id: string,
    updateReadingLogDto: UpdateReadingLogDto,
  ) {
    const log = await this.readingLogRepository.findOne({
      where: { id, userId },
    });
    if (!log) {
      throw new BusinessException(
        'READING_LOG_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    // 변경 사항 적용
    if (updateReadingLogDto.memo !== undefined) {
      log.memo = updateReadingLogDto.memo;
    }

    const updatedLog = await this.readingLogRepository.save(log);

    // 수정 후 도서 정보를 포함하여 다시 조회
    return await this.readingLogRepository.findOne({
      where: { id: updatedLog.id },
      relations: ['book'],
    });
  }

  /**
   * 독서 기록을 삭제합니다.
   * @param userId 사용자 ID (본인 확인용)
   * @param id 삭제할 독서 기록 ID
   */
  async remove(userId: number, id: string) {
    const log = await this.readingLogRepository.findOne({
      where: { id, userId },
    });
    if (!log) {
      throw new BusinessException(
        'READING_LOG_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.readingLogRepository.remove(log);
  }

  /**
   * 특정 책을 읽은 고유 유저 수를 구합니다.
   */
  async countUniqueReaders(isbn: string): Promise<number> {
    const result = await this.readingLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.userId)', 'count')
      .where('log.isbn = :isbn', { isbn })
      .getRawOne<{ count: string }>();

    return parseInt(result?.count || '0', 10);
  }
}
