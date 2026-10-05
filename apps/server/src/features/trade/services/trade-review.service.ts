import {
  isTradeReviewTagAllowed,
  TRADE_REVIEW_TAG_SPECS,
  TradeReviewTag,
  TradeReviewTargetRole,
} from '@bookjeok/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { tradeReviewCreatedEvent } from '@/features/trade/events/trade-review-created.event';
import { User } from '@/features/user/entities/user.entity';
import { emitDomainEvent } from '@/shared/events/domain-event';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { REVIEW_EXPIRATION_MS } from '../constants';
import { CreateTradeReviewDto } from '../dtos/create-trade-review.dto';
import { QueryTradeReviewDto } from '../dtos/query-trade-review.dto';
import { UpdateTradeReviewDto } from '../dtos/update-trade-review.dto';
import {
  TradeCompletion,
  TradeCompletionMethod,
} from '../entities/trade-completion.entity';
import { TradeReview } from '../entities/trade-review.entity';

export interface SellerTradeStats {
  totalCompletedSales: number;
  directCompletedSales: number;
  deliveryCompletedSales: number;
  totalReviews: number;
  positiveRate: number;
  tagCounts: Record<string, number>;
}

const POSITIVE_TAGS = new Set<string>(
  Object.entries(TRADE_REVIEW_TAG_SPECS)
    .filter(([, spec]) => spec.sentiment === 'POSITIVE')
    .map(([tag]) => tag),
);

@Injectable()
export class TradeReviewService {
  constructor(
    @InjectRepository(TradeReview)
    private readonly tradeReviewRepository: Repository<TradeReview>,
    @InjectRepository(TradeCompletion)
    private readonly tradeCompletionRepository: Repository<TradeCompletion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 거래 후기를 작성합니다.
   *
   * 완료된 거래의 당사자 양쪽 모두 상대에게 한 건씩 쓸 수 있고,
   * 거래 완료 후 14일 이내에만 가능합니다.
   */
  async createReview(
    reviewerId: number,
    dto: CreateTradeReviewDto,
  ): Promise<TradeReview> {
    const { completionId, tags, content } = dto;

    const completion = await this.loadCompletion(completionId);
    const { targetUserId, targetRole } = this.resolveCounterparty(
      completion,
      reviewerId,
    );

    this.assertNotExpired(completion.completedAt);
    this.assertTagsAllowed(tags, targetRole, completion.method);

    const existing = await this.tradeReviewRepository.findOne({
      where: { completionId, reviewerId },
    });
    if (existing) {
      throw new BusinessException(
        'TRADE_REVIEW_ALREADY_EXISTS',
        HttpStatus.CONFLICT,
      );
    }

    const review = this.tradeReviewRepository.create({
      completionId,
      reviewerId,
      targetUserId,
      tags,
      content: content || null,
    });

    const savedReview = await this.tradeReviewRepository.save(review);

    emitDomainEvent(this.eventEmitter, tradeReviewCreatedEvent, {
      reviewId: savedReview.id,
      completionId,
      targetUserId,
      reviewerId,
    });

    return savedReview;
  }

  /**
   * 작성한 거래 후기를 수정합니다. 작성자 본인만 14일 이내에 가능합니다.
   */
  async updateReview(
    reviewId: number,
    userId: number,
    dto: UpdateTradeReviewDto,
  ): Promise<TradeReview> {
    const review = await this.tradeReviewRepository.findOne({
      where: { id: reviewId },
      relations: ['completion'],
    });

    if (!review) {
      throw new BusinessException(
        'TRADE_REVIEW_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (review.reviewerId !== userId) {
      throw new BusinessException(
        'TRADE_REVIEW_FORBIDDEN',
        HttpStatus.FORBIDDEN,
      );
    }

    this.assertNotExpired(review.completion?.completedAt ?? review.createdAt);

    if (dto.tags !== undefined) {
      const { targetRole } = this.resolveCounterparty(
        review.completion,
        userId,
      );
      this.assertTagsAllowed(dto.tags, targetRole, review.completion.method);
      review.tags = dto.tags;
    }

    if (dto.content !== undefined) {
      review.content = dto.content || null;
    }

    return await this.tradeReviewRepository.save(review);
  }

  /**
   * 특정 사용자가 받은 거래 후기 목록을 페이지네이션으로 조회합니다.
   */
  async getReviewsByTargetUser(
    handleOrId: string,
    query: QueryTradeReviewDto,
  ): Promise<{
    reviews: TradeReview[];
    total: number;
    page: number;
    limit: number;
  }> {
    const user = await this.findUserByHandleOrId(handleOrId);
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.tradeReviewRepository.findAndCount({
      where: { targetUserId: user.id },
      relations: [
        'reviewer',
        'completion',
        'completion.sale',
        'completion.sale.book',
      ],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { reviews, total, page, limit };
  }

  /**
   * 사용자의 거래 통계와 신뢰 지표를 집계합니다.
   *
   * 직거래(판매자 자기신고)와 택배 거래(에스크로 구매확정)는 검증 수준이
   * 다르므로 건수를 나눠서 제공합니다. 합산만 보여주면 그 차이가 가려집니다.
   */
  async getSellerStats(handleOrId: string): Promise<SellerTradeStats> {
    const user = await this.findUserByHandleOrId(handleOrId);

    const completionRows = await this.tradeCompletionRepository
      .createQueryBuilder('completion')
      .select('completion.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .where('completion.sellerId = :userId', { userId: user.id })
      .groupBy('completion.method')
      .getRawMany<{ method: TradeCompletionMethod; count: string }>();

    const countOf = (method: TradeCompletionMethod) =>
      Number(completionRows.find((row) => row.method === method)?.count ?? 0);

    const directCompletedSales = countOf(TradeCompletionMethod.DIRECT);
    const deliveryCompletedSales = countOf(TradeCompletionMethod.DELIVERY);

    const reviews = await this.tradeReviewRepository.find({
      where: { targetUserId: user.id },
    });

    const totalReviews = reviews.length;

    const positiveReviewCount = reviews.filter((review) =>
      review.tags?.some((tag) => POSITIVE_TAGS.has(tag)),
    ).length;

    const positiveRate =
      totalReviews === 0
        ? 100
        : Math.round((positiveReviewCount / totalReviews) * 100);

    const tagCounts: Record<string, number> = {};
    Object.keys(TRADE_REVIEW_TAG_SPECS).forEach((tag) => {
      tagCounts[tag] = 0;
    });

    reviews.forEach((review) => {
      review.tags?.forEach((tag) => {
        if (tagCounts[tag] !== undefined) {
          tagCounts[tag]++;
        }
      });
    });

    return {
      totalCompletedSales: directCompletedSales + deliveryCompletedSales,
      directCompletedSales,
      deliveryCompletedSales,
      totalReviews,
      positiveRate,
      tagCounts,
    };
  }

  /**
   * 이 거래에 대해 내가 후기를 쓸 수 있는지, 이미 썼는지 알려줍니다.
   */
  async getMyReviewEligibility(
    completionId: number,
    userId: number,
  ): Promise<{
    canWrite: boolean;
    myReview: TradeReview | null;
    expiresAt: string | null;
  }> {
    const completion = await this.loadCompletion(completionId);
    this.resolveCounterparty(completion, userId);

    const myReview = await this.tradeReviewRepository.findOne({
      where: { completionId, reviewerId: userId },
    });

    const deadline = new Date(
      new Date(completion.completedAt).getTime() + REVIEW_EXPIRATION_MS,
    );

    return {
      canWrite: !myReview && deadline.getTime() > Date.now(),
      myReview,
      expiresAt: deadline.toISOString(),
    };
  }

  private async loadCompletion(completionId: number): Promise<TradeCompletion> {
    const completion = await this.tradeCompletionRepository.findOne({
      where: { id: completionId },
    });

    if (!completion) {
      throw new BusinessException(
        'TRADE_COMPLETION_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    return completion;
  }

  /**
   * 후기를 쓰는 사람 기준으로 상대와 그 역할을 정합니다.
   * 거래 당사자가 아니면 후기를 쓸 수 없습니다.
   */
  private resolveCounterparty(
    completion: TradeCompletion,
    reviewerId: number,
  ): { targetUserId: number; targetRole: TradeReviewTargetRole } {
    if (completion.buyerId === reviewerId) {
      return { targetUserId: completion.sellerId, targetRole: 'SELLER' };
    }

    if (completion.sellerId === reviewerId) {
      return { targetUserId: completion.buyerId, targetRole: 'BUYER' };
    }

    throw new BusinessException('TRADE_REVIEW_FORBIDDEN', HttpStatus.FORBIDDEN);
  }

  private assertNotExpired(completedAt: Date): void {
    const isExpired =
      Date.now() - new Date(completedAt).getTime() > REVIEW_EXPIRATION_MS;

    if (isExpired) {
      throw new BusinessException(
        'TRADE_REVIEW_EXPIRED',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 태그가 이 거래·대상에 쓸 수 있는 것인지 검증합니다.
   *
   * 직거래에 배송·포장 태그를 붙이거나, 구매자에게 "책 상태가 좋아요"를
   * 붙이는 식의 뜻이 통하지 않는 후기를 막습니다.
   */
  private assertTagsAllowed(
    tags: TradeReviewTag[],
    targetRole: TradeReviewTargetRole,
    method: TradeCompletionMethod,
  ): void {
    const invalid = tags.filter(
      (tag) => !isTradeReviewTagAllowed(tag, targetRole, method),
    );

    if (invalid.length > 0) {
      throw new BusinessException(
        'TRADE_REVIEW_TAG_NOT_ALLOWED',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async findUserByHandleOrId(handleOrId: string): Promise<User> {
    const isNumber = !Number.isNaN(Number(handleOrId));
    let user: User | null = null;

    if (isNumber) {
      user = await this.userRepository.findOne({
        where: [{ id: Number(handleOrId) }, { handle: handleOrId }],
      });
    } else {
      user = await this.userRepository.findOne({
        where: { handle: handleOrId },
      });
    }

    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return user;
  }
}
