import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { DataSource, EntityManager } from 'typeorm';

import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { Order, OrderStatus } from '@/features/order/entities/order.entity';
import { ReadingLog } from '@/features/reading-log/entities/reading-log.entity';
import { Review } from '@/features/review/entities/review.entity';
import { TradeCompletion } from '@/features/trade/entities/trade-completion.entity';
import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { verificationMail } from '@/features/user/mail/verification.mail';
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
  let mockMailService: { send: jest.Mock };
  let mockUserRepository: {
    findOne: jest.Mock;
    merge: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    mockMailService = { send: jest.fn().mockResolvedValue({ status: 'sent' }) };
    mockUserRepository = {
      findOne: jest.fn(),
      merge: jest.fn((user: object, patch: object) =>
        Object.assign(user, patch),
      ),
      save: jest.fn((user: object) => Promise.resolve(user)),
    };

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
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
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
        { provide: MailService, useValue: mockMailService },
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

  describe('updateUser', () => {
    const userOf = (provider: string) => ({
      id: 1,
      provider,
      email: 'test@example.com',
    });

    it('로컬 유저가 이메일을 null로 보내면 LOCAL_USER_EMAIL_REQUIRED 예외를 던져야 합니다', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(userOf('local'));

      await expect(
        service.updateUser(1, { email: null } as unknown as Partial<User>),
      ).rejects.toMatchObject({ errorCode: 'LOCAL_USER_EMAIL_REQUIRED' });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('소셜 유저는 이메일을 null로 비울 수 있어야 합니다', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(userOf('kakao'));

      const saved = await service.updateUser(1, {
        email: null,
      } as unknown as Partial<User>);

      expect(saved.email).toBeNull();
    });

    it('이메일 변경은 새 토큰을 저장하고 발송 완료를 기다리지 않는다', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce({ ...userOf('local'), nickname: '독자' })
        .mockResolvedValueOnce(null);
      mockMailService.send.mockReturnValue(new Promise(() => {}));
      const saved = await service.updateUser(1, { email: 'new@example.com' });
      expect(saved.isEmailVerified).toBe(false);
      expect(mockMailService.send).toHaveBeenCalledWith(verificationMail, {
        email: 'new@example.com',
        nickname: '독자',
        token: saved.emailVerificationToken,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(saved);
    });

    it('이메일 변경의 발송 실패는 저장 결과에 영향을 주지 않는다', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce({ ...userOf('local'), nickname: '독자' })
        .mockResolvedValueOnce(null);
      mockMailService.send.mockResolvedValue({
        status: 'failed',
        reason: 'delivery',
      });
      await expect(
        service.updateUser(1, { email: 'new@example.com' }),
      ).resolves.toMatchObject({
        email: 'new@example.com',
        isEmailVerified: false,
      });
    });
  });

  describe('resendVerificationEmail', () => {
    const recipient = () => ({
      id: 1,
      email: 'reader@example.com',
      nickname: '독자',
      isEmailVerified: false,
    });

    it.each(['sent', 'logged'])(
      '%s이면 새 24시간 토큰을 저장하고 성공한다',
      async (status) => {
        const user = recipient();
        mockUserRepository.findOne.mockResolvedValue(user);
        mockMailService.send.mockResolvedValue({ status });
        const startedAt = Date.now();
        await expect(
          service.resendVerificationEmail(1),
        ).resolves.toBeUndefined();
        expect(mockUserRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            emailVerificationToken: expect.any(String),
            emailVerificationExpiresAt: expect.any(Date),
          }),
        );
        const saved = mockUserRepository.save.mock.calls[0][0];
        expect(
          saved.emailVerificationExpiresAt.getTime(),
        ).toBeGreaterThanOrEqual(startedAt + 24 * 60 * 60 * 1000);
        expect(mockMailService.send).toHaveBeenCalledWith(verificationMail, {
          email: user.email,
          nickname: user.nickname,
          token: saved.emailVerificationToken,
        });
        expect(
          mockUserRepository.save.mock.invocationCallOrder[0],
        ).toBeLessThan(mockMailService.send.mock.invocationCallOrder[0]);
      },
    );

    it.each(['delivery', 'rendering'])(
      '%s 실패를 503 비즈니스 오류로 전달한다',
      async (reason) => {
        mockUserRepository.findOne.mockResolvedValue(recipient());
        mockMailService.send.mockResolvedValue({ status: 'failed', reason });
        await expect(service.resendVerificationEmail(1)).rejects.toMatchObject({
          errorCode: 'AUTH_VERIFICATION_EMAIL_SEND_FAILED',
          status: 503,
        });
      },
    );

    it.each([
      [null, 'USER_NOT_FOUND'],
      [{ ...recipient(), isEmailVerified: true }, 'ALREADY_VERIFIED'],
      [{ ...recipient(), email: null }, 'EMAIL_NOT_FOUND'],
    ])('기존 인증 조건 %j는 %s로 거절한다', async (user, errorCode) => {
      mockUserRepository.findOne.mockResolvedValue(user);
      await expect(service.resendVerificationEmail(1)).rejects.toMatchObject({
        errorCode,
      });
      expect(mockMailService.send).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});
