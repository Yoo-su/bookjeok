import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, EntityManager } from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { Review } from '@/features/review/entities/review.entity';
import {
  ReviewReaction,
  ReviewReactionType,
} from '@/features/review/entities/review-reaction.entity';
import { Tag } from '@/features/review/entities/tag.entity';

import { ReviewImageHelper } from '../helpers/review-image.helper';

import { CreateReviewDto } from '../dto/create-review.dto';
import { GetReviewsQueryDto } from '../dto/get-reviews-query.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { BOOK_DOMAINS } from '../constants';
import {
  GetReviewsResponseDto,
  ReviewFeedDto,
  ReviewResponseDto,
} from '../dto/review-response.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    @InjectRepository(ReviewReaction)
    private reviewReactionsRepository: Repository<ReviewReaction>,
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
    private reviewImageHelper: ReviewImageHelper,
    private dataSource: DataSource,
  ) {}

  /**
   * 리뷰를 생성합니다. 책 정보가 없으면 새로 생성합니다.
   * @param createReviewDto 리뷰 생성 DTO
   * @param userId 작성자 ID
   * @returns 생성된 리뷰
   */
  async create(
    createReviewDto: CreateReviewDto,
    userId: number,
  ): Promise<ReviewResponseDto> {
    const { book, tags, ...reviewData } = createReviewDto;

    return this.dataSource.transaction(async (manager: EntityManager) => {
      if (book) {
        const existingBook = await manager.findOne(Book, {
          where: { isbn: book.isbn },
        });

        if (!existingBook) {
          await manager.save(Book, manager.create(Book, book));
        }
      }

      // 태그 처리
      let tagEntities: Tag[] = [];
      if (tags && tags.length > 0) {
        tagEntities = await this.getOrCreateTags(manager, tags);
      }

      const review = manager.create(Review, {
        ...reviewData,
        userId,
        tagEntities,
      });
      const savedReview = await manager.save(Review, review);

      // DTO로 변환하여 반환
      return {
        ...savedReview,
        tags: tags || [],
      } as ReviewResponseDto;
    });
  }

  private async getOrCreateTags(
    manager: EntityManager,
    tagNames: string[],
  ): Promise<Tag[]> {
    if (tagNames.length === 0) return [];

    // 1. 중복 무시하고 일괄 INSERT (ON CONFLICT DO NOTHING)
    await manager
      .createQueryBuilder()
      .insert()
      .into(Tag)
      .values(tagNames.map((name) => ({ name })))
      .orIgnore()
      .execute();

    // 2. 전체 태그 조회
    // manager.find(Tag, { where: { name: In(tagNames) } }) 와 같음
    // 트랜잭션 매니저를 사용해야 하므로 createQueryBuilder 사용 권장
    return await manager.find(Tag, {
      where: { name: In(tagNames) },
    });
  }

  /**
   * 조건에 따라 리뷰 목록을 조회합니다.
   * @param query 검색 조건 DTO
   * @returns 리뷰 목록 및 메타데이터
   */
  async findAll(query: GetReviewsQueryDto): Promise<GetReviewsResponseDto> {
    const { page = 1, limit = 10, bookIsbn, tag, search, category } = query;
    const skip = (page - 1) * limit;

    const qb = this.reviewsRepository.createQueryBuilder('review');
    qb.leftJoinAndSelect('review.user', 'user');
    qb.leftJoinAndSelect('review.book', 'book');
    qb.leftJoinAndSelect('review.tagEntities', 'tags'); // 태그 엔티티 로드
    qb.orderBy('review.createdAt', 'DESC');
    qb.skip(skip);
    qb.take(limit);

    if (bookIsbn) {
      qb.andWhere('review.bookIsbn = :bookIsbn', { bookIsbn });
    }

    if (category) {
      qb.andWhere('review.category = :category', { category });
    }

    if (query.userId) {
      qb.andWhere('review.userId = :userId', { userId: query.userId });
    }

    if (tag) {
      const tags = Array.isArray(tag) ? tag : tag.split(',');
      // 태그 테이블과 조인하여 검색 (인덱스 활용)
      // 이미 위에서 leftJoinAndSelect로 'tags' 알리어스를 썼으므로 여기서는 필터링만 함
      // 하지만 필터링을 위해 innerJoin을 쓰면 결과가 줄어들 수 있음.
      // 검색 조건에 맞는 리뷰만 가져오되, 그 리뷰의 *모든* 태그를 가져와야 함.
      // 따라서 필터링용 조인은 별도로 하거나, 서브쿼리를 써야 함.
      // 간단하게는:
      qb.innerJoin(
        'review.tagEntities',
        'filterTag',
        'filterTag.name IN (:...searchTags)',
        { searchTags: tags.map((t: string) => t.trim()) },
      );
    }

    if (search) {
      const { Brackets } = await import('typeorm');
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('review.title LIKE :search', { search: `%${search}%` })
            .orWhere('review.content LIKE :search', { search: `%${search}%` })
            // 태그 이름으로 검색 (조인된 테이블 사용)
            .orWhere('tags.name LIKE :search', { search: `%${search}%` })
            .orWhere('book.title LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    const [reviews, total] = await qb.getManyAndCount();

    // 태그 엔티티를 문자열 배열로 변환하여 DTO 매핑
    const reviewDtos = reviews.map((review) => ({
      ...review,
      tags: review.tagEntities?.map((t) => t.name) || [],
    })) as ReviewResponseDto[];

    return {
      reviews: reviewDtos,
      total,
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 카테고리별 최신 리뷰 피드를 조회합니다.
   * @returns 카테고리별 리뷰 피드 목록
   */
  async findFeeds(): Promise<ReviewFeedDto[]> {
    const categories = BOOK_DOMAINS;
    const feeds: ReviewFeedDto[] = [];

    for (const category of categories) {
      const reviews = await this.reviewsRepository.find({
        where: { category },
        relations: ['user', 'book', 'tagEntities'],
        order: { createdAt: 'DESC' },
        take: 4,
      });

      if (reviews.length > 0) {
        // 태그 매핑
        const reviewDtos = reviews.map((review) => ({
          ...review,
          tags: review.tagEntities?.map((t) => t.name) || [],
        })) as ReviewResponseDto[];

        feeds.push({
          category,
          reviews: reviewDtos,
        });
      }
    }

    return feeds;
  }

  /**
   * ID로 리뷰를 조회합니다.
   * @param id 리뷰 ID
   * @param userId 요청한 유저 ID (옵션)
   * @returns 리뷰 엔티티 (리액션 정보 포함)
   */
  async findOne(id: number): Promise<ReviewResponseDto> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'book', 'tagEntities'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
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
   * 인기 점수 = (조회수 * 1) + (리액션 수 * 3)
   */
  async findPopular(): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewsRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.book', 'book')
      .leftJoinAndSelect('review.tagEntities', 'tagEntities')
      .addSelect(
        '(COALESCE(review.viewCount, 0) * 1 + COALESCE(review.reactionCount, 0) * 3)',
        'score',
      )
      .orderBy('score', 'DESC')
      .take(5)
      .getMany();

    return this.attachReactionCounts(reviews);
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
    await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(Review, { where: { id } });
      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }

      const existingReaction = await manager.findOne(ReviewReaction, {
        where: { reviewId: id, userId },
      });

      if (existingReaction) {
        if (existingReaction.type === type) {
          // 리액션 삭제 (같은 타입 클릭 시)
          await manager.remove(ReviewReaction, existingReaction);
          await manager.decrement(Review, { id }, 'reactionCount', 1);
        } else {
          // 리액션 변경
          existingReaction.type = type;
          await manager.save(ReviewReaction, existingReaction);
          // 카운트 변경 없음
        }
      } else {
        // 새 리액션 추가
        const newReaction = manager.create(ReviewReaction, {
          reviewId: id,
          userId,
          type,
        });
        await manager.save(ReviewReaction, newReaction);
        await manager.increment(Review, { id }, 'reactionCount', 1);
      }
    });

    return this.findOne(id);
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
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'book', 'tagEntities'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    if (review.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to update this review',
      );
    }

    let removedImages: string[] = [];
    if (updateReviewDto.content && updateReviewDto.content !== review.content) {
      removedImages = this.reviewImageHelper.getRemovedImages(
        review.content,
        updateReviewDto.content,
      );
    }

    // 태그 업데이트 처리
    if (updateReviewDto.tags) {
      // 트랜잭션 없이 처리 (간단하게) 또는 트랜잭션 래핑 필요.
      // 여기서는 간단히 처리.
      review.tagEntities = await this.getOrCreateTags(
        this.dataSource.manager,
        updateReviewDto.tags,
      );
    }

    Object.assign(review, {
      ...updateReviewDto,
      tags: undefined, // tags 속성은 엔티티에 없으므로 제외 (DTO에서만 사용)
    });

    const savedReview = await this.reviewsRepository.save(review);

    if (removedImages.length > 0) {
      await this.reviewImageHelper.deleteImages(removedImages);
    }

    return {
      ...savedReview,
      tags: savedReview.tagEntities?.map((t) => t.name) || [],
    } as ReviewResponseDto;
  }

  /**
   * 리뷰를 삭제합니다. 연관된 이미지도 함께 삭제합니다.
   * @param id 리뷰 ID
   * @param userId 요청한 유저 ID
   * @returns 삭제된 리뷰
   */
  async remove(id: number, userId: number): Promise<ReviewResponseDto> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'book', 'tagEntities'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    if (review.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to delete this review',
      );
    }

    const images = this.reviewImageHelper.extractImageUrls(review.content);

    // 삭제 전 태그 정보 백업 (반환용)
    const tags = review.tagEntities?.map((t) => t.name) || [];

    const deletedReview = await this.reviewsRepository.remove(review);

    if (images.length > 0) {
      await this.reviewImageHelper.deleteImages(images);
    }

    return {
      ...deletedReview,
      tags,
    } as ReviewResponseDto;
  }
}
