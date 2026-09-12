import { BOOK_DOMAINS } from '@bookjeok/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Brackets, EntityManager, In, Repository } from 'typeorm';

import { Review } from '@/features/review/entities/review.entity';
import {
  ReviewReaction,
  ReviewReactionType,
} from '@/features/review/entities/review-reaction.entity';
import { Tag } from '@/features/review/entities/tag.entity';
import { BusinessException } from '@/shared/exceptions';

import { POPULAR_REVIEW_MONTHS } from '../constants';
import { CreateReviewDto } from '../dtos/create-review.dto';
import { GetReviewsQueryDto } from '../dtos/get-reviews-query.dto';
import {
  GetReviewsResponseDto,
  ReviewFeedDto,
  ReviewResponseDto,
} from '../dtos/review-response.dto';
import { UpdateReviewDto } from '../dtos/update-review.dto';
import { ReviewImageHelper } from '../helpers/review-image.helper';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(ReviewReaction)
    private reviewReactionsRepository: Repository<ReviewReaction>,
    private reviewImageHelper: ReviewImageHelper,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 리뷰를 생성합니다.
   *
   * @param createReviewDto 리뷰 생성 DTO
   * @param userId 작성자 ID
   * @returns 생성된 리뷰
   */
  @Transactional()
  async create(
    createReviewDto: CreateReviewDto,
    userId: number,
  ): Promise<ReviewResponseDto> {
    const { isbn, tags, ...reviewData } = createReviewDto;
    const manager = this.txHost.tx;

    // 태그 처리
    let tagEntities: Tag[] = [];
    if (tags && tags.length > 0) {
      tagEntities = await this.getOrCreateTags(manager, tags);
    }

    const review = manager.create(Review, {
      ...reviewData,
      isbn,
      userId,
      tagEntities,
    });
    const savedReview = await manager.save(Review, review);

    // 저장 후 도서·유저 정보를 포함하여 다시 조회
    const fullReview = await manager.findOne(Review, {
      where: { id: savedReview.id },
      relations: ['user', 'book', 'tagEntities'],
    });

    return {
      ...fullReview!,
      tags: fullReview?.tagEntities?.map((t) => t.name) || tags || [],
    } as ReviewResponseDto;
  }

  private async getOrCreateTags(
    manager: EntityManager,
    tagNames: string[],
  ): Promise<Tag[]> {
    if (tagNames.length === 0) return [];

    // 1. 중복 제거 (유니크 위반 방지)
    const uniqueTagNames = [...new Set(tagNames)];

    // 2. 중복 무시하고 일괄 INSERT (ON CONFLICT DO NOTHING)
    await manager
      .createQueryBuilder()
      .insert()
      .into(Tag)
      .values(uniqueTagNames.map((name) => ({ name })))
      .orIgnore()
      .execute();

    // 3. 전체 태그 조회
    return await manager.find(Tag, {
      where: { name: In(uniqueTagNames) },
    });
  }

  /**
   * 조건에 따라 리뷰 목록을 조회합니다.
   * @param query 검색 조건 DTO
   * @returns 리뷰 목록 및 메타데이터
   */
  async findAll(query: GetReviewsQueryDto): Promise<GetReviewsResponseDto> {
    const {
      page = 1,
      limit = 10,
      isbn,
      tag,
      search,
      category,
      userId,
      excludeId,
      cursorId,
    } = query;

    const qb = this.reviewsRepository.createQueryBuilder('review');
    qb.leftJoinAndSelect('review.user', 'user');
    qb.leftJoinAndSelect('review.book', 'book');
    qb.leftJoinAndSelect('review.tagEntities', 'tags');

    // 1. 필터링 조건 먼저 적용
    if (isbn) {
      qb.andWhere('review.isbn = :isbn', { isbn });
    }

    if (category) {
      qb.andWhere('review.category = :category', { category });
    }

    if (userId) {
      // 특정 사용자의 리뷰 목록 조회 (본인 리뷰 포함 비공개도 보임)
      qb.andWhere('review.userId = :userId', { userId });
    } else {
      // 일반 리뷰 목록 조회 시 공개 리뷰만 표시
      qb.andWhere('review.isPublic = :isPublic', { isPublic: true });
    }

    if (excludeId) {
      qb.andWhere('review.id != :excludeId', { excludeId });
    }

    // 태그 검색 (Inner Join으로 필터링)
    if (tag) {
      const tags = (Array.isArray(tag) ? tag : tag.split(',')).map(
        (t: string) => t.trim(),
      );
      qb.innerJoin(
        'review.tagEntities',
        'filterTag',
        'filterTag.name IN (:...searchTags)',
        { searchTags: tags },
      );
    }

    // 키워드 검색
    if (search) {
      // ILIKE를 쓴다. Postgres의 LIKE는 대소문자를 가려서 영문 제목·작가명이
      // 입력 표기와 정확히 같을 때만 검색된다.
      qb.andWhere(
        new Brackets((subQb) => {
          const searchParam = { search: `%${search}%` };
          subQb
            .where('review.title ILIKE :search', searchParam)
            .orWhere('review.content ILIKE :search', searchParam)
            .orWhere('tags.name ILIKE :search', searchParam)
            .orWhere('book.title ILIKE :search', searchParam)
            .orWhere('user.nickname ILIKE :search', searchParam);
        }),
      );
    }

    // 2. 정렬 조건 (커서 기반 페이지네이션을 위해 ID 역순 정렬)
    qb.orderBy('review.id', 'DESC');

    // 3. 커서 기반 페이지네이션 (필터 조건 적용 후)
    if (cursorId) {
      qb.andWhere('review.id < :cursorId', { cursorId });
    } else {
      // 오프셋 기반 (fallback)
      qb.skip((page - 1) * limit);
    }

    // limit + 1개를 조회하여 다음 페이지 존재 여부 판별 (COUNT 쿼리 제거)
    qb.take(limit + 1);

    const reviews = await qb.getMany();

    // 페이지네이션 정보 계산
    const hasNextPage = reviews.length > limit;
    if (hasNextPage) {
      reviews.pop(); // 초과 조회분 제거
    }

    const reviewDtos = reviews.map((review) => ({
      ...review,
      tags: review.tagEntities?.map((t) => t.name) || [],
    })) as ReviewResponseDto[];

    let nextCursor: number | null = null;

    if (hasNextPage && reviews.length > 0) {
      nextCursor = reviews[reviews.length - 1].id;
    }

    return {
      reviews: reviewDtos,
      page: +page,
      limit: +limit,
      hasNextPage,
      nextCursor: nextCursor ?? undefined,
    };
  }

  /**
   * 카테고리별 최신 리뷰 피드를 조회합니다.
   * @returns 카테고리별 리뷰 피드 목록
   */
  async findFeeds(): Promise<ReviewFeedDto[]> {
    // 1. 각 카테고리별 최신 리뷰 4개씩 조회 (윈도우 함수 활용)
    const rawReviews = await this.getRawFeedReviews(4);

    // 2. 리액션 카운트 정보 첨부
    const reviewsWithReactions = await this.attachReactionCounts(rawReviews);

    // 3. 카테고리별로 그룹화 및 피드 구성
    return this.buildReviewFeeds(reviewsWithReactions);
  }

  /**
   * 윈도우 함수(ROW_NUMBER)를 사용하여 카테고리별 최신 리뷰를 일괄 조회합니다.
   */
  private async getRawFeedReviews(limitPerCategory: number): Promise<Review[]> {
    return await this.reviewsRepository
      .createQueryBuilder('review')
      .select([
        'review.id',
        'review.title',
        'review.category',
        'review.content',
        'review.rating',
        'review.viewCount',
        'review.reactionCount',
        'review.userId',
        'review.isbn',
        'review.isPublic',
        'review.createdAt',
      ])
      .innerJoinAndSelect('review.user', 'user')
      .innerJoinAndSelect('review.book', 'book')
      .leftJoinAndSelect('review.tagEntities', 'tag')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('r.id', 'fid')
          .from(Review, 'r')
          .addSelect(
            'ROW_NUMBER() OVER(PARTITION BY r."category" ORDER BY r."createdAt" DESC)',
            'rn',
          )
          .where('r."isPublic" = :isPublic', { isPublic: true })
          .getQuery();
        return `review.id IN (SELECT fid FROM (${subQuery}) t WHERE rn <= :limit)`;
      })
      .setParameter('limit', limitPerCategory)
      .orderBy('review.category', 'ASC')
      .addOrderBy('review.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 리뷰 목록을 카테고리별 피드 DTO 구조로 변환합니다.
   */
  private buildReviewFeeds(reviews: ReviewResponseDto[]): ReviewFeedDto[] {
    const feedMap = new Map<string, ReviewResponseDto[]>();

    reviews.forEach((review) => {
      if (!feedMap.has(review.category)) {
        feedMap.set(review.category, []);
      }
      feedMap.get(review.category)?.push(review);
    });

    const feeds: ReviewFeedDto[] = BOOK_DOMAINS.map((category) => ({
      category,
      reviews: feedMap.get(category) || [],
    })).filter((feed) => feed.reviews.length > 0);

    return feeds;
  }

  /**
   * ID로 리뷰를 조회합니다.
   * 비공개 리뷰는 작성자 본인만 조회 가능합니다.
   * @param id 리뷰 ID
   * @param userId 요청한 유저 ID (옵션, 비공개 리뷰 접근 권한 확인용)
   * @returns 리뷰 엔티티 (리액션 정보 포함)
   */
  async findOne(id: number, userId?: number): Promise<ReviewResponseDto> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'book', 'tagEntities'],
    });

    if (!review) {
      throw new BusinessException('REVIEW_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 비공개 리뷰 접근 시 마스킹 처리 (에러 X)
    // 작성자 본인이 아니면 내용을 가려서 반환
    if (!review.isPublic && review.userId !== userId) {
      review.content = '';
    }

    const [reviewWithCounts] = await this.attachReactionCounts([review]);

    return reviewWithCounts;
  }

  /**
   * 리뷰 ID로 리뷰 내용을 조회합니다. (삭제된 리뷰도 null 반환)
   */
  async findReviewById(id: number): Promise<Review | null> {
    return await this.reviewsRepository.findOne({
      where: { id },
      relations: ['book'],
    });
  }

  /**
   * 리뷰 ID 목록으로 여러 리뷰를 일괄 조회합니다. (N+1 쿼리 최적화용)
   */
  async findReviewsByIds(ids: number[]): Promise<Review[]> {
    if (ids.length === 0) return [];
    return await this.reviewsRepository.find({
      where: { id: In(ids) },
      relations: ['book'],
    });
  }

  /**
   * 수정을 위한 리뷰 조회 (소유권 검증 포함)
   * 본인의 리뷰만 조회 가능하며, 타인의 리뷰 접근 시 403 FORBIDDEN을 반환합니다.
   * @param id 리뷰 ID
   * @param userId 요청자 ID
   * @returns 리뷰 정보 (본인 리뷰만)
   */
  async findOneForEdit(id: number, userId: number): Promise<ReviewResponseDto> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'book', 'tagEntities'],
    });

    if (!review) {
      throw new BusinessException('REVIEW_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (review.userId !== userId) {
      throw new BusinessException('REVIEW_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const [reviewWithCounts] = await this.attachReactionCounts([review]);

    return reviewWithCounts;
  }

  /**
   * 리뷰 조회수를 증가시킵니다.
   * @param id 리뷰 ID
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.reviewsRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 인기 리뷰를 조회합니다.
   * 최근 POPULAR_REVIEW_MONTHS개월 내 참여도(조회수+리액션+댓글) 높은 순으로 6개 반환
   */
  async findPopular(): Promise<ReviewResponseDto[]> {
    // 1. 참여도가 높은 리뷰 ID 목록 조회
    const idResults = await this.getPopularReviewIdsWithScores(6);
    if (idResults.length === 0) return [];

    const ids = idResults.map((r) => r.id);

    // 2. 엔티티 상세 조회 (ID 순서 유지)
    const sortedReviews = await this.findReviewsByIdsInOrder(ids);

    // 3. 리액션 정보 첨부하여 반환
    return this.attachReactionCounts(sortedReviews);
  }

  /**
   * 최근 POPULAR_REVIEW_MONTHS개월간의 참여도(조회수, 리액션, 댓글)를
   * 점수화하여 인기 리뷰 ID를 조회합니다.
   */
  private async getPopularReviewIdsWithScores(
    limit: number,
  ): Promise<{ id: number; score: number }[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - POPULAR_REVIEW_MONTHS);

    return await this.reviewsRepository
      .createQueryBuilder('review')
      .select('review.id', 'id')
      .leftJoin(
        (qb) =>
          qb
            .select('c."targetId"', 'targetid')
            .addSelect('COUNT(*)', 'count')
            .from('comments', 'c')
            .where('c."targetType" = :targetType', { targetType: 'REVIEW' })
            .groupBy('c."targetId"'),
        'comment_counts',
        'comment_counts.targetid = CAST(review.id AS VARCHAR)',
      )
      .leftJoin(
        (qb) =>
          qb
            .select('re."reviewId"', 'reviewid')
            .addSelect('COUNT(*)', 'count')
            .from('review_reactions', 're')
            .groupBy('re."reviewId"'),
        'reaction_counts',
        'reaction_counts.reviewid = review.id',
      )
      .addSelect(
        `(COALESCE(review."viewCount", 0) + 
          COALESCE(reaction_counts.count, 0) * 3 + 
          COALESCE(comment_counts.count, 0) * 5)`,
        'score',
      )
      .where('review."createdAt" >= :since', { since })
      .andWhere('review."isPublic" = :isPublic', { isPublic: true })
      .orderBy('score', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /**
   * 보충: ID 목록에 해당하는 리뷰를 주어진 ID 순서대로 조회합니다.
   */
  private async findReviewsByIdsInOrder(ids: number[]): Promise<Review[]> {
    const reviews = await this.reviewsRepository.find({
      where: { id: In(ids) },
      relations: ['user', 'book', 'tagEntities'],
    });

    const reviewMap = new Map(reviews.map((r) => [r.id, r]));
    return ids.map((id) => reviewMap.get(id)).filter((r): r is Review => !!r);
  }

  /**
   * 추천 리뷰를 조회합니다. (같은 작가의 다른 책 + 같은 카테고리)
   * @param id 기준 리뷰 ID
   * @returns 추천 리뷰 목록
   */
  async getRecommendedReviews(id: number): Promise<ReviewResponseDto[]> {
    const currentReview = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['book'],
    });

    if (!currentReview) {
      throw new BusinessException('REVIEW_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const { book, category } = currentReview;
    const author = book.author;
    const limit = 4;
    const recommendations: Review[] = [];

    // 1. 같은 작가가 쓴 다른 책의 리뷰 조회 (최대 2개)
    if (author) {
      const authorReviews = await this.reviewsRepository
        .createQueryBuilder('review')
        .leftJoinAndSelect('review.user', 'user')
        .leftJoinAndSelect('review.book', 'book')
        .leftJoinAndSelect('review.tagEntities', 'tagEntities')
        .where('review.id != :id', { id })
        .andWhere('book.author = :author', { author })
        .andWhere('book.isbn != :isbn', { isbn: book.isbn }) // 같은 책 제외
        .andWhere('review.isPublic = :isPublic', { isPublic: true })
        .orderBy('review.createdAt', 'DESC')
        .take(2)
        .getMany();

      recommendations.push(...authorReviews);
    }

    // 2. 나머지는 같은 카테고리의 최신 리뷰로 채움
    const remainingLimit = limit - recommendations.length;

    if (remainingLimit > 0) {
      const excludedIds = [id, ...recommendations.map((r) => r.id)];

      const categoryReviews = await this.reviewsRepository
        .createQueryBuilder('review')
        .leftJoinAndSelect('review.user', 'user')
        .leftJoinAndSelect('review.book', 'book')
        .leftJoinAndSelect('review.tagEntities', 'tagEntities')
        .where('review.id NOT IN (:...ids)', { ids: excludedIds })
        .andWhere('review.category = :category', { category })
        .andWhere('review.isPublic = :isPublic', { isPublic: true })
        .orderBy('review.createdAt', 'DESC')
        .take(remainingLimit)
        .getMany();

      recommendations.push(...categoryReviews);
    }

    return this.attachReactionCounts(recommendations);
  }

  /**
   * 리뷰 목록에 리액션 카운트 정보를 첨부합니다.
   * @param reviews 리뷰 목록
   * @returns 리액션 카운트가 포함된 리뷰 목록
   */
  private async attachReactionCounts(
    reviews: Review[],
  ): Promise<ReviewResponseDto[]> {
    if (reviews.length === 0) return [];

    const reviewIds = reviews.map((review) => review.id);

    const reactions = await this.reviewReactionsRepository
      .createQueryBuilder('reaction')
      .select('reaction.reviewId', 'reviewId')
      .addSelect('reaction.type', 'type')
      .addSelect('COUNT(reaction.id)', 'count')
      .where('reaction.reviewId IN (:...ids)', { ids: reviewIds })
      .groupBy('reaction.reviewId')
      .addGroupBy('reaction.type')
      .getRawMany();

    const reactionCountsMap = new Map<
      number,
      { [key in ReviewReactionType]: number }
    >();

    reactions.forEach((r) => {
      const reviewId = r.reviewId;
      const type = r.type;
      const count = parseInt(r.count, 10);

      if (!reactionCountsMap.has(reviewId)) {
        reactionCountsMap.set(reviewId, {
          [ReviewReactionType.LIKE]: 0,
          [ReviewReactionType.INSIGHTFUL]: 0,
          [ReviewReactionType.SUPPORT]: 0,
        });
      }

      const counts = reactionCountsMap.get(reviewId);
      if (counts) {
        counts[type] = count;
      }
    });

    return reviews.map((review) => ({
      ...review,
      tags: review.tagEntities?.map((t) => t.name) || [],
      reactionCounts: reactionCountsMap.get(review.id) || {
        [ReviewReactionType.LIKE]: 0,
        [ReviewReactionType.INSIGHTFUL]: 0,
        [ReviewReactionType.SUPPORT]: 0,
      },
    })) as ReviewResponseDto[];
  }

  /**
   * 사용자의 리액션 정보를 조회합니다.
   * @param id 리뷰 ID
   * @param userId 유저 ID
   * @returns 사용자의 리액션 타입 (없으면 null)
   */
  async getMyReaction(
    id: number,
    userId: number,
  ): Promise<ReviewReactionType | null> {
    const reaction = await this.reviewReactionsRepository.findOne({
      where: { reviewId: id, userId },
    });
    return reaction ? reaction.type : null;
  }

  /**
   * 리뷰에 리액션을 토글합니다.
   * @param id 리뷰 ID
   * @param userId 유저 ID
   * @param type 리액션 타입
   */
  async toggleReaction(id: number, userId: number, type: ReviewReactionType) {
    const isAdded = await this.persistReactionToggle(id, userId, type);

    // 커밋된 뒤에 읽고 발행한다. 트랜잭션 안에서 하면 롤백된 리액션에 대한
    // 알림이 남고, 아직 커밋되지 않은 reactionCount를 읽어 보낸다.
    const result = await this.findOne(id);

    this.eventEmitter.emit('review.reacted', {
      review: result,
      actorId: userId,
      isAdded,
    });

    return result;
  }

  /**
   * 리액션 토글의 상태 변경만 트랜잭션 안에서 수행합니다.
   * @returns 리액션이 추가/유지되었으면 true, 취소되었으면 false
   */
  @Transactional()
  private async persistReactionToggle(
    id: number,
    userId: number,
    type: ReviewReactionType,
  ): Promise<boolean> {
    let isAdded = true;
    const manager = this.txHost.tx;

    const review = await manager.findOne(Review, { where: { id } });
    if (!review) {
      throw new BusinessException('REVIEW_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (!review.isPublic && review.userId !== userId) {
      throw new BusinessException('REVIEW_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const existingReaction = await manager.findOne(ReviewReaction, {
      where: { reviewId: id, userId },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // 리액션 삭제 (같은 타입 클릭 시): 실제로 삭제된 경우에만 reactionCount 감소
        const deleteResult = await manager.delete(
          ReviewReaction,
          existingReaction.id,
        );
        if (deleteResult.affected && deleteResult.affected > 0) {
          await manager.decrement(Review, { id }, 'reactionCount', 1);
        }
        isAdded = false;
      } else {
        // 리액션 변경
        existingReaction.type = type;
        await manager.save(ReviewReaction, existingReaction);
        // 카운트 변경 없음
      }
    } else {
      // 새 리액션 추가: orIgnore()로 동시 요청 시 유니크 충돌(23505) 방어
      const insertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(ReviewReaction)
        .values({
          reviewId: id,
          userId,
          type,
        })
        .orIgnore()
        .execute();

      if (insertResult.identifiers?.length > 0 && insertResult.identifiers[0]) {
        await manager.increment(Review, { id }, 'reactionCount', 1);
      }
      isAdded = true;
    }

    return isAdded;
  }

  /**
   * 리뷰를 수정합니다. 내용이 변경되면 사용되지 않는 이미지를 삭제합니다.
   * @param id 리뷰 ID
   * @param updateReviewDto 수정할 리뷰 정보
   * @param userId 요청한 유저 ID
   * @returns 수정된 리뷰
   */
  async update(
    id: number,
    updateReviewDto: UpdateReviewDto,
    userId: number,
  ): Promise<ReviewResponseDto> {
    const { saved, removedImages } = await this.persistUpdate(
      id,
      updateReviewDto,
      userId,
    );

    // 스토리지 삭제는 되돌릴 수 없으므로 커밋된 뒤에 한다. 트랜잭션 안에서
    // 지우면 이후 롤백된 리뷰가 이미지 없는 상태로 남는다.
    if (removedImages.length > 0) {
      await this.reviewImageHelper.deleteImages(removedImages);
    }

    return saved;
  }

  @Transactional()
  private async persistUpdate(
    id: number,
    updateReviewDto: UpdateReviewDto,
    userId: number,
  ): Promise<{ saved: ReviewResponseDto; removedImages: string[] }> {
    const manager = this.txHost.tx;

    const review = await manager.findOne(Review, {
      where: { id },
      relations: ['user', 'book', 'tagEntities'],
    });

    if (!review) {
      throw new BusinessException('REVIEW_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (review.userId !== userId) {
      throw new BusinessException('REVIEW_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    let removedImages: string[] = [];
    if (updateReviewDto.content && updateReviewDto.content !== review.content) {
      removedImages = this.reviewImageHelper.getRemovedImages(
        review.content,
        updateReviewDto.content,
      );
    }

    // 태그 업데이트 및 리뷰 수정을 단일 트랜잭션으로 원자적 처리
    if (updateReviewDto.tags) {
      review.tagEntities = await this.getOrCreateTags(
        manager,
        updateReviewDto.tags,
      );
    }

    Object.assign(review, {
      ...updateReviewDto,
      tags: undefined, // tags 속성은 엔티티에 없으므로 제외 (DTO에서만 사용)
    });

    const savedReview = await manager.save(Review, review);

    return {
      saved: {
        ...savedReview,
        tags: savedReview.tagEntities?.map((t) => t.name) || [],
      } as ReviewResponseDto,
      removedImages,
    };
  }

  /**
   * 리뷰를 삭제합니다. 연관된 이미지도 함께 삭제합니다.
   * @param id 리뷰 ID
   * @param userId 요청한 유저 ID
   * @returns 삭제된 리뷰
   */
  async remove(
    id: number,
    userId: number,
    userRole?: string,
  ): Promise<ReviewResponseDto> {
    const { deleted, images } = await this.persistRemove(id, userId, userRole);

    // 스토리지 삭제는 커밋 뒤에. 먼저 지웠다가 삭제가 롤백되면 본문은 남고
    // 이미지만 사라진 리뷰가 된다.
    if (images.length > 0) {
      await this.reviewImageHelper.deleteImages(images);
    }

    return deleted;
  }

  @Transactional()
  private async persistRemove(
    id: number,
    userId: number,
    userRole?: string,
  ): Promise<{ deleted: ReviewResponseDto; images: string[] }> {
    const manager = this.txHost.tx;

    const review = await manager.findOne(Review, {
      where: { id },
      relations: ['user', 'book', 'tagEntities'],
    });

    if (!review) {
      throw new BusinessException('REVIEW_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (review.userId !== userId && userRole !== 'ADMIN') {
      throw new BusinessException('REVIEW_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const images = this.reviewImageHelper.extractImageUrls(review.content);

    // 삭제 전 태그 정보 백업 (반환용)
    const tags = review.tagEntities?.map((t) => t.name) || [];

    const deletedReview = await manager.remove(Review, review);

    return {
      deleted: { ...deletedReview, tags } as ReviewResponseDto,
      images,
    };
  }
}
