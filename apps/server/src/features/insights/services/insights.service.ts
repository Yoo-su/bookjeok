import { BOOK_DOMAINS } from '@bookjeok/core';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Review } from '@/features/review/entities/review.entity';
import {
  ReviewReaction,
  ReviewReactionType,
} from '@/features/review/entities/review-reaction.entity';
import { Tag } from '@/features/review/entities/tag.entity';
import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';

import {
  ACTIVITY_TREND_DAYS,
  LOCATION_SALES_LIMIT,
  LOCATION_STATS_LIMIT,
  POPULAR_TAGS_LIMIT,
  PRICE_RANGES,
} from '../constants';
import {
  ActivityTrendStat,
  CategoryStat,
  InsightsResponseDto,
  LocationStat,
  PopularTagStat,
  PriceRangeStat,
  ReactionStat,
} from '../dtos/insights-response.dto';

/** KST는 서머타임이 없어 고정 +9시간 환산으로 충분하다. */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** timestamptz 컬럼을 KST 달력 날짜 문자열로 바꾸는 SQL 식. */
function kstDayExpression(column: string): string {
  return `TO_CHAR(${column} AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD')`;
}

/** 지금 이 순간의 KST 달력 날짜를 {y, m, d}로 돌려준다. */
function kstToday(): { year: number; month: number; day: number } {
  const shifted = new Date(Date.now() + KST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

/** 기준일에서 offsetDays만큼 떨어진 KST 자정의 실제 순간(UTC instant). */
function kstMidnight(
  today: { year: number; month: number; day: number },
  offsetDays: number,
): Date {
  return new Date(
    Date.UTC(today.year, today.month, today.day + offsetDays) - KST_OFFSET_MS,
  );
}

/** 기준일에서 offsetDays만큼 떨어진 KST 달력 날짜의 YYYY-MM-DD. */
function kstDayString(
  today: { year: number; month: number; day: number },
  offsetDays: number,
): string {
  return new Date(Date.UTC(today.year, today.month, today.day + offsetDays))
    .toISOString()
    .split('T')[0];
}

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(UsedBookSale)
    private readonly salesRepository: Repository<UsedBookSale>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(ReviewReaction)
    private readonly reactionsRepository: Repository<ReviewReaction>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  /**
   * 전체 인사이트 데이터를 조회합니다.
   */
  async getInsights(): Promise<InsightsResponseDto> {
    const [
      locationStats,
      categoryStats,
      priceDistribution,
      activityTrend,
      reactionStats,
      popularTags,
      summary,
    ] = await Promise.all([
      this.getLocationStats(),
      this.getCategoryStats(),
      this.getPriceDistribution(),
      this.getActivityTrend(),
      this.getReactionStats(),
      this.getPopularTags(),
      this.getSummary(),
    ]);

    return {
      locationStats,
      categoryStats,
      priceDistribution,
      activityTrend,
      reactionStats,
      popularTags,
      summary,
    };
  }

  /**
   * 지역별 거래 현황을 조회합니다.
   * 같은 city+district를 가진 판매글을 그룹화하고 대표 좌표를 반환합니다.
   */
  private async getLocationStats(): Promise<LocationStat[]> {
    const result = await this.salesRepository
      .createQueryBuilder('sale')
      .select('sale.city', 'city')
      .addSelect('sale.district', 'district')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(sale.latitude)', 'latitude')
      .addSelect('AVG(sale.longitude)', 'longitude')
      .where('sale.status != :withdrawn', { withdrawn: SaleStatus.WITHDRAWN })
      .groupBy('sale.city')
      .addGroupBy('sale.district')
      .orderBy('count', 'DESC')
      .limit(LOCATION_STATS_LIMIT)
      .getRawMany();

    return result.map((r) => ({
      city: r.city,
      district: r.district,
      count: parseInt(r.count, 10),
      latitude: parseFloat(r.latitude) || 37.5665,
      longitude: parseFloat(r.longitude) || 126.978,
    }));
  }

  /**
   * 카테고리별 리뷰 수를 조회합니다.
   */
  private async getCategoryStats(): Promise<CategoryStat[]> {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('review.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('review.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    // BOOK_DOMAINS 순서대로 정렬하고, 없는 카테고리는 0으로 채움
    const categoryMap = new Map(
      result.map((r) => [r.category, parseInt(r.count, 10)]),
    );

    return BOOK_DOMAINS.map((category) => ({
      category,
      count: categoryMap.get(category) || 0,
    }));
  }

  /**
   * 가격 구간별 판매글 수를 조회합니다.
   * CASE WHEN을 사용해 단일 쿼리로 최적화
   */
  private async getPriceDistribution(): Promise<PriceRangeStat[]> {
    // CASE WHEN을 사용한 단일 쿼리로 모든 가격 구간 집계
    const result = await this.salesRepository
      .createQueryBuilder('sale')
      .select(
        `
        SUM(CASE WHEN sale.price >= 0 AND sale.price < 5000 THEN 1 ELSE 0 END) as "range_0_5000",
        SUM(CASE WHEN sale.price >= 5000 AND sale.price < 10000 THEN 1 ELSE 0 END) as "range_5000_10000",
        SUM(CASE WHEN sale.price >= 10000 AND sale.price < 20000 THEN 1 ELSE 0 END) as "range_10000_20000",
        SUM(CASE WHEN sale.price >= 20000 AND sale.price < 30000 THEN 1 ELSE 0 END) as "range_20000_30000",
        SUM(CASE WHEN sale.price >= 30000 AND sale.price < 50000 THEN 1 ELSE 0 END) as "range_30000_50000",
        SUM(CASE WHEN sale.price >= 50000 AND sale.price < 100000 THEN 1 ELSE 0 END) as "range_50000_100000"
      `,
      )
      .where('sale.status = :status', { status: SaleStatus.FOR_SALE })
      .getRawOne();

    // 결과를 PriceRangeStat 배열로 변환
    return PRICE_RANGES.map((range) => ({
      range: range.label,
      min: range.min,
      max: range.max,
      count: parseInt(
        result[`range_${range.label.replace('-', '_')}`] || '0',
        10,
      ),
    }));
  }

  /**
   * 최근 30일간의 일별 활동 추이를 KST 기준으로 조회합니다.
   *
   * 날짜 경계를 SQL과 JS 양쪽에서 `Asia/Seoul`로 못박습니다. 어느 한쪽을
   * 서버 로컬이나 DB 세션 타임존에 맡기면 둘이 어긋나 하루치가 통째로
   * 0으로 빠집니다.
   */
  private async getActivityTrend(): Promise<ActivityTrendStat[]> {
    const salesDayExpr = kstDayExpression('sale.createdAt');
    const reviewsDayExpr = kstDayExpression('review.createdAt');

    // 가장 오래된 칸의 KST 자정. 30칸을 채우므로 오늘 포함 29일 전이다.
    const today = kstToday();
    const startDate = kstMidnight(today, -(ACTIVITY_TREND_DAYS - 1));

    // 판매글 일별 집계
    const salesByDate = await this.salesRepository
      .createQueryBuilder('sale')
      .select(salesDayExpr, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('sale.createdAt >= :startDate', { startDate })
      .groupBy(salesDayExpr)
      .getRawMany();

    // 리뷰 일별 집계
    const reviewsByDate = await this.reviewsRepository
      .createQueryBuilder('review')
      .select(reviewsDayExpr, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('review.createdAt >= :startDate', { startDate })
      .groupBy(reviewsDayExpr)
      .getRawMany();

    // 날짜별 맵 생성
    const salesMap = new Map(
      salesByDate.map((r) => [r.date, parseInt(r.count, 10)]),
    );
    const reviewsMap = new Map(
      reviewsByDate.map((r) => [r.date, parseInt(r.count, 10)]),
    );

    // 최근 30일 날짜 배열 생성 (기록이 없는 날도 0으로 채운다)
    const dates: ActivityTrendStat[] = [];
    for (let i = ACTIVITY_TREND_DAYS - 1; i >= 0; i--) {
      const dateStr = kstDayString(today, -i);
      dates.push({
        date: dateStr,
        salesCount: salesMap.get(dateStr) || 0,
        reviewsCount: reviewsMap.get(dateStr) || 0,
      });
    }

    return dates;
  }

  /**
   * 리액션 타입별 집계를 조회합니다.
   */
  private async getReactionStats(): Promise<ReactionStat[]> {
    const result = await this.reactionsRepository
      .createQueryBuilder('reaction')
      .select('reaction.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('reaction.type')
      .getRawMany();

    // 모든 리액션 타입을 포함하도록 보장
    const reactionMap = new Map(
      result.map((r) => [r.type, parseInt(r.count, 10)]),
    );

    return Object.values(ReviewReactionType).map((type) => ({
      type,
      count: reactionMap.get(type) || 0,
    }));
  }

  /**
   * 인기 태그 Top 20을 조회합니다.
   */
  private async getPopularTags(): Promise<PopularTagStat[]> {
    // review_tags 테이블을 통해 태그 사용 빈도 집계
    const result = await this.tagsRepository
      .createQueryBuilder('tag')
      .innerJoin('review_tags', 'rt', 'rt.tagId = tag.id')
      .select('tag.name', 'name')
      .addSelect('COUNT(rt.reviewId)', 'count')
      .groupBy('tag.id')
      .addGroupBy('tag.name')
      .orderBy('count', 'DESC')
      .limit(POPULAR_TAGS_LIMIT)
      .getRawMany();

    return result.map((r) => ({
      name: r.name,
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * 요약 통계를 조회합니다.
   */
  private async getSummary(): Promise<{
    totalSales: number;
    totalReviews: number;
    totalReactions: number;
    totalTags: number;
  }> {
    const [totalSales, totalReviews, totalReactions, totalTags] =
      await Promise.all([
        this.salesRepository.count({
          where: { status: SaleStatus.FOR_SALE },
        }),
        this.reviewsRepository.count(),
        this.reactionsRepository.count(),
        this.tagsRepository.count(),
      ]);

    return {
      totalSales,
      totalReviews,
      totalReactions,
      totalTags,
    };
  }

  /**
   * 특정 지역의 최근 판매글 5개를 조회합니다.
   */
  async getLocationSales(
    city: string,
    district: string,
  ): Promise<
    {
      id: number;
      title: string;
      price: number;
      latitude: number;
      longitude: number;
      placeName: string;
      bookTitle: string;
    }[]
  > {
    const sales = await this.salesRepository.find({
      where: {
        city,
        district,
        status: SaleStatus.FOR_SALE,
      },
      order: { createdAt: 'DESC' },
      take: LOCATION_SALES_LIMIT,
      relations: ['book'],
    });

    return sales.map((sale) => ({
      id: sale.id,
      title: sale.title,
      price: sale.price,
      latitude: sale.latitude,
      longitude: sale.longitude,
      placeName: sale.placeName,
      bookTitle: sale.book?.title || '도서 정보 없음',
    }));
  }
}
