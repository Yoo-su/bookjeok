import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { Review } from '@/features/review/entities/review.entity';

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
    private reviewImageHelper: ReviewImageHelper,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    userId: number,
  ): Promise<Review> {
    const { book, ...reviewData } = createReviewDto;

    // 책 정보가 있으면 먼저 저장 또는 조회
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

  async findOne(id: number) {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(id: number, updateReviewDto: UpdateReviewDto, userId: number) {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to update this review',
      );
    }

    // 내용이 수정된 경우 이미지 삭제 처리
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

  async remove(id: number, userId: number) {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to delete this review',
      );
    }

    // 리뷰와 연관된 모든 이미지 삭제
    const images = this.reviewImageHelper.extractImageUrls(review.content);
    if (images.length > 0) {
      await this.reviewImageHelper.deleteImages(images);
    }

    return this.reviewsRepository.remove(review);
  }
}
