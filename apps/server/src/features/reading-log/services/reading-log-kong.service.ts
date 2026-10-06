import {
  ReceivedKongLog,
  ReceivedKongsResponse,
  SendKongResponse,
  SentKongsResponse,
} from '@bookjeok/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { emitDomainEvent } from '@/shared/events/domain-event';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { ReadingLog } from '../entities/reading-log.entity';
import { ReadingLogKong } from '../entities/reading-log-kong.entity';
import { ReadingLogEvents } from '../events/reading-log.events';
import { isUuid } from '../utils/cursor.util';

interface ReceivedKongRow {
  logId: string;
  date: string;
  isbn: string;
  title: string | null;
  author: string | null;
  publisher: string | null;
  image: string | null;
  senderId: number;
  nickname: string;
  handle: string;
  profileImageUrl: string | null;
  createdAt: Date;
}

/**
 * 독서 기록에 보내는 콩. 공개된 남의 기록에 한 사람이 한 알만 보내고 거둬들이지 않는다.
 * 받은 수는 주인만 본다.
 */
@Injectable()
export class ReadingLogKongService {
  constructor(
    @InjectRepository(ReadingLogKong)
    private readonly kongRepository: Repository<ReadingLogKong>,
    @InjectRepository(ReadingLog)
    private readonly readingLogRepository: Repository<ReadingLog>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 콩을 보낸다. 이미 보낸 기록이면 아무것도 바꾸지 않고 `sent: false`.
   * 비공개·탈퇴한 주인의 기록은 없는 기록처럼 404로 막는다.
   */
  async send(
    senderId: number,
    readingLogId: string,
  ): Promise<SendKongResponse> {
    // 형태가 틀린 id를 uuid 비교에 넣으면 캐스팅에서 500이 난다
    if (!isUuid(readingLogId)) {
      throw new BusinessException(
        'READING_LOG_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    const log = await this.readingLogRepository
      .createQueryBuilder('log')
      .innerJoin('log.user', 'owner')
      .leftJoin('log.book', 'book')
      .select(['log.id', 'log.userId', 'log.date', 'book.isbn', 'book.title'])
      .where('log.id = :readingLogId', { readingLogId })
      .andWhere('owner.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('owner.deletedAt IS NULL')
      .getOne();
    if (!log) {
      throw new BusinessException(
        'READING_LOG_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }
    if (log.userId === senderId) {
      throw new BusinessException(
        'READING_LOG_KONG_SELF',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 연타·동시 요청도 유니크 제약이 한 알로 막는다. 무시된 줄은 돌려받지 못한다
    const result = await this.kongRepository
      .createQueryBuilder()
      .insert()
      .into(ReadingLogKong)
      .values({ readingLogId, senderId })
      .orIgnore()
      .returning(['id'])
      .execute();
    const sent = (result.raw as unknown[]).length > 0;

    if (sent) {
      emitDomainEvent(this.eventEmitter, ReadingLogEvents.kongSent, {
        readingLogId,
        ownerId: log.userId,
        senderId,
        date: log.date,
        bookTitle: log.book?.title ?? '',
      });
    }

    return { logId: readingLogId, sent };
  }

  /** 내 기록이 받은 콩. 최근에 받은 기록부터, 기록마다 최근에 보낸 사람부터 */
  async getReceived(ownerId: number): Promise<ReceivedKongsResponse> {
    const rows = await this.kongRepository
      .createQueryBuilder('kong')
      .innerJoin('kong.readingLog', 'log')
      .leftJoin('log.book', 'book')
      .innerJoin('kong.sender', 'sender')
      .select('log.id', 'logId')
      // raw로 받는 date는 Date가 되며 운영 TZ에서 하루 밀린다(README 「date 컬럼」)
      .addSelect("TO_CHAR(log.date, 'YYYY-MM-DD')", 'date')
      .addSelect('log.isbn', 'isbn')
      .addSelect('book.title', 'title')
      .addSelect('book.author', 'author')
      .addSelect('book.publisher', 'publisher')
      .addSelect('book.image', 'image')
      .addSelect('sender.id', 'senderId')
      .addSelect('sender.nickname', 'nickname')
      .addSelect('sender.handle', 'handle')
      .addSelect('sender.profileImageUrl', 'profileImageUrl')
      .addSelect('kong.createdAt', 'createdAt')
      .where('log.userId = :ownerId', { ownerId })
      .andWhere('sender.deletedAt IS NULL')
      .orderBy('kong.createdAt', 'DESC')
      .addOrderBy('kong.id', 'DESC')
      .getRawMany<ReceivedKongRow>();

    const logs = new Map<string, ReceivedKongLog>();
    for (const row of rows) {
      let log = logs.get(row.logId);
      if (!log) {
        log = {
          logId: row.logId,
          date: row.date,
          book: {
            isbn: row.isbn,
            title: row.title ?? '',
            author: row.author ?? '',
            publisher: row.publisher ?? '',
            image: row.image ?? '',
          },
          count: 0,
          senders: [],
          lastReceivedAt: new Date(row.createdAt).toISOString(),
        };
        logs.set(row.logId, log);
      }
      log.count += 1;
      log.senders.push({
        userId: row.senderId,
        nickname: row.nickname,
        handle: row.handle,
        profileImageUrl: row.profileImageUrl,
      });
    }

    return { total: rows.length, logs: [...logs.values()] };
  }

  /** 한 사용자의 기록 중 내가 콩을 보낸 기록. 공개 키재기에서 이미 보낸 기록을 표시한다 */
  async getSent(senderId: number, handle: string): Promise<SentKongsResponse> {
    if (!handle) {
      throw new BusinessException('VALIDATION_ERROR', HttpStatus.BAD_REQUEST);
    }
    const rows = await this.kongRepository
      .createQueryBuilder('kong')
      .innerJoin('kong.readingLog', 'log')
      .innerJoin('log.user', 'owner')
      .select('kong.readingLogId', 'logId')
      .where('kong.senderId = :senderId', { senderId })
      .andWhere('owner.handle = :handle', { handle })
      .getRawMany<{ logId: string }>();

    return { logIds: rows.map((row) => row.logId) };
  }
}
