import { forwardRef, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { User } from '@/features/user/entities/user.entity';
import { UserService } from '@/features/user/services/user.service';
import { authenticateSocket } from '@/shared/websocket/authenticate-socket';
import { toSocketPayload } from '@/shared/websocket/to-socket-payload';

import { ChatMessage } from '../entities/chat-message.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatService } from '../services/chat.service';

/** 상관 ID 최대 길이 (UUID 기준 여유값) */
const MAX_CLIENT_MESSAGE_ID_LENGTH = 64;

/**
 * 클라이언트가 보낸 상관 ID의 유효성을 검사합니다.
 * 저장하지는 않지만 참여자 전원에게 브로드캐스트되므로 형식과 길이를 제한합니다.
 */
const isValidClientMessageId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= MAX_CLIENT_MESSAGE_ID_LENGTH;

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_DOMAIN ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'chat',
  pingInterval: 10000, // 10초마다 ping 전송
  pingTimeout: 5000, // 5초 내 pong 응답이 없으면 연결 끊김 처리
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await authenticateSocket(
        client,
        this.jwtService,
        this.userService,
      );

      client.data.user = user;

      // 멀티탭/멀티디바이스 환경 지원을 위해 유저 전용 룸에 소켓을 조인시킵니다.
      await client.join(`user:${user.id}`);
      this.logger.log(`Client connected: ${client.id}, User ID: ${user.id}`);

      client.emit('connected', {
        message: '채팅 서버에 성공적으로 연결되었습니다.',
      });
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      client.emit('error', new WsException(error.message));
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.logger.log(
        `Client disconnected: ${client.id}, User ID: ${client.data.user.id}`,
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  /**
   * 특정 유저들의 모든 활성 소켓을 특정 채팅방 소켓 룸에 참여시킵니다.
   * ChatService에서 채팅방이 생성될 때 호출됩니다.
   * @param userIds - 룸에 참여시킬 유저 ID 배열
   * @param roomId - 참여할 룸 ID
   */
  joinRoom(userIds: number[], roomId: number): void {
    const roomIdStr = String(roomId);
    for (const userId of userIds) {
      this.server?.in(`user:${userId}`)?.socketsJoin(roomIdStr);
      this.logger.log(`All sockets of User ${userId} joined room ${roomIdStr}`);
    }
  }

  /**
   * 서버가 만든 메시지(거래 상태 등)를 방에 브로드캐스트합니다.
   * 게이트웨이 초기화 전(배치·부팅 중)이면 건너뜁니다.
   */
  emitNewMessage(roomId: number, message: ChatMessage) {
    this.server
      ?.to(String(roomId))
      .emit('newMessage', toSocketPayload(message));
  }

  /**
   * 유저가 채팅방에 다시 참여했음을 알립니다.
   * ChatService에서 호출됩니다.
   */
  emitUserRejoined(roomId: number, message: ChatMessage) {
    this.server.to(String(roomId)).emit('userRejoined', {
      roomId,
      message: toSocketPayload(message),
    });
  }

  /**
   * 특정 유저의 모든 활성 기기/탭에 새로운 채팅방이 생성되었음을 알립니다.
   * @param userId - 알림을 받을 유저의 ID
   * @param room - 생성된 채팅방의 정보
   */
  notifyNewRoom(userId: number, room: ChatRoom) {
    this.server.to(`user:${userId}`).emit('newChatRoom', toSocketPayload(room));
    this.logger.log(`Notified user ${userId} of new room ${room.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      roomId: number;
      content: string;
      imageUrls?: string[];
      clientMessageId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    const { roomId, content, imageUrls, clientMessageId } = data;

    try {
      const message = await this.chatService.saveMessage(
        content,
        roomId,
        user,
        imageUrls,
      );

      // 낙관적 메시지 교체를 위해 상관 ID를 그대로 반환 (저장하지 않는 일회성 필드)
      const serialized = toSocketPayload(message);
      const payload = isValidClientMessageId(clientMessageId)
        ? { ...serialized, clientMessageId }
        : serialized;

      this.server.to(String(roomId)).emit('newMessage', payload);
      return { status: 'ok', message: payload };
    } catch (error) {
      this.logger.error(
        `Failed to save message for user ${user.id} in room ${roomId}: ${error.message}`,
      );
      throw new WsException(error.message);
    }
  }

  /**
   * 클라이언트가 요청한 채팅방 중 실제 참여 중인 방에만 소켓을 참여시킵니다.
   *
   * 소켓 룸에 들어가면 그 방의 모든 브로드캐스트를 받으므로, 요청받은 ID를
   * 그대로 join하면 남의 1:1 대화를 그대로 수신할 수 있습니다. 참여자인 방만
   * 남기고 나머지는 조용히 버립니다.
   */
  @SubscribeMessage('joinRooms')
  async handleJoinRooms(
    @MessageBody() roomIds: number[],
    @ConnectedSocket() client: Socket,
  ) {
    if (!Array.isArray(roomIds)) {
      throw new WsException(
        '유효하지 않은 roomIds입니다. 숫자 배열이어야 합니다.',
      );
    }

    const user = client.data.user as User;
    const requestedIds = roomIds.filter((roomId): roomId is number =>
      Number.isInteger(roomId),
    );

    const joinedRooms = await this.chatService.filterJoinableRoomIds(
      requestedIds,
      user.id,
    );

    if (joinedRooms.length > 0) {
      await client.join(joinedRooms.map(String));
    }

    if (joinedRooms.length < requestedIds.length) {
      this.logger.warn(
        `User ${user.id} requested ${requestedIds.length} rooms but is a participant of ${joinedRooms.length}`,
      );
    }

    this.logger.log(
      `Client ${client.id} joined rooms: [${joinedRooms.join(', ')}]`,
    );
    return { status: 'ok', joinedRooms };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    const { roomId } = data;
    try {
      const systemMessage = await this.chatService.leaveRoom(roomId, user.id);
      this.server.to(String(roomId)).emit('userLeft', {
        roomId,
        message: toSocketPayload(systemMessage),
      });
      await client.leave(String(roomId));
      this.logger.log(`User ${user.id} left room ${roomId}`);
      return {
        status: 'ok',
        message: `채팅방 ${roomId}에서 성공적으로 퇴장했습니다.`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to leave room ${roomId} for user ${user.id}: ${error.message}`,
      );
      throw new WsException(error.message);
    }
  }

  /**
   * 입력중 표시를 방에 브로드캐스트합니다.
   *
   * `client.to(room)`은 보낸 사람이 그 방에 없어도 방 전체에 전달되므로,
   * joinRooms를 통과해 실제로 참여한 방인지 소켓의 룸 목록으로 확인합니다.
   */
  private emitTyping(client: Socket, roomId: number, isTyping: boolean): void {
    if (!client.rooms.has(String(roomId))) {
      return;
    }

    const user = client.data.user as User;
    // 수신 측의 방 구분을 위해 roomId 동봉
    client.to(String(roomId)).emit('typing', {
      roomId,
      nickname: user.nickname,
      isTyping,
    });
  }

  @SubscribeMessage('startTyping')
  handleStartTyping(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.emitTyping(client, data.roomId, true);
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.emitTyping(client, data.roomId, false);
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    const { roomId } = data;
    try {
      const result = await this.chatService.markMessagesAsRead(roomId, user.id);

      // 새로 읽은 메시지가 있을 때만 브로드캐스트
      // (상대방은 이 값으로 자신이 보낸 메시지의 읽음 표시를 갱신)
      if (result.updated > 0 && result.lastReadMessageId !== null) {
        this.server.to(String(roomId)).emit('messagesRead', {
          roomId,
          userId: user.id,
          lastReadMessageId: result.lastReadMessageId,
        });
      }

      return { status: 'ok', lastReadMessageId: result.lastReadMessageId };
    } catch (error) {
      this.logger.error(
        `Failed to mark messages as read for user ${user.id} in room ${roomId}: ${error.message}`,
      );
      return { status: 'error', error: error.message };
    }
  }
}
