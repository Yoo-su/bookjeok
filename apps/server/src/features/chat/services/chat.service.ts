import { MAX_CHAT_IMAGES } from '@bookjeok/core';
import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ACTIVE_ORDER_STATUSES } from '@/features/order/constants';
import { Order } from '@/features/order/entities/order.entity';
import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { UsedBookSaleService } from '@/features/used-book-sale/services/used-book-sale.service';
import { User } from '@/features/user/entities/user.entity';
import { isPaymentEnabled } from '@/shared/config/feature-flags';
import { BusinessException } from '@/shared/exceptions/business.exception';
import { clampNumber } from '@/shared/utils/clamp-number';
import { toSocketPayload } from '@/shared/websocket/to-socket-payload';

import { ChatMessage, ChatMessageType } from '../entities/chat-message.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatGateway } from '../gateways/chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatParticipant)
    private readonly chatParticipantRepository: Repository<ChatParticipant>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly usedBookSaleService: UsedBookSaleService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // 동일 saleId:buyerId에 대해 동시에 진행 중인 채팅방 조회/생성 작업을 관리하는 Map (Request Collapsing)
  private roomCreationTasks = new Map<string, Promise<ChatRoom>>();

  /**
   * 판매글 ID와 구매자 ID로 채팅방을 찾거나 생성하여 반환합니다.
   * - Request Collapsing을 통해 동일 판매글/구매자 동시 요청 시 중복 방 생성을 방지합니다.
   * @param saleId 판매글 ID
   * @param buyerId 구매자 ID
   * @returns 채팅방 엔티티
   */
  async getChatRoom(saleId: number, buyerId: number): Promise<ChatRoom> {
    const taskKey = `${saleId}:${buyerId}`;
    const existingTask = this.roomCreationTasks.get(taskKey);
    if (existingTask) {
      return await existingTask;
    }

    const task = this.resolveChatRoom(saleId, buyerId).finally(() => {
      this.roomCreationTasks.delete(taskKey);
    });

    this.roomCreationTasks.set(taskKey, task);
    return await task;
  }

  /**
   * 채팅방 조회 및 신규 생성 실제 비즈니스 로직
   */
  private async resolveChatRoom(
    saleId: number,
    buyerId: number,
  ): Promise<ChatRoom> {
    const sale = await this.usedBookSaleService.findSaleById(saleId);
    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    // 탈퇴 회원의 판매글은 상태로만 판별할 수 없다. 탈퇴 정리는 활성 판매글만
    // WITHDRAWN으로 내리고 판매 완료(SOLD) 건은 그대로 두기 때문이다.
    // 판매자를 직접 보지 않으면 그 SOLD 글에 유령 채팅방이 생긴다.
    if (sale.status === SaleStatus.WITHDRAWN || sale.user.deletedAt) {
      throw new BusinessException(
        'SALE_ALREADY_WITHDRAWN',
        HttpStatus.BAD_REQUEST,
      );
    }

    const sellerId = sale.user.id;
    if (sellerId === buyerId) {
      throw new BusinessException('CHAT_SELF_CHAT', HttpStatus.FORBIDDEN);
    }

    // 판매자 이메일 인증 여부 검증
    if (sale.user.isEmailVerified === false) {
      throw new BusinessException('EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);
    }

    // 1. 기존 방 조회 (탈퇴자 제외하고 활성 참가자 확인)
    const existingRoom = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.participants', 'p1')
      .innerJoin('p1.user', 'u1', 'u1.id = :buyerId AND u1.deletedAt IS NULL', {
        buyerId,
      })
      .innerJoin('room.participants', 'p2')
      .innerJoin(
        'p2.user',
        'u2',
        'u2.id = :sellerId AND u2.deletedAt IS NULL',
        { sellerId },
      )
      .where('room.usedBookSale.id = :saleId', { saleId })
      .leftJoinAndSelect('room.participants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.user', 'user')
      .getOne();

    if (existingRoom) {
      const participantsToUpdate = existingRoom.participants.filter(
        (p) => !p.isActive,
      );

      if (participantsToUpdate.length > 0) {
        const systemMessages = await this.reactivateParticipants(
          existingRoom,
          participantsToUpdate,
        );

        // 소켓 이벤트 전송
        for (const msg of systemMessages) {
          this.chatGateway.emitUserRejoined(existingRoom.id, msg);
        }
      }

      // 유저가 나갔다가 다시 들어온 경우, 필요한 관계들이 로드되지 않았을 수 있으므로 다시 조회합니다.
      const reloadedRoom = await this.chatRoomRepository.findOne({
        where: { id: existingRoom.id },
        relations: [
          'participants',
          'participants.user',
          'usedBookSale',
          'usedBookSale.book',
          'usedBookSale.user',
        ],
      });

      if (!reloadedRoom) {
        throw new BusinessException(
          'CHAT_FAILED_RETRIEVE',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return reloadedRoom;
    }

    // 2. 새 방 생성
    const savedRoom = await this.createNewChatRoom(sale, buyerId, sellerId);

    // 소켓 작업
    this.chatGateway.joinRoom([buyerId, sellerId], savedRoom.id);

    const createdRoom = await this.chatRoomRepository.findOne({
      where: { id: savedRoom.id },
      relations: [
        'participants',
        'participants.user',
        'usedBookSale',
        'usedBookSale.book',
        'usedBookSale.user',
      ],
    });

    if (!createdRoom)
      throw new BusinessException(
        'CHAT_FAILED_RETRIEVE',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    this.chatGateway.notifyNewRoom(sellerId, createdRoom);

    // 신규 채팅방 생성 비동기 알림 이벤트 발행
    const buyerParticipant = createdRoom.participants?.find(
      (p) => p.user?.id === buyerId,
    );
    this.eventEmitter.emit('chat.room_created', {
      seller: sale.user,
      buyerNickname: buyerParticipant?.user?.nickname ?? '구매자',
      bookTitle: sale.book?.title ?? '중고 도서',
      chatRoomId: createdRoom.id,
    });

    return createdRoom;
  }

  private async reactivateParticipants(
    existingRoom: ChatRoom,
    participantsToUpdate: ChatParticipant[],
  ): Promise<ChatMessage[]> {
    participantsToUpdate.forEach((p) => (p.isActive = true));
    await this.chatParticipantRepository.save(participantsToUpdate);

    existingRoom.updatedAt = new Date();
    await this.chatRoomRepository.save(existingRoom);

    const systemMessages: ChatMessage[] = [];
    for (const participant of participantsToUpdate) {
      const systemMessage = this.chatMessageRepository.create({
        chatRoom: { id: existingRoom.id },
        content: `${participant.user.nickname}님이 다시 참여했습니다.`,
        sender: null,
      });
      const savedMessage = await this.chatMessageRepository.save(systemMessage);
      systemMessages.push(savedMessage);
    }
    return systemMessages;
  }

  private async createNewChatRoom(
    sale: UsedBookSale,
    buyerId: number,
    sellerId: number,
  ): Promise<ChatRoom> {
    const newRoom = this.chatRoomRepository.create({ usedBookSale: sale });
    const room = await this.chatRoomRepository.save(newRoom);

    const buyerParticipant = this.chatParticipantRepository.create({
      chatRoom: room,
      user: { id: buyerId } as User,
      isActive: true,
    });
    const sellerParticipant = this.chatParticipantRepository.create({
      chatRoom: room,
      user: { id: sellerId } as User,
      isActive: true,
    });

    await this.chatParticipantRepository.save([
      buyerParticipant,
      sellerParticipant,
    ]);
    return room;
  }

  /**
   * 현재 로그인한 유저의 모든 채팅방 목록을 조회합니다.
   * 각 채팅방의 마지막 메시지, 안 읽은 메시지 개수, 상대방 정보를 포함합니다.
   * @param userId 유저 ID
   * @returns 채팅방 목록 및 상세 정보
   */
  async getChatRooms(userId: number) {
    // 1. 현재 유저가 참여하고 있는 모든 채팅방을 찾습니다.
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin(
        'room.participants',
        'participant',
        'participant.userId = :userId AND participant.isActive = true',
        { userId },
      )
      .leftJoinAndSelect('room.participants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.user', 'participantUser')
      .leftJoinAndSelect('room.usedBookSale', 'sale')
      .leftJoinAndSelect('sale.book', 'book')
      .leftJoinAndSelect('sale.user', 'saleUser')
      .orderBy('room.updatedAt', 'DESC')
      .getMany();

    if (rooms.length === 0) {
      return [];
    }

    const roomIds = rooms.map((room) => room.id);

    // 2. 각 채팅방의 마지막 메시지를 일괄 조회합니다.
    // PostgreSQL의 DISTINCT ON을 사용하여 각 채팅방별 최신 메시지 하나씩만 가져옵니다.
    const lastMessages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.chatRoom', 'chatRoom')
      .where('message.chatRoom.id IN (:...roomIds)', { roomIds })
      .distinctOn(['message.chatRoom.id'])
      .orderBy('message.chatRoom.id')
      .addOrderBy('message.createdAt', 'DESC')
      .getMany();

    const lastMessageMap = new Map<number, ChatMessage>();
    lastMessages.forEach((msg) => {
      lastMessageMap.set(msg.chatRoom.id, msg);
    });

    // 3. 안 읽은 메시지 개수 일괄 조회 (내가 보낸 메시지 제외, 상대방 메시지 및 시스템/거래 메시지 포함)
    //    내 참여자 행의 워터마크보다 ID가 큰 메시지가 안 읽은 메시지
    //    방마다 기준값이 다르므로 참여자 행을 조인해 방별 워터마크 조회
    const unreadCounts = await this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoin('message.sender', 'sender')
      .innerJoin(
        ChatParticipant,
        'participant',
        'participant.chatRoomId = message.chatRoomId AND participant.userId = :userId',
        { userId },
      )
      .select('message.chatRoom.id', 'roomId')
      .addSelect('COUNT(message.id)', 'count')
      .where('message.chatRoom.id IN (:...roomIds)', { roomIds })
      .andWhere('(sender.id IS NULL OR sender.id != :userId)', { userId })
      .andWhere('message.id > COALESCE(participant.lastReadMessageId, 0)')
      .groupBy('message.chatRoom.id')
      .getRawMany();

    const unreadCountMap = new Map<number, number>();
    unreadCounts.forEach((row) => {
      unreadCountMap.set(row.roomId, parseInt(row.count, 10));
    });

    // 4. 데이터 병합
    const roomsWithDetails = rooms.map((room) => {
      return {
        ...room,
        lastMessage: lastMessageMap.get(room.id) || null,
        unreadCount: unreadCountMap.get(room.id) || 0,
      };
    });

    // 5. 정렬 (마지막 메시지 최신순, 없으면 방 업데이트 순)
    roomsWithDetails.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt.getTime() || a.updatedAt.getTime();
      const timeB = b.lastMessage?.createdAt.getTime() || b.updatedAt.getTime();
      return timeB - timeA;
    });

    return roomsWithDetails;
  }

  /**
   * 특정 채팅방의 메시지 목록을 페이지네이션으로 조회합니다.
   * 채팅방 참여자만 조회할 수 있습니다.
   * @param roomId 채팅방 ID
   * @param userId 요청자 ID (참여자 검증용)
   * @param page 페이지 번호
   * @param limit 페이지 당 메시지 수
   * @returns 메시지 목록 및 메타데이터
   */
  async getChatMessages(
    roomId: number,
    userId: number,
    page: number,
    limit: number,
    cursorId?: number,
  ) {
    page = clampNumber(page, 1, 1, Number.MAX_SAFE_INTEGER);
    limit = clampNumber(limit, 20, 1, 100);

    // 채팅방 참여자 검증
    const participant = await this.chatParticipantRepository.findOne({
      where: { chatRoom: { id: roomId }, user: { id: userId } },
    });

    if (!participant) {
      throw new BusinessException('CHAT_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const queryBuilder = this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.chatRoom.id = :roomId', { roomId })
      .orderBy('message.createdAt', 'DESC');

    // 커서 기반 페이지네이션
    if (cursorId) {
      queryBuilder.andWhere('message.id < :cursorId', { cursorId });
    } else {
      // 오프셋 기반 (fallback)
      queryBuilder.skip((page - 1) * limit);
    }

    queryBuilder.take(limit);

    const [messages, opponentLastReadMessageId] = await Promise.all([
      queryBuilder.getMany(),
      // 내 메시지의 읽음 표시 초기값 (첫 페이지에서만 필요)
      cursorId
        ? Promise.resolve(null)
        : this.getOpponentLastReadMessageId(roomId, userId),
    ]);

    // 페이지네이션 정보 계산
    const hasNextPage = messages.length === limit;
    let nextCursor: number | null = null;

    if (hasNextPage && messages.length > 0) {
      nextCursor = messages[messages.length - 1].id;
    }

    return {
      messages,
      hasNextPage,
      nextCursor,
      opponentLastReadMessageId,
    };
  }

  /**
   * 메시지를 저장하고 채팅방의 업데이트 시간을 갱신합니다.
   * 채팅방 참여자만 메시지를 보낼 수 있습니다.
   * @param content 메시지 내용
   * @param roomId 채팅방 ID
   * @param sender 보낸 사람
   * @param imageUrls 첨부 이미지 URL 목록 (있으면 IMAGE 타입으로 저장)
   * @returns 저장된 메시지
   */
  async saveMessage(
    content: string,
    roomId: number,
    sender: User,
    imageUrls?: string[],
  ): Promise<ChatMessage> {
    // 이미지 개수는 DB를 보기 전에 거른다. 초과 요청이면 조회 자체가 낭비다.
    const hasImages = Boolean(imageUrls?.length);

    if (hasImages && imageUrls && imageUrls.length > MAX_CHAT_IMAGES) {
      throw new BusinessException(
        'CHAT_IMAGE_LIMIT_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 참여자 전원을 한 번에 읽어 보낸이 자격과 상대 상태를 함께 판단한다.
    // 예전에는 보낸이 조회와 전체 참여자 조회를 따로 돌려 메시지마다 왕복이
    // 하나 더 있었다.
    const participants = await this.chatParticipantRepository.find({
      where: { chatRoom: { id: roomId } },
      relations: ['user'],
    });

    const me = participants.find((p) => p.user.id === sender.id);
    if (!me?.isActive) {
      throw new BusinessException('CHAT_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    // 상대방이 방을 나갔거나(isActive = false) 탈퇴한 경우 전송 불가
    const hasWithdrawnParticipant = participants.some(
      (p) => p.user.id !== sender.id && (!p.isActive || p.user.deletedAt),
    );

    if (hasWithdrawnParticipant) {
      throw new BusinessException(
        'CHAT_PARTICIPANT_WITHDRAWN',
        HttpStatus.BAD_REQUEST,
      );
    }

    const chatRoom = await this.chatRoomRepository.findOneBy({ id: roomId });
    if (!chatRoom)
      throw new BusinessException('CHAT_ROOM_NOT_FOUND', HttpStatus.NOT_FOUND);

    // 방 목록 정렬 기준이므로 갱신은 필요하다. 엔티티 저장 대신 컬럼만 친다.
    await this.chatRoomRepository.update(roomId, { updatedAt: new Date() });

    const message = this.chatMessageRepository.create({
      content,
      chatRoom,
      sender,
      type: hasImages ? ChatMessageType.IMAGE : ChatMessageType.TEXT,
      metadata: hasImages ? { imageUrls } : null,
    });
    return await this.chatMessageRepository.save(message);
  }

  /**
   * 특정 채팅방을 "여기까지 읽음"으로 표시합니다.
   * 읽음 여부를 메시지 건별로 쌓지 않고 참여자 행의 워터마크(lastReadMessageId)만
   * 갱신하여, 쓰기 비용이 메시지 수와 무관하도록 합니다.
   *
   * @param roomId 채팅방 ID
   * @param userId 유저 ID
   * @returns `updated`는 워터마크 갱신 여부(0 또는 1), `lastReadMessageId`는 현재 읽음 지점
   */
  async markMessagesAsRead(roomId: number, userId: number) {
    // 1. 내가 보내지 않은(상대방·시스템·거래) 마지막 메시지 ID가 새 워터마크
    const raw = await this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoin('message.sender', 'sender')
      .select('MAX(message.id)', 'watermark')
      .where('message.chatRoom.id = :roomId', { roomId })
      .andWhere('(sender.id IS NULL OR sender.id != :userId)', { userId })
      .getRawOne<{ watermark: string | null }>();

    const watermark = raw?.watermark ? Number(raw.watermark) : null;

    if (watermark === null) {
      return {
        success: true,
        updated: 0,
        lastReadMessageId: null,
        message: 'No new messages to mark as read.',
      };
    }

    // 2. 워터마크는 전진만 허용
    //    동시/지연 요청이 읽음 지점을 되돌려 안 읽음이 되살아나는 것을 조건으로 차단
    const result = await this.chatParticipantRepository
      .createQueryBuilder()
      .update(ChatParticipant)
      .set({ lastReadMessageId: watermark })
      .where('"chatRoomId" = :roomId', { roomId })
      .andWhere('"userId" = :userId', { userId })
      .andWhere(
        '("lastReadMessageId" IS NULL OR "lastReadMessageId" < :watermark)',
        { watermark },
      )
      .execute();

    return {
      success: true,
      updated: result.affected ?? 0,
      // 상대방에게 브로드캐스트할 읽음 기준점
      lastReadMessageId: watermark,
      message: 'Messages marked as read.',
    };
  }

  /**
   * 나 이외의 참여자가 읽은 마지막 메시지 ID를 반환합니다.
   * 내 메시지의 읽음 표시 초기값으로 사용합니다. (1:1 채팅이므로 상대방의 읽음 지점)
   */
  async getOpponentLastReadMessageId(
    roomId: number,
    userId: number,
  ): Promise<number | null> {
    const raw = await this.chatParticipantRepository
      .createQueryBuilder('participant')
      .select('MAX(participant.lastReadMessageId)', 'lastReadMessageId')
      .where('participant.chatRoomId = :roomId', { roomId })
      .andWhere('participant.userId != :userId', { userId })
      .getRawOne<{ lastReadMessageId: string | null }>();

    return raw?.lastReadMessageId ? Number(raw.lastReadMessageId) : null;
  }

  /**
   * 주어진 방 중 해당 유저가 활성 참여자인 방 ID만 골라 돌려줍니다.
   *
   * 소켓 룸 참여는 그 방의 모든 브로드캐스트(새 메시지·읽음·입력중)를 받는다는
   * 뜻이므로, 메시지 전송과 같은 수준의 참여자 검증을 통과해야 합니다.
   * 방 개수만큼 조회하지 않도록 한 번에 확인합니다.
   *
   * @param roomIds 클라이언트가 참여를 요청한 방 ID 목록
   * @param userId 요청한 사용자 ID
   * @returns 참여가 허용된 방 ID 목록
   */
  async filterJoinableRoomIds(
    roomIds: number[],
    userId: number,
  ): Promise<number[]> {
    if (roomIds.length === 0) return [];

    const participants = await this.chatParticipantRepository.find({
      where: {
        chatRoom: { id: In(roomIds) },
        user: { id: userId },
        isActive: true,
      },
      relations: ['chatRoom'],
    });

    return participants.map((participant) => participant.chatRoom.id);
  }

  /**
   * 채팅방 나가기
   * @param roomId - 나갈 채팅방 ID
   * @param userId - 나가는 사용자 ID
   */
  async leaveRoom(roomId: number, userId: number) {
    // 1. 활성 거래 여부 검증 (결제 기능 활성화 시 진행 중인 거래가 있는 경우 나가기 불가)
    if (isPaymentEnabled()) {
      const activeOrder = await this.orderRepository.findOne({
        where: {
          chatRoomId: roomId,
          status: In([...ACTIVE_ORDER_STATUSES]),
        },
      });

      if (activeOrder) {
        throw new BusinessException(
          'CHAT_CANNOT_LEAVE_DURING_TRADE',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 2. 내 참여 정보 조회
    const participant = await this.chatParticipantRepository.findOne({
      where: { chatRoom: { id: roomId }, user: { id: userId } },
      relations: ['user'],
    });

    if (!participant || !participant.isActive) {
      throw new BusinessException('CHAT_ALREADY_LEFT', HttpStatus.NOT_FOUND);
    }

    // 3. 내 참여 상태를 false로 변경
    participant.isActive = false;
    await this.chatParticipantRepository.save(participant);

    // 4. 시스템 메시지 생성 ("OOO님이 나갔습니다.")
    const systemMessage = this.chatMessageRepository.create({
      chatRoom: { id: roomId },
      content: `${participant.user.nickname}님이 나갔습니다.`,
      sender: null,
    });
    return await this.chatMessageRepository.save(systemMessage);
  }

  /**
   * 거래 상태 변경 또는 거래 액션에 대한 시스템 메시지를 저장하고 브로드캐스트합니다.
   * @param roomId 채팅방 ID
   * @param content 메시지 내용
   * @param type 메시지 타입 (기본: TRADE_STATUS)
   * @param metadata 거래 상태 정보 등 메타데이터
   */
  async sendTradeMessage(
    roomId: number,
    content: string,
    type: ChatMessageType = ChatMessageType.TRADE_STATUS,
    metadata?: Record<string, any>,
  ): Promise<ChatMessage> {
    const chatRoom = await this.chatRoomRepository.findOneBy({ id: roomId });
    if (!chatRoom) {
      throw new BusinessException('CHAT_ROOM_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    chatRoom.updatedAt = new Date();
    await this.chatRoomRepository.save(chatRoom);

    const message = this.chatMessageRepository.create({
      chatRoom: { id: roomId },
      content,
      type,
      metadata: metadata || null,
      sender: null,
    });

    const savedMessage = await this.chatMessageRepository.save(message);

    // 실시간 소켓 브로드캐스트
    if (this.chatGateway?.server) {
      this.chatGateway.server
        .to(String(roomId))
        .emit('newMessage', toSocketPayload(savedMessage));
    }

    return savedMessage;
  }

  /**
   * 판매자가 특정 구매자와 거래를 시작했을 때, 해당 판매글의 다른 활성 채팅방들에 알림 메시지를 전송합니다.
   * @param saleId 판매글 ID
   * @param currentChatRoomId 제외할 현재 거래 진행 중인 채팅방 ID
   */
  async notifyOtherBuyersTrading(
    saleId: number,
    currentChatRoomId?: number | null,
  ): Promise<void> {
    const queryBuilder = this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.usedBookSale', 'sale')
      .where('sale.id = :saleId', { saleId });

    if (currentChatRoomId) {
      queryBuilder.andWhere('room.id != :currentChatRoomId', {
        currentChatRoomId,
      });
    }

    const otherRooms = await queryBuilder.getMany();
    if (otherRooms.length === 0) return;

    await Promise.allSettled(
      otherRooms.map((room) =>
        this.sendTradeMessage(
          room.id,
          '판매자가 다른 구매자와 거래를 진행 중입니다.',
          ChatMessageType.TRADE_STATUS,
          { saleId, tradeStatus: 'OTHER_TRADING' },
        ),
      ),
    );
  }

  /**
   * 판매가 끝났음을 이 판매글의 다른 채팅방들에 알립니다.
   *
   * 거래가 성사된 방에는 완료 안내가 따로 나가므로 제외합니다. 나머지 방들은
   * "다른 구매자와 거래 진행 중" 안내만 받은 채 남는데, 특히 판매자가 상대를
   * 지정하지 않고 완료한 경우에는 예약 취소 안내조차 오지 않아 계속 기다리게
   * 됩니다.
   */
  async notifySaleSold(
    saleId: number,
    completedChatRoomId?: number | null,
  ): Promise<void> {
    const queryBuilder = this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.usedBookSale', 'sale')
      .where('sale.id = :saleId', { saleId });

    if (completedChatRoomId) {
      queryBuilder.andWhere('room.id != :completedChatRoomId', {
        completedChatRoomId,
      });
    }

    const rooms = await queryBuilder.getMany();
    if (rooms.length === 0) return;

    await Promise.allSettled(
      rooms.map((room) =>
        this.sendTradeMessage(
          room.id,
          '판매자가 판매완료로 표시했습니다.',
          ChatMessageType.TRADE_STATUS,
          { saleId, tradeStatus: 'SOLD' },
        ),
      ),
    );
  }

  /**
   * 예약이 취소되어 판매글이 다시 판매중으로 돌아왔음을 알립니다.
   *
   * 거래 진행 중 안내를 받았던 구매희망자들이 계속 기다리기만 하지 않도록,
   * 예약이 풀린 사실도 같은 경로로 전달합니다.
   */
  async notifySaleBackOnMarket(saleId: number): Promise<void> {
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.usedBookSale', 'sale')
      .where('sale.id = :saleId', { saleId })
      .getMany();

    if (rooms.length === 0) return;

    await Promise.allSettled(
      rooms.map((room) =>
        this.sendTradeMessage(
          room.id,
          '예약이 취소되어 다시 판매중입니다.',
          ChatMessageType.TRADE_STATUS,
          { saleId, tradeStatus: 'BACK_ON_MARKET' },
        ),
      ),
    );
  }
}
