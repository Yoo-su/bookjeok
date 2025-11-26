import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../services/chat.service';
import { User } from '@/features/user/entities/user.entity';
import { Logger, UseGuards } from '@nestjs/common';
import { SocketAuthGuard } from '../guards/socket-auth.guard';
import { ChatMessage } from '../entities/chat-message.entity';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/features/user/services/user.service';
import { JwtPayload } from '@/features/auth/types/jwt-payload.type';
import { ChatRoom } from '../entities/chat-room.entity';

@UseGuards(SocketAuthGuard)
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_DOMAIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<number, Socket> = new Map();
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new Error('Missing authorization token');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new Error(`User with id ${payload.sub} not found`);
      }

      client.data.user = user;

      this.connectedUsers.set(user.id, client);
      this.logger.log(`Client connected: ${client.id}, User ID: ${user.id}`);

      client.emit('connected', {
        message: 'Successfully connected to chat server.',
      });
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      client.emit('error', new WsException(error.message));
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.connectedUsers.delete(client.data.user.id);
      this.logger.log(
        `Client disconnected: ${client.id}, User ID: ${client.data.user.id}`,
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  /**
   * 특정 유저들을 특정 소켓 룸에 참여시킵니다.
   * ChatService에서 채팅방이 생성될 때 호출됩니다.
   * @param userIds - 룸에 참여시킬 유저 ID 배열
   * @param roomId - 참여할 룸 ID
   */
  async joinRoom(userIds: number[], roomId: number) {
    const roomIdStr = String(roomId);
    const joinPromises = userIds.map(async (userId) => {
      const userSocket = this.connectedUsers.get(userId);
      if (userSocket) {
        await userSocket.join(roomIdStr);
        this.logger.log(
          `User ${userId} (Client ${userSocket.id}) joined room ${roomIdStr}`,
        );
      } else {
        this.logger.warn(`User ${userId} is not connected.`);
      }
    });
    await Promise.all(joinPromises);
  }

  /**
   * 유저가 채팅방에 다시 참여했음을 알립니다.
   * ChatService에서 호출됩니다.
   */
  emitUserRejoined(roomId: number, message: ChatMessage) {
    this.server.to(String(roomId)).emit('userRejoined', {
      roomId,
      message,
    });
  }

  /**
   * 특정 유저에게 새로운 채팅방이 생성되었음을 알립니다.
   * @param userId - 알림을 받을 유저의 ID
   * @param room - 생성된 채팅방의 정보
   */
  notifyNewRoom(userId: number, room: ChatRoom) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit('newChatRoom', room);
      this.logger.log(
        `Notified user ${userId} (Client ${userSocket.id}) of new room ${room.id}`,
      );
    } else {
      this.logger.warn(
        `User ${userId} is not connected. Cannot notify about new room.`,
      );
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { roomId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    const { roomId, content } = data;

    try {
      const message = await this.chatService.saveMessage(content, roomId, user);
      this.server.to(String(roomId)).emit('newMessage', message);
      return { status: 'ok', message }; // ACK 대신 반환값으로 처리
    } catch (error) {
      this.logger.error(
        `Failed to save message for user ${user.id} in room ${roomId}: ${error.message}`,
      );
      throw new WsException(error.message); // WsException으로 에러 전달
    }
  }

  @SubscribeMessage('joinRooms')
  async handleJoinRooms(
    @MessageBody() roomIds: number[],
    @ConnectedSocket() client: Socket,
  ) {
    if (!Array.isArray(roomIds)) {
      throw new WsException('Invalid roomIds. Must be an array of numbers.');
    }
    const roomIdsAsStrings = roomIds.map(String);
    await client.join(roomIdsAsStrings);
    this.logger.log(
      `Client ${client.id} joined rooms: [${roomIdsAsStrings.join(', ')}]`,
    );
    return { status: 'ok', joinedRooms: roomIds };
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
        message: systemMessage,
      });
      await client.leave(String(roomId));
      this.logger.log(`User ${user.id} left room ${roomId}`);
      return { status: 'ok', message: `Successfully left room ${roomId}` };
    } catch (error) {
      this.logger.error(
        `Failed to leave room ${roomId} for user ${user.id}: ${error.message}`,
      );
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('startTyping')
  handleStartTyping(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    client
      .to(String(data.roomId))
      .emit('typing', { nickname: user.nickname, isTyping: true });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    client
      .to(String(data.roomId))
      .emit('typing', { nickname: user.nickname, isTyping: false });
  }
}
