import { HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';

import { BusinessException } from '@/shared/exceptions';

import { ReadingLog } from '../entities/reading-log.entity';
import { ReadingLogKong } from '../entities/reading-log-kong.entity';
import { ReadingLogEvents } from '../events/reading-log.events';
import { ReadingLogKongService } from './reading-log-kong.service';

const LOG_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_LOG_ID = '22222222-2222-4222-8222-222222222222';

function selectBuilder(result: { getOne?: unknown; getRawMany?: unknown }) {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result.getOne ?? null),
    getRawMany: jest.fn().mockResolvedValue(result.getRawMany ?? []),
  };
}

function insertBuilder(raw: unknown[]) {
  return {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ raw }),
  };
}

async function expectError(
  promise: Promise<unknown>,
  status: HttpStatus,
  errorCode: string,
) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(BusinessException);
  expect((error as BusinessException).getStatus()).toBe(status);
  expect((error as BusinessException).errorCode).toBe(errorCode);
}

describe('ReadingLogKongService', () => {
  let kongRepository: { createQueryBuilder: jest.Mock };
  let readingLogRepository: { createQueryBuilder: jest.Mock };
  let eventEmitter: { emit: jest.Mock };
  let service: ReadingLogKongService;

  beforeEach(() => {
    kongRepository = { createQueryBuilder: jest.fn() };
    readingLogRepository = { createQueryBuilder: jest.fn() };
    eventEmitter = { emit: jest.fn() };
    service = new ReadingLogKongService(
      kongRepository as unknown as Repository<ReadingLogKong>,
      readingLogRepository as unknown as Repository<ReadingLog>,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  describe('send', () => {
    const log = {
      id: LOG_ID,
      userId: 1,
      date: '2026-10-05',
      book: { isbn: '9788936434595', title: '채식주의자' },
    };

    it('uuid가 아닌 id는 쿼리 전에 404로 막는다(캐스팅 500 방지)', async () => {
      await expectError(
        service.send(2, 'not-a-uuid'),
        HttpStatus.NOT_FOUND,
        'READING_LOG_NOT_FOUND',
      );
      expect(readingLogRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('공개이고 탈퇴하지 않은 주인의 기록만 찾는다', async () => {
      const qb = selectBuilder({ getOne: log });
      readingLogRepository.createQueryBuilder.mockReturnValue(qb);
      kongRepository.createQueryBuilder.mockReturnValue(
        insertBuilder([{ id: 1 }]),
      );

      await service.send(2, LOG_ID);

      expect(qb.andWhere).toHaveBeenCalledWith(
        'owner.isReadingLogPublic = :isPublic',
        { isPublic: true },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('owner.deletedAt IS NULL');
    });

    it('없거나 비공개인 기록은 404', async () => {
      readingLogRepository.createQueryBuilder.mockReturnValue(
        selectBuilder({ getOne: null }),
      );

      await expectError(
        service.send(2, LOG_ID),
        HttpStatus.NOT_FOUND,
        'READING_LOG_NOT_FOUND',
      );
      expect(kongRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('내 기록에는 보낼 수 없다', async () => {
      readingLogRepository.createQueryBuilder.mockReturnValue(
        selectBuilder({ getOne: log }),
      );

      await expectError(
        service.send(1, LOG_ID),
        HttpStatus.BAD_REQUEST,
        'READING_LOG_KONG_SELF',
      );
      expect(kongRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('처음 보내면 저장하고 주인에게 알릴 이벤트를 낸다', async () => {
      readingLogRepository.createQueryBuilder.mockReturnValue(
        selectBuilder({ getOne: log }),
      );
      const insert = insertBuilder([{ id: 7 }]);
      kongRepository.createQueryBuilder.mockReturnValue(insert);

      await expect(service.send(2, LOG_ID)).resolves.toEqual({
        logId: LOG_ID,
        sent: true,
      });
      expect(insert.values).toHaveBeenCalledWith({
        readingLogId: LOG_ID,
        senderId: 2,
      });
      expect(insert.orIgnore).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        ReadingLogEvents.kongSent.name,
        {
          readingLogId: LOG_ID,
          ownerId: 1,
          senderId: 2,
          date: '2026-10-05',
          bookTitle: '채식주의자',
        },
      );
    });

    it('이미 보낸 기록이면 성공하되 다시 알리지 않는다', async () => {
      readingLogRepository.createQueryBuilder.mockReturnValue(
        selectBuilder({ getOne: log }),
      );
      kongRepository.createQueryBuilder.mockReturnValue(insertBuilder([]));

      await expect(service.send(2, LOG_ID)).resolves.toEqual({
        logId: LOG_ID,
        sent: false,
      });
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('getReceived', () => {
    const sender = (id: number, nickname: string) => ({
      senderId: id,
      nickname,
      handle: `h${id}`,
      profileImageUrl: null,
    });
    const book = {
      isbn: '9788936434595',
      title: '채식주의자',
      author: '한강',
      publisher: '창비',
      image: 'https://cdn.bookjeok.com/covers/9788936434595.webp',
    };

    it('최근에 받은 순서를 지키며 기록별로 묶는다', async () => {
      kongRepository.createQueryBuilder.mockReturnValue(
        selectBuilder({
          getRawMany: [
            {
              logId: LOG_ID,
              date: '2026-10-05',
              ...book,
              ...sender(3, '하루'),
              createdAt: new Date('2026-10-07T03:00:00Z'),
            },
            {
              logId: OTHER_LOG_ID,
              date: '2026-09-01',
              isbn: '9788932003979',
              title: null,
              author: null,
              publisher: null,
              image: null,
              ...sender(2, '책벌레'),
              createdAt: new Date('2026-10-06T03:00:00Z'),
            },
            {
              logId: LOG_ID,
              date: '2026-10-05',
              ...book,
              ...sender(2, '책벌레'),
              createdAt: new Date('2026-10-05T03:00:00Z'),
            },
          ],
        }),
      );

      const result = await service.getReceived(1);

      expect(result.total).toBe(3);
      expect(result.logs.map((l) => l.logId)).toEqual([LOG_ID, OTHER_LOG_ID]);
      expect(result.logs[0]).toEqual({
        logId: LOG_ID,
        date: '2026-10-05',
        book,
        count: 2,
        senders: [
          { userId: 3, nickname: '하루', handle: 'h3', profileImageUrl: null },
          {
            userId: 2,
            nickname: '책벌레',
            handle: 'h2',
            profileImageUrl: null,
          },
        ],
        lastReceivedAt: '2026-10-07T03:00:00.000Z',
      });
      // 도서가 사라진 기록도 빈 칸으로 내려 화면이 깨지지 않게
      expect(result.logs[1].book).toEqual({
        isbn: '9788932003979',
        title: '',
        author: '',
        publisher: '',
        image: '',
      });
    });

    it('날짜는 SQL에서 문자열로 굳혀 받는다', async () => {
      const qb = selectBuilder({ getRawMany: [] });
      kongRepository.createQueryBuilder.mockReturnValue(qb);

      await expect(service.getReceived(1)).resolves.toEqual({
        total: 0,
        logs: [],
      });
      expect(qb.addSelect).toHaveBeenCalledWith(
        "TO_CHAR(log.date, 'YYYY-MM-DD')",
        'date',
      );
      expect(qb.where).toHaveBeenCalledWith('log.userId = :ownerId', {
        ownerId: 1,
      });
    });
  });

  describe('getSent', () => {
    it('핸들이 없으면 400', async () => {
      await expectError(
        service.getSent(2, ''),
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
      );
    });

    it('그 사용자 기록 중 내가 보낸 기록 id만 돌려준다', async () => {
      const qb = selectBuilder({ getRawMany: [{ logId: LOG_ID }] });
      kongRepository.createQueryBuilder.mockReturnValue(qb);

      await expect(service.getSent(2, 'reader')).resolves.toEqual({
        logIds: [LOG_ID],
      });
      expect(qb.where).toHaveBeenCalledWith('kong.senderId = :senderId', {
        senderId: 2,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('owner.handle = :handle', {
        handle: 'reader',
      });
    });
  });
});
