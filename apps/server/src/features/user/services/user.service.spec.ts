import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { Order, OrderStatus } from '@/features/order/entities/order.entity';
import { ReadingLog } from '@/features/reading-log/entities/reading-log.entity';
import { Review } from '@/features/review/entities/review.entity';
import { TradeCompletion } from '@/features/trade/entities/trade-completion.entity';
import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';
import { MailService } from '@/shared/mail/mail.service';

import { User } from '../entities/user.entity';
import { UserService } from './user.service';

jest.mock('@nestjs-cls/transactional', () => {
  const actual = jest.requireActual<Record<string, unknown>>(
    '@nestjs-cls/transactional',
  );
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: unknown,
        _propertyKey: string,
        descriptor: PropertyDescriptor,
      ) =>
        descriptor,
  };
});

describe('UserService', () => {
  let service: UserService;
  let mockManager: Partial<EntityManager>;
  let mockTxHost: { tx: Partial<EntityManager> };
  let mockEventEmitter: { emitAsync: jest.Mock; emit: jest.Mock };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      update: jest.fn(),
    };

    mockTxHost = {
      tx: mockManager,
    };

    mockEventEmitter = {
      emitAsync: jest.fn().mockResolvedValue([]),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(UsedBookSale), useValue: {} },
        { provide: getRepositoryToken(ChatParticipant), useValue: {} },
        { provide: getRepositoryToken(Review), useValue: {} },
        { provide: getRepositoryToken(Order), useValue: {} },
        {
          provide: getRepositoryToken(TradeCompletion),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(ReadingLog),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        { provide: DataSource, useValue: { query: jest.fn() } },
        { provide: TransactionHost, useValue: mockTxHost },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('withdraw', () => {
    const user = () => ({
      id: 1,
      nickname: '기존유저',
      email: 'test@example.com',
      deletedAt: null,
    });

    it('활성 주문(구매/판매)이 존재하는 경우 USER_IN_TRADE_CANNOT_WITHDRAW 예외를 던져야 합니다', async () => {
      // 0. 활성 주문 조회 결과 존재
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce({
        id: 1,
        status: OrderStatus.AWAITING_PAYMENT,
      });

      await expect(service.withdraw(1)).rejects.toMatchObject({
        errorCode: 'USER_IN_TRADE_CANNOT_WITHDRAW',
      });
    });

    it('판매자로서 예약 중인 판매글이 있으면 USER_HAS_RESERVED_SALE_CANNOT_WITHDRAW 예외를 던져야 합니다', async () => {
      // 0. 활성 주문 없음
      // 1. 예약 중인 판매글 존재
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 10 });

      await expect(service.withdraw(1)).rejects.toMatchObject({
        errorCode: 'USER_HAS_RESERVED_SALE_CANNOT_WITHDRAW',
      });
      expect(mockManager.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitAsync).not.toHaveBeenCalled();
    });

    it('활성 주문이 없는 경우 회원을 익명화하고 이벤트를 발행해야 합니다', async () => {
      const target = user();

      // 0. 활성 주문 없음
      // 1. 예약 중인 판매글 없음
      // 2. 유저 조회
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(target);

      await service.withdraw(1);

      expect(target.nickname).toBe('(알수없음)');
      expect(target.deletedAt).toBeDefined();
      expect(mockManager.save).toHaveBeenCalledWith(target);
      expect(mockManager.update).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        'user.withdrawn',
        expect.objectContaining({ userId: 1 }),
      );
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('구매자로 예약된 판매글은 판매중으로 되돌리고 커밋 후 예약 취소 이벤트를 발행해야 합니다', async () => {
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(user());
      (mockManager.find as jest.Mock).mockResolvedValueOnce([
        { id: 20, user: { id: 7 } },
      ]);

      await service.withdraw(1);

      expect(mockManager.update).toHaveBeenCalledWith(
        UsedBookSale,
        expect.anything(),
        { status: SaleStatus.FOR_SALE, reservedForUserId: null },
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'trade.reservation_cancelled',
        { saleId: 20, sellerId: 7, buyerId: 1 },
      );
    });
  });
});
