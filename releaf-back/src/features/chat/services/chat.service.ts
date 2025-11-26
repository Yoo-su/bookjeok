import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { User } from '@/features/user/entities/user.entity';
import { UsedBookSale } from '@/features/book/entities/used-book-sale.entity';
import { ReadReceipt } from '../entities/read-receipt.entity';
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
    @InjectRepository(UsedBookSale)
    private readonly usedBookSaleRepository: Repository<UsedBookSale>,
    @InjectRepository(ReadReceipt)
    private readonly readReceiptRepository: Repository<ReadReceipt>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 판매글 id와 구매자 id로 채팅방을 찾아(생성해) 반환합니다.
   */
  async getChatRoom(saleId: number, buyerId: number): Promise<ChatRoom> {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id: saleId },
      relations: ['user'],
    });
    if (!sale) {
      throw new NotFoundException('Sale not found.');
    }
    const sellerId = sale.user.id;
    if (buyerId === sellerId) {
      throw new ForbiddenException('You cannot start a chat with yourself.');
    }

    const existingRoom = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.participants', 'p1', 'p1.userId = :buyerId', { buyerId })
      .innerJoin('room.participants', 'p2', 'p2.userId = :sellerId', {
        sellerId,
      })
      .where('room.usedBookSale.id = :saleId', { saleId })
      .leftJoinAndSelect('room.participants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.user', 'user')
      .getOne();

    if (existingRoom) {
      const participantsToUpdate = existingRoom.participants.filter(
        (p) => !p.isActive,
      );

      if (participantsToUpdate.length > 0) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          // 1. 참여자 상태 업데이트
          participantsToUpdate.forEach((p) => (p.isActive = true));
          await queryRunner.manager.save(ChatParticipant, participantsToUpdate);

          // 2. 채팅방 업데이트 시간 갱신
          existingRoom.updatedAt = new Date();
          await queryRunner.manager.save(ChatRoom, existingRoom);

          // 3. 시스템 메시지 생성
          const systemMessages: ChatMessage[] = [];
          for (const participant of participantsToUpdate) {
            const systemMessage = this.chatMessageRepository.create({
              chatRoom: { id: existingRoom.id },
              content: `${participant.user.nickname}님이 다시 참여했습니다.`,
              sender: null,
            });
            const savedMessage = await queryRunner.manager.save(
              ChatMessage,
              systemMessage,
            );
            systemMessages.push(savedMessage);
          }

          await queryRunner.commitTransaction();

          // 트랜잭션 성공 후 소켓 이벤트 전송
          for (const msg of systemMessages) {
            this.chatGateway.emitUserRejoined(existingRoom.id, msg);
          }
        } catch (err) {
          await queryRunner.rollbackTransaction();
          throw err;
        } finally {
          await queryRunner.release();
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
        ],
      });

      if (!reloadedRoom) {
        throw new NotFoundException('Failed to retrieve the chat room.');
      }

      return reloadedRoom;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. 새 방 생성
      const newRoom = this.chatRoomRepository.create({ usedBookSale: sale });
      const savedRoom = await queryRunner.manager.save(ChatRoom, newRoom);

      const buyerParticipant = this.chatParticipantRepository.create({
        chatRoom: savedRoom,
        user: { id: buyerId } as User,
        isActive: true,
      });
      const sellerParticipant = this.chatParticipantRepository.create({
        chatRoom: savedRoom,
        user: { id: sellerId } as User,
        isActive: true,
      });

      await queryRunner.manager.save(ChatParticipant, [
        buyerParticipant,
        sellerParticipant,
      ]);

      await queryRunner.commitTransaction();

      // 트랜잭션 성공 후 소켓 작업
      await this.chatGateway.joinRoom([buyerId, sellerId], savedRoom.id);

      const createdRoom = await this.chatRoomRepository.findOne({
        where: { id: savedRoom.id },
        relations: [
          'participants',
          'participants.user',
          'usedBookSale',
          'usedBookSale.book',
        ],
      });

      if (!createdRoom)
        throw new NotFoundException('Failed to retrieve created room');

      this.chatGateway.notifyNewRoom(sellerId, createdRoom);

      return createdRoom;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 현재 로그인한 유저의 모든 채팅방 목록을 조회합니다.
   * 각 채팅방의 마지막 메시지, 안 읽은 메시지 개수, 상대방 정보를 포함합니다.
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
      .orderBy('room.updatedAt', 'DESC')
      .getMany();

    // 2. 각 채팅방에 대한 추가 정보(마지막 메시지, 안 읽은 개수)를 계산합니다.
    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        // 마지막 메시지 조회
        const lastMessage = await this.chatMessageRepository.findOne({
          where: { chatRoom: { id: room.id } },
          order: { createdAt: 'DESC' },
          relations: ['sender'],
        });

        // 안 읽은 메시지 개수 조회 (ReadReceipt 테이블 기준)
        const unreadCount = await this.chatMessageRepository
          .createQueryBuilder('message')
          .leftJoin(
            'message.readReceipts',
            'receipt',
            'receipt.userId = :userId',
            { userId },
          )
          .where('message.chatRoom.id = :roomId', { roomId: room.id })
          .andWhere('message.sender.id != :userId', { userId })
          .andWhere('receipt.id IS NULL') // 내가 읽음 기록을 남기지 않은 메시지
          .getCount();

        return {
          ...room,
          lastMessage,
          unreadCount,
        };
      }),
    );

    // 마지막 메시지 최신순으로 다시 정렬
    roomsWithDetails.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
      );
    });

    return roomsWithDetails;
  }

  /**
   * 특정 채팅방의 메시지 목록을 페이지네이션으로 조회합니다.
   */
  async getChatMessages(roomId: number, page: number, limit: number) {
    const [messages, total] = await this.chatMessageRepository.findAndCount({
      where: { chatRoom: { id: roomId } },
      relations: ['sender'],
      order: { createdAt: 'DESC' }, // 최신 메시지가 먼저 오도록 정렬
      take: limit,
      skip: (page - 1) * limit,
    });

    const hasNextPage = page * limit < total;

    return {
      messages: messages,
      hasNextPage,
    };
  }

  async saveMessage(
    content: string,
    roomId: number,
    sender: User,
  ): Promise<ChatMessage> {
    const chatRoom = await this.chatRoomRepository.findOneBy({ id: roomId });
    if (!chatRoom) throw new NotFoundException('Chat room not found');

    // 메시지가 추가되면 해당 채팅방의 updatedAt을 갱신하여 목록 정렬에 사용
    chatRoom.updatedAt = new Date();
    await this.chatRoomRepository.save(chatRoom);

    const message = this.chatMessageRepository.create({
      content,
      chatRoom,
      sender,
    });
    return await this.chatMessageRepository.save(message);
  }

  /**
   * 특정 채팅방의 안 읽은 메시지를 모두 읽음으로 처리하는 로직
   */
  async markMessagesAsRead(roomId: number, userId: number) {
    // 1. 이 방에서, 상대방이 보냈고, 내가 아직 읽지 않은 모든 메시지를 찾습니다.
    const unreadMessages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoin('message.readReceipts', 'receipt', 'receipt.userId = :userId', {
        userId,
      })
      .where('message.chatRoom.id = :roomId', { roomId })
      .andWhere('message.sender.id != :userId', { userId })
      .andWhere('receipt.id IS NULL')
      .getMany();

    if (unreadMessages.length === 0) {
      return { success: true, message: 'No new messages to mark as read.' };
    }

    // 2. 찾아낸 모든 메시지에 대해 "내가 읽었다"는 기록을 새로 생성합니다.
    const newReceipts = unreadMessages.map((message) =>
      this.readReceiptRepository.create({
        user: { id: userId } as User,
        message: { id: message.id } as ChatMessage,
      }),
    );

    await this.readReceiptRepository.save(newReceipts);

    return { success: true, message: 'Messages marked as read.' };
  }

  /**
   * 채팅방 나가기
   * @param roomId - 나갈 채팅방 ID
   * @param userId - 나가는 사용자 ID
   */
  async leaveRoom(roomId: number, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 내 참여 정보 조회 (Lock을 걸 수도 있음)
      const participant = await queryRunner.manager.findOne(ChatParticipant, {
        where: { chatRoom: { id: roomId }, user: { id: userId } },
        relations: ['user'],
      });

      if (!participant || !participant.isActive) {
        throw new NotFoundException('Chat room not found or already left.');
      }

      // 2. 내 참여 상태를 false로 변경
      participant.isActive = false;
      await queryRunner.manager.save(ChatParticipant, participant);

      // 3. 시스템 메시지 생성 ("OOO님이 나갔습니다.")
      const systemMessage = this.chatMessageRepository.create({
        chatRoom: { id: roomId },
        content: `${participant.user.nickname}님이 나갔습니다.`,
        sender: null,
      });
      const savedMessage = await queryRunner.manager.save(
        ChatMessage,
        systemMessage,
      );

      await queryRunner.commitTransaction();

      return savedMessage;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
