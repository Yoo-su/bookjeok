import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Review } from '@/features/review/entities/review.entity';
import { ReviewReaction } from '@/features/review/entities/review-reaction.entity';
import { Tag } from '@/features/review/entities/tag.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

import { ACTIVITY_TREND_DAYS } from '../constants';
import { InsightsService } from './insights.service';

interface TrendRow {
  date: string;
  count: string;
}

/** 집계 쿼리 빌더 흉내. groupBy에 넘어온 SQL 식을 꺼내 볼 수 있게 기록해 둔다. */
function mockTrendQueryBuilder(rows: TrendRow[]) {
  const captured = { groupBy: '' };

  return {
    captured,
    builder: {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn(function (this: unknown, expr: string) {
        captured.groupBy = expr;
        return this;
      }),
      getRawMany: jest.fn().mockResolvedValue(rows),
    },
  };
}

describe('InsightsService', () => {
  let service: InsightsService;
  let salesRepository: jest.Mocked<Partial<Repository<UsedBookSale>>>;
  let reviewsRepository: jest.Mocked<Partial<Repository<Review>>>;
  let reactionsRepository: jest.Mocked<Partial<Repository<ReviewReaction>>>;
  let tagsRepository: jest.Mocked<Partial<Repository<Tag>>>;

  beforeEach(async () => {
    salesRepository = { createQueryBuilder: jest.fn() };
    reviewsRepository = { createQueryBuilder: jest.fn() };
    reactionsRepository = { createQueryBuilder: jest.fn() };
    tagsRepository = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsService,
        {
          provide: getRepositoryToken(UsedBookSale),
          useValue: salesRepository,
        },
        { provide: getRepositoryToken(Review), useValue: reviewsRepository },
        {
          provide: getRepositoryToken(ReviewReaction),
          useValue: reactionsRepository,
        },
        { provide: getRepositoryToken(Tag), useValue: tagsRepository },
      ],
    }).compile();

    service = module.get<InsightsService>(InsightsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getActivityTrend', () => {
    /** private 메서드라 캐스팅해서 부른다. */
    const callGetActivityTrend = () =>
      (
        service as unknown as {
          getActivityTrend: () => Promise<
            { date: string; salesCount: number; reviewsCount: number }[]
          >;
        }
      ).getActivityTrend();

    it('KST 새벽(UTC 기준 전날)에 호출해도 오늘 KST 날짜 칸에 집계가 매핑된다', async () => {
      // 2026-09-14 01:30 KST = 2026-09-13 16:30 UTC.
      // 날짜 키를 UTC로 만들면 09-13이 되어 DB가 돌려준 09-14와 어긋난다.
      jest.useFakeTimers().setSystemTime(new Date('2026-09-13T16:30:00.000Z'));

      const sales = mockTrendQueryBuilder([{ date: '2026-09-14', count: '3' }]);
      const reviews = mockTrendQueryBuilder([
        { date: '2026-09-14', count: '7' },
      ]);
      (salesRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        sales.builder,
      );
      (reviewsRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        reviews.builder,
      );

      const trends = await callGetActivityTrend();

      const last = trends[trends.length - 1];
      expect(last.date).toBe('2026-09-14');
      expect(last.salesCount).toBe(3);
      expect(last.reviewsCount).toBe(7);
    });

    it('SQL 집계와 날짜 키가 같은 타임존(Asia/Seoul) 경계를 쓴다', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-13T16:30:00.000Z'));

      const sales = mockTrendQueryBuilder([]);
      const reviews = mockTrendQueryBuilder([]);
      (salesRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        sales.builder,
      );
      (reviewsRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        reviews.builder,
      );

      await callGetActivityTrend();

      // 세션 타임존에 기대지 않고 명시적으로 환산해야 한다.
      expect(sales.captured.groupBy).toContain("AT TIME ZONE 'Asia/Seoul'");
      expect(reviews.captured.groupBy).toContain("AT TIME ZONE 'Asia/Seoul'");
    });

    it('조회 시작 시각이 가장 오래된 칸의 KST 자정과 일치한다', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-13T16:30:00.000Z'));

      const sales = mockTrendQueryBuilder([]);
      const reviews = mockTrendQueryBuilder([]);
      (salesRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        sales.builder,
      );
      (reviewsRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        reviews.builder,
      );

      const trends = await callGetActivityTrend();

      // 첫 칸이 2026-08-16이면 startDate는 그날 00:00 KST = 전날 15:00 UTC.
      expect(trends[0].date).toBe('2026-08-16');
      const [, params] = sales.builder.where.mock.calls[0] as [
        string,
        { startDate: Date },
      ];
      expect(params.startDate.toISOString()).toBe('2026-08-15T15:00:00.000Z');
    });

    it('기록이 없는 날도 0으로 채워 30칸을 빠짐없이 만든다', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-13T16:30:00.000Z'));

      const sales = mockTrendQueryBuilder([]);
      const reviews = mockTrendQueryBuilder([]);
      (salesRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        sales.builder,
      );
      (reviewsRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        reviews.builder,
      );

      const trends = await callGetActivityTrend();

      expect(trends).toHaveLength(ACTIVITY_TREND_DAYS);
      expect(new Set(trends.map((t) => t.date)).size).toBe(ACTIVITY_TREND_DAYS);
      expect(trends.every((t) => t.salesCount === 0)).toBe(true);
    });
  });
});
