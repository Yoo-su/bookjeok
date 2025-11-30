import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

    if (book) {
      const existingBook = await this.booksRepository.findOne({
        where: { isbn: book.isbn },
      });

      if (!existingBook) {
        await this.booksRepository.save(this.booksRepository.create(book));
      }
    }

    const review = this.reviewsRepository.create({
      ...reviewData,
      userId,
    });
    return this.reviewsRepository.save(review);
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

    const reactions = await this.reviewReactionsRepository
      .createQueryBuilder('reaction')
      .select('reaction.type')
      .addSelect('COUNT(reaction.id)', 'count')
      .where('reaction.reviewId = :reviewId', { reviewId: id })
      .groupBy('reaction.type')
      .getRawMany();

    const reactionCounts = {
      [ReviewReactionType.LIKE]: 0,
      [ReviewReactionType.INSIGHTFUL]: 0,
      [ReviewReactionType.SUPPORT]: 0,
    };

    reactions.forEach((r) => {
      reactionCounts[r.reaction_type] = parseInt(r.count, 10);
    });

    return {
      ...review,
      reactionCounts,
    };
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

    if (updateReviewDto.content && updateReviewDto.content !== review.content) {
      const removedImages = this.reviewImageHelper.getRemovedImages(
        review.content,
        updateReviewDto.content,
      );
      if (removedImages.length > 0) {
        await this.reviewImageHelper.deleteImages(removedImages);
      }
    }

    Object.assign(review, updateReviewDto);
    return this.reviewsRepository.save(review);
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
    if (images.length > 0) {
      await this.reviewImageHelper.deleteImages(images);
    }

    return this.reviewsRepository.remove(review);
  }
}
