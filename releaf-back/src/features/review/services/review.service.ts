import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { Review } from '@/features/review/entities/review.entity';
import {
  ReviewReaction,
  ReviewReactionType,
} from '@/features/review/entities/review-reaction.entity';

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
  ): Promise<Review> {
    const { book, ...reviewData } = createReviewDto;

    return this.dataSource.transaction(async (manager) => {
      if (book) {
        const existingBook = await manager.findOne(Book, {
          where: { isbn: book.isbn },
        });

        if (!existingBook) {
          await manager.save(Book, manager.create(Book, book));
        }
      }

      const review = manager.create(Review, {
        ...reviewData,
        userId,
      });
      return manager.save(Review, review);
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
      const { Brackets } = await import('typeorm');
      qb.andWhere(
        new Brackets((subQb) => {
          tags.forEach((t: string, index: number) => {
            const paramName = `tag_${index}`;
            subQb.orWhere(`review.tags LIKE :${paramName}`, {
              [paramName]: `%${t.trim()}%`,
            });
          });
        }),
      );
    }

    if (search) {
      const { Brackets } = await import('typeorm');
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('review.title LIKE :search', { search: `%${search}%` })
            .orWhere('review.content LIKE :search', { search: `%${search}%` })
            .orWhere('review.tags LIKE :search', { search: `%${search}%` })
            .orWhere('book.title LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    const [reviews, total] = await qb.getManyAndCount();

    return {
      reviews,
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
        relations: ['user', 'book'],
        order: { createdAt: 'DESC' },
        take: 4,
      });

      if (reviews.length > 0) {
        feeds.push({
          category,
          reviews,
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
  async findOne(id: number) {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
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
   * 인기 점수 = (조회수 * 1) + (리액션 수 * 3)
   */
  async findPopular(): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewsRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.book', 'book')
      .leftJoin('review.reactions', 'reaction')
      .addSelect(
        '(COALESCE(review.viewCount, 0) * 1 + COUNT(reaction.id) * 3)',
        'score',
      )
      .groupBy('review.id')
      .addGroupBy('user.id')
      .addGroupBy('book.isbn')
      .orderBy('score', 'DESC')
      .take(5)
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
      reactionCounts: reactionCountsMap.get(review.id) || {
        [ReviewReactionType.LIKE]: 0,
        [ReviewReactionType.INSIGHTFUL]: 0,
        [ReviewReactionType.SUPPORT]: 0,
      },
    }));
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
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    const existingReaction = await this.reviewReactionsRepository.findOne({
      where: { reviewId: id, userId },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        await this.reviewReactionsRepository.remove(existingReaction);
      } else {
        existingReaction.type = type;
        await this.reviewReactionsRepository.save(existingReaction);
      }
    } else {
      const newReaction = this.reviewReactionsRepository.create({
        reviewId: id,
        userId,
        type,
      });
      await this.reviewReactionsRepository.save(newReaction);
    }

    return this.findOne(id);
  }

  /**
   * 리뷰를 수정합니다. 내용이 변경되면 사용되지 않는 이미지를 삭제합니다.
   * @param id 리뷰 ID
   * @param updateReviewDto 수정할 리뷰 정보
   * @param userId 요청한 유저 ID
   * @returns 수정된 리뷰
   */
  async update(id: number, updateReviewDto: UpdateReviewDto, userId: number) {
    const review = await this.findOne(id);

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

    Object.assign(review, updateReviewDto);
    await this.reviewsRepository.save(review);

    if (removedImages.length > 0) {
      await this.reviewImageHelper.deleteImages(removedImages);
    }

    return this.findOne(id);
  }

  /**
   * 리뷰를 삭제합니다. 연관된 이미지도 함께 삭제합니다.
   * @param id 리뷰 ID
   * @param userId 요청한 유저 ID
   * @returns 삭제된 리뷰
   */
  async remove(id: number, userId: number) {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to delete this review',
      );
    }

    const images = this.reviewImageHelper.extractImageUrls(review.content);

    const deletedReview = await this.reviewsRepository.remove(review);

    if (images.length > 0) {
      await this.reviewImageHelper.deleteImages(images);
    }

    return deletedReview;
  }
}
