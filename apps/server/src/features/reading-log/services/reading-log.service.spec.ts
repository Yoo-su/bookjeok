import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions';

import { ReadingLog } from '../entities/reading-log.entity';
import { ReadingLogService } from './reading-log.service';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

/** 커서 검증에 걸리면 쿼리까지 가지 않으므로 최소한의 체이닝만 흉내 낸다. */
function mockSelectQueryBuilder(overrides: Record<string, unknown> = {}) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
    ...overrides,
  };
}

/** 커서가 400으로 막혔는지 확인한다. */
async function expectInvalidCursor(promise: Promise<unknown>) {
  await expect(promise).rejects.toThrow(BusinessException);
  await promise.catch((error: unknown) => {
    expect((error as BusinessException).getStatus()).toBe(
      HttpStatus.BAD_REQUEST,
    );
    expect((error as BusinessException).errorCode).toBe('VALIDATION_ERROR');
  });
}

describe('ReadingLogService', () => {
  let service: ReadingLogService;
  let readingLogRepository: jest.Mocked<Partial<Repository<ReadingLog>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  beforeEach(async () => {
    readingLogRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockSelectQueryBuilder()),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockSelectQueryBuilder()),
      findOne: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingLogService,
        {
          provide: getRepositoryToken(ReadingLog),
          useValue: readingLogRepository,
        },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ReadingLogService>(ReadingLogService);
  });

  describe('findAllInfinite 커서 검증', () => {
    it('비-UUID 단일 커서를 400으로 막는다', async () => {
      await expectInvalidCursor(
        service.findAllInfinite(1, 'invalid-cursor-id'),
      );
    });

    it('복합 커서의 UUID 조각이 깨지면 400으로 막는다', async () => {
      await expectInvalidCursor(
        service.findAllInfinite(1, '2026-09-01|not-a-uuid'),
      );
    });

    // 형태만 맞고 달력에 없는 날짜. 그대로 통과하면 Postgres가 out of range로
    // 던져 500이 된다.
    it.each(['2026-99-99', '2026-13-01', '2026-02-30', '2026-00-10'])(
      '실재하지 않는 날짜 %s 를 400으로 막는다',
      async (badDate) => {
        await expectInvalidCursor(
          service.findAllInfinite(1, `${badDate}|${VALID_UUID}`),
        );
      },
    );

    it('조각이 빈 커서를 400으로 막는다', async () => {
      await expectInvalidCursor(service.findAllInfinite(1, `|${VALID_UUID}`));
      await expectInvalidCursor(service.findAllInfinite(1, '2026-09-01|'));
    });

    it('올바른 복합 커서는 그대로 쿼리에 실린다', async () => {
      const qb = mockSelectQueryBuilder();
      (readingLogRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        qb,
      );

      const result = await service.findAllInfinite(
        1,
        `2026-09-01|${VALID_UUID}`,
        10,
      );

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(log.date < :cursorDate OR (log.date = :cursorDate AND log.id < :cursorIdStr))',
        { cursorDate: '2026-09-01', cursorIdStr: VALID_UUID },
      );
      expect(result).toEqual({ items: [], nextCursor: null });
    });

    it('윤년 2월 29일처럼 실재하는 날짜는 통과시킨다', async () => {
      const qb = mockSelectQueryBuilder();
      (readingLogRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        qb,
      );

      await expect(
        service.findAllInfinite(1, `2024-02-29|${VALID_UUID}`, 10),
      ).resolves.toBeDefined();
    });
  });

  describe('getLoungeFeed 커서 검증', () => {
    it('날짜 조각이 깨진 공개 피드 커서를 400으로 막는다', async () => {
      await expectInvalidCursor(service.getLoungeFeed('garbage|9788901234567'));
      await expectInvalidCursor(
        service.getLoungeFeed('2026-99-99|9788901234567'),
      );
    });

    it('구분자가 없는 커서를 400으로 막는다', async () => {
      await expectInvalidCursor(service.getLoungeFeed('nonsense'));
    });
  });

  describe('getLoungeBookReaders 커서 검증', () => {
    beforeEach(() => {
      (dataSource.getRepository as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ isbn: '9788901234567' }),
      });
    });

    it('날짜 조각이 깨진 커서를 400으로 막는다', async () => {
      await expectInvalidCursor(
        service.getLoungeBookReaders('9788901234567', 'garbage|1'),
      );
    });

    it('숫자가 아닌 userId 조각을 400으로 막는다', async () => {
      await expectInvalidCursor(
        service.getLoungeBookReaders('9788901234567', '2026-09-01|abc'),
      );
    });
  });

  // pg는 date(OID 1082)를 로컬 자정 Date로 파싱하고, 운영 컨테이너는
  // TZ=Asia/Seoul이다. 그 Date를 toISOString()에 태우면 하루가 당겨져
  // 표시 날짜와 커서가 동시에 틀어진다. SQL에서 문자열로 굳혀 막는다.
  describe('date 컬럼을 Date로 받지 않는다', () => {
    it('라운지 피드가 MAX(rl.date)를 텍스트로 조회한다', async () => {
      const qb = mockSelectQueryBuilder({
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      (readingLogRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        qb,
      );

      await service.getLoungeFeed();

      expect(qb.addSelect).toHaveBeenCalledWith(
        "TO_CHAR(MAX(rl.date), 'YYYY-MM-DD')",
        'latestDate',
      );
    });

    it('라운지 피드가 DB가 준 날짜 문자열을 그대로 표시·커서에 쓴다', async () => {
      // PAGE_SIZE(20) + 1건을 주어 nextCursor가 만들어지게 한다.
      // 커서는 21번째를 버린 뒤의 마지막 항목(index 19)을 가리킨다.
      const rows = Array.from({ length: 21 }, (_, i) => ({
        isbn: `97889012${String(i).padStart(5, '0')}`,
        latestDate: '2026-09-14',
      }));
      const lastIsbn = rows[19].isbn;
      const groupsQb = mockSelectQueryBuilder({
        getRawMany: jest.fn().mockResolvedValue(rows),
      });
      const logsQb = mockSelectQueryBuilder({
        getMany: jest.fn().mockResolvedValue([]),
      });
      (readingLogRepository.createQueryBuilder as jest.Mock)
        .mockReturnValueOnce(groupsQb)
        .mockReturnValue(logsQb);

      const result = await service.getLoungeFeed();

      // 하루 밀리면 '2026-09-13'이 된다.
      expect(result.items[0].latestDate).toBe('2026-09-14');
      expect(result.nextCursor).toBe(`2026-09-14|${lastIsbn}`);
    });

    it('도서별 독자 목록이 MAX(rl.date)를 텍스트로 조회한다', async () => {
      (dataSource.getRepository as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ isbn: '9788901234567' }),
      });
      const qb = mockSelectQueryBuilder();
      (readingLogRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        qb,
      );

      await service.getLoungeBookReaders('9788901234567');

      expect(qb.addSelect).toHaveBeenCalledWith(
        "TO_CHAR(MAX(rl.date), 'YYYY-MM-DD')",
        'latestDate',
      );
    });
  });

  describe('getLoungeActiveReaders', () => {
    it('ReadingLog를 innerJoin하여 단일 집계 쿼리로 조회한다', async () => {
      const qb = mockSelectQueryBuilder({
        getRawMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            nickname: '독서왕',
            handle: 'reader1',
            profileImageUrl: 'https://cdn.bookjeok.com/profiles/1.png',
            recentCount: '5',
            totalCount: '12',
          },
        ]),
      });
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.getLoungeActiveReaders(10);

      // 상관 서브쿼리로 되돌아가면 이 단언이 깨진다.
      expect(qb.innerJoin).toHaveBeenCalledWith(
        ReadingLog,
        'rl',
        'rl.userId = u.id',
      );
      expect(result.items).toEqual([
        {
          user: {
            id: 1,
            nickname: '독서왕',
            handle: 'reader1',
            profileImageUrl: 'https://cdn.bookjeok.com/profiles/1.png',
          },
          recentCount: 5,
          totalCount: 12,
        },
      ]);
    });
  });
});
