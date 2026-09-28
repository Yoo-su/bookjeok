import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '@/features/order/entities/order.entity';
import { SaleStatus } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { UsedBookSaleService } from '@/features/used-book-sale/services/used-book-sale.service';
import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { ChatMessage } from '../entities/chat-message.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatGateway } from '../gateways/chat.gateway';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  // Repositories
  let chatRoomRepo: Partial<Repository<ChatRoom>>;
  let chatParticipantRepo: Partial<Repository<ChatParticipant>>;
  let chatMessageRepo: Partial<Repository<ChatMessage>>;
  let orderRepo: Partial<Repository<Order>>;
  let mockQueryBuilder: any;
  let messageQueryBuilder: any;
  let participantQueryBuilder: any;

  // Services
  let usedBookSaleService: any;

  // Gateway
  let chatGateway: Partial<ChatGateway>;

  beforeEach(async () => {
    mockQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    chatRoomRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      create: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    // 워터마크 읽음 처리에서 쓰는 쿼리 빌더들
    participantQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      getRawOne: jest.fn(),
    };

    messageQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    chatParticipantRepo = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(participantQueryBuilder),
    };

    chatMessageRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(messageQueryBuilder),
    };

    orderRepo = {
      findOne: jest.fn(),
    };

    usedBookSaleService = {
      findSaleById: jest.fn(),
    };

    chatGateway = {
      joinRoom: jest.fn(),
      notifyNewRoom: jest.fn(),
      emitUserRejoined: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(ChatRoom), useValue: chatRoomRepo },
        {
          provide: getRepositoryToken(ChatParticipant),
          useValue: chatParticipantRepo,
        },
        { provide: getRepositoryToken(ChatMessage), useValue: chatMessageRepo },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        {
          provide: UsedBookSaleService,
          useValue: usedBookSaleService,
        },
        { provide: ChatGateway, useValue: chatGateway },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('getChatRoom', () => {
    it('판매글이 없으면 예외를 던져야 합니다', async () => {
      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue(null);

      await expect(service.getChatRoom(1, 1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('자신의 판매글에 채팅을 시도하면 예외를 던져야 합니다', async () => {
      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue({
        user: { id: 1 },
      });

      await expect(service.getChatRoom(1, 1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('탈퇴한 회원의 판매글로 채팅방 개설을 시도하면 예외를 던져야 합니다', async () => {
      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue({
        user: { id: 2, isEmailVerified: true },
        status: SaleStatus.WITHDRAWN,
      });

      await expect(service.getChatRoom(1, 1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('탈퇴 회원의 판매 완료(SOLD) 판매글도 채팅방을 열 수 없어야 합니다', async () => {
      // 탈퇴 정리는 활성 판매글만 WITHDRAWN으로 내린다. SOLD는 그대로 남으므로
      // 상태만 보면 이 경로가 열린다.
      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue({
        user: { id: 2, isEmailVerified: true, deletedAt: new Date() },
        status: SaleStatus.SOLD,
      });

      await expect(service.getChatRoom(1, 1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('판매자가 이메일 미인증 상태인 경우 EMAIL_NOT_VERIFIED 예외를 던져야 합니다', async () => {
      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue({
        user: { id: 2, isEmailVerified: false },
        status: SaleStatus.FOR_SALE,
      });

      await expect(service.getChatRoom(1, 1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('기존 채팅방이 있으면 올바른 조인 쿼리를 실행하고 반환해야 합니다', async () => {
      const existingRoom = { id: 1, participants: [{ isActive: true }] };
      const sale = { id: 1, user: { id: 2, isEmailVerified: true } };

      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue(sale);
      mockQueryBuilder.getOne.mockResolvedValue(existingRoom);
      (chatRoomRepo.findOne as jest.Mock).mockResolvedValue(existingRoom);

      const result = await service.getChatRoom(1, 1);
      expect(result).toEqual(existingRoom);

      // 올바른 조인 체인 검증
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'room.participants',
        'p1',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'p1.user',
        'u1',
        'u1.id = :buyerId AND u1.deletedAt IS NULL',
        { buyerId: 1 },
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'room.participants',
        'p2',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'p2.user',
        'u2',
        'u2.id = :sellerId AND u2.deletedAt IS NULL',
        { sellerId: 2 },
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'room.usedBookSale.id = :saleId',
        { saleId: 1 },
      );
    });

    it('기존 채팅방이 없으면 새로 생성해야 합니다', async () => {
      const sale = { id: 1, user: { id: 2, isEmailVerified: true } }; // Seller = 2
      const buyerId = 1;

      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue(sale);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const newRoom = { id: 99 };
      (chatRoomRepo.create as jest.Mock).mockReturnValue(newRoom);
      (chatRoomRepo.save as jest.Mock).mockResolvedValue({
        ...newRoom,
        id: 99,
      });
      (chatParticipantRepo.create as jest.Mock).mockImplementation(
        (data: ChatParticipant) => data,
      );
      (chatParticipantRepo.save as jest.Mock).mockResolvedValue([]);
      (chatRoomRepo.findOne as jest.Mock).mockResolvedValue({ ...newRoom });

      await service.getChatRoom(1, buyerId);

      expect(chatRoomRepo.save).toHaveBeenCalled();
      expect(chatParticipantRepo.save).toHaveBeenCalled();
      expect(chatGateway.joinRoom).toHaveBeenCalledWith([buyerId, 2], 99);
      expect(chatGateway.notifyNewRoom).toHaveBeenCalled();
    });

    it('동시에 여러 요청이 들어와도 Request Collapsing에 의해 방 생성이 1회만 실행되어야 합니다', async () => {
      const sale = { id: 1, user: { id: 2, isEmailVerified: true } };
      const buyerId = 1;

      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue(sale);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const newRoom = { id: 99 };
      (chatRoomRepo.create as jest.Mock).mockReturnValue(newRoom);
      (chatRoomRepo.save as jest.Mock).mockResolvedValue({
        ...newRoom,
        id: 99,
      });
      (chatParticipantRepo.create as jest.Mock).mockImplementation(
        (data: ChatParticipant) => data,
      );
      (chatParticipantRepo.save as jest.Mock).mockResolvedValue([]);
      (chatRoomRepo.findOne as jest.Mock).mockResolvedValue({ ...newRoom });

      // 5개의 동시 요청 실행
      const results = await Promise.all([
        service.getChatRoom(1, buyerId),
        service.getChatRoom(1, buyerId),
        service.getChatRoom(1, buyerId),
        service.getChatRoom(1, buyerId),
        service.getChatRoom(1, buyerId),
      ]);

      expect(results).toHaveLength(5);
      results.forEach((res) => expect(res).toEqual(newRoom));
      expect(chatRoomRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveMessage', () => {
    it('참여자가 아니면 메시지를 보낼 수 없습니다', async () => {
      (chatParticipantRepo.find as jest.Mock).mockResolvedValue([
        { user: { id: 2 }, isActive: true },
      ]);

      await expect(
        service.saveMessage('hello', 1, { id: 1 } as User),
      ).rejects.toThrow(BusinessException);
    });

    it('방을 나간 참여자는 메시지를 보낼 수 없습니다', async () => {
      (chatParticipantRepo.find as jest.Mock).mockResolvedValue([
        { user: { id: 1 }, isActive: false },
        { user: { id: 2 }, isActive: true },
      ]);

      await expect(
        service.saveMessage('hello', 1, { id: 1 } as User),
      ).rejects.toThrow(BusinessException);
    });

    it('메시지를 저장하고 채팅방 시간을 업데이트해야 합니다', async () => {
      const user = { id: 1 } as User;
      const room = { id: 1, updatedAt: new Date() };

      (chatParticipantRepo.find as jest.Mock).mockResolvedValue([
        { user: { id: 1 }, isActive: true },
        { user: { id: 2 }, isActive: true },
      ]);
      (chatRoomRepo.findOneBy as jest.Mock).mockResolvedValue(room);
      (chatMessageRepo.create as jest.Mock).mockReturnValue({ content: 'hi' });
      (chatMessageRepo.save as jest.Mock).mockResolvedValue({
        id: 100,
        content: 'hi',
      });

      await service.saveMessage('hi', 1, user);

      expect(chatRoomRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ updatedAt: expect.any(Date) }),
      );
      expect(chatMessageRepo.save).toHaveBeenCalled();
    });

    it('상대방이 탈퇴한 경우 메시지를 전송할 수 없습니다', async () => {
      const user = { id: 1 } as User;

      (chatParticipantRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (chatParticipantRepo.find as jest.Mock).mockResolvedValue([
        { user: { id: 1 }, isActive: true },
        { user: { id: 2, deletedAt: new Date() }, isActive: true },
      ]);

      await expect(service.saveMessage('hi', 1, user)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('markMessagesAsRead', () => {
    it('읽을 메시지가 없으면 참여자 행을 건드리지 않아야 합니다', async () => {
      messageQueryBuilder.getRawOne.mockResolvedValue({ watermark: null });

      const result = await service.markMessagesAsRead(1, 1);

      expect(result).toEqual(
        expect.objectContaining({ updated: 0, lastReadMessageId: null }),
      );
      expect(chatParticipantRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('워터마크를 마지막 메시지 ID로 한 번의 UPDATE로 올려야 합니다', async () => {
      messageQueryBuilder.getRawOne.mockResolvedValue({ watermark: '42' });
      participantQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      const result = await service.markMessagesAsRead(1, 1);

      expect(participantQueryBuilder.set).toHaveBeenCalledWith({
        lastReadMessageId: 42,
      });
      expect(result).toEqual(
        expect.objectContaining({ updated: 1, lastReadMessageId: 42 }),
      );
    });

    it('워터마크는 뒤로 가지 않도록 조건을 걸어야 합니다', async () => {
      messageQueryBuilder.getRawOne.mockResolvedValue({ watermark: '42' });
      // 이미 42까지 읽은 상태라 UPDATE가 아무 행도 건드리지 못한 경우
      participantQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      const result = await service.markMessagesAsRead(1, 1);

      expect(participantQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('"lastReadMessageId" < :watermark'),
        { watermark: 42 },
      );
      // 갱신되지 않았어도 현재 읽음 지점은 그대로 알려줍니다.
      expect(result).toEqual(
        expect.objectContaining({ updated: 0, lastReadMessageId: 42 }),
      );
    });
  });

  describe('getOpponentLastReadMessageId', () => {
    it('상대방 참여자의 워터마크를 숫자로 반환해야 합니다', async () => {
      participantQueryBuilder.getRawOne.mockResolvedValue({
        lastReadMessageId: '17',
      });

      await expect(service.getOpponentLastReadMessageId(1, 1)).resolves.toBe(
        17,
      );
    });

    it('상대방이 아직 읽은 적이 없으면 null을 반환해야 합니다', async () => {
      participantQueryBuilder.getRawOne.mockResolvedValue({
        lastReadMessageId: null,
      });

      await expect(
        service.getOpponentLastReadMessageId(1, 1),
      ).resolves.toBeNull();
    });
  });

  describe('leaveRoom', () => {
    it('참여자가 아니거나 이미 나간 경우 예외를 던져야 합니다', async () => {
      (chatParticipantRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.leaveRoom(1, 1)).rejects.toThrow(BusinessException);
    });

    it('진행 중인 활성 거래가 존재하는 경우 CHAT_CANNOT_LEAVE_DURING_TRADE 예외를 던져야 합니다', async () => {
      (orderRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        chatRoomId: 1,
      });

      await expect(service.leaveRoom(1, 1)).rejects.toThrow(BusinessException);
    });

    it('채팅방을 정상적으로 나가고 시스템 메시지를 생성해야 합니다', async () => {
      const participant = {
        id: 1,
        isActive: true,
        user: { id: 1, nickname: '테스터' },
      };

      (orderRepo.findOne as jest.Mock).mockResolvedValue(null);
      (chatParticipantRepo.findOne as jest.Mock).mockResolvedValue(participant);
      (chatMessageRepo.create as jest.Mock).mockReturnValue({
        content: '테스터님이 나갔습니다.',
      });
      (chatMessageRepo.save as jest.Mock).mockResolvedValue({
        id: 200,
        content: '테스터님이 나갔습니다.',
      });

      const result = await service.leaveRoom(1, 1);

      expect(participant.isActive).toBe(false);
      expect(chatParticipantRepo.save).toHaveBeenCalledWith(participant);
      expect(chatMessageRepo.save).toHaveBeenCalled();
      expect(result.content).toBe('테스터님이 나갔습니다.');
    });
  });

  describe('sendTradeMessage', () => {
    it('거래 상태 메시지를 저장하고 브로드캐스트해야 합니다', async () => {
      const room = { id: 10, updatedAt: new Date() };
      (chatRoomRepo.findOneBy as jest.Mock).mockResolvedValue(room);
      (chatMessageRepo.create as jest.Mock).mockImplementation(
        (data: unknown) => data,
      );
      (chatMessageRepo.save as jest.Mock).mockImplementation((data: unknown) =>
        Promise.resolve({ id: 50, ...(data as object) }),
      );

      const result = await service.sendTradeMessage(
        10,
        '결제가 완료되었습니다.',
        undefined,
        { orderId: 1 },
      );

      expect(result).toBeDefined();
      expect(result.content).toBe('결제가 완료되었습니다.');
      expect(chatRoomRepo.save).toHaveBeenCalled();
      expect(chatMessageRepo.save).toHaveBeenCalled();
    });

    it('채팅방이 존재하지 않으면 CHAT_ROOM_NOT_FOUND 예외를 던져야 합니다', async () => {
      (chatRoomRepo.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.sendTradeMessage(999, '메시지')).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('notifyOtherBuyersTrading', () => {
    it('동일 판매글의 다른 채팅방들에 거래 진행 메시지를 발송해야 합니다', async () => {
      const otherRooms = [{ id: 11 }, { id: 12 }];
      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(otherRooms);
      (chatRoomRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(otherRooms),
      });

      const spy = jest
        .spyOn(service, 'sendTradeMessage')
        .mockResolvedValue({ id: 1 } as any);

      await service.notifyOtherBuyersTrading(100, 10);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(
        11,
        '판매자가 다른 구매자와 거래를 진행 중입니다.',
        expect.anything(),
        expect.objectContaining({ saleId: 100 }),
      );
    });
  });
});
