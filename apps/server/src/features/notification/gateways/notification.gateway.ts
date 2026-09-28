import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { Notification } from '@/features/notification/entities/notification.entity';
import { UserService } from '@/features/user/services/user.service';
import { authenticateSocket } from '@/shared/websocket/authenticate-socket';
import { toSocketPayload } from '@/shared/websocket/to-socket-payload';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_DOMAIN ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'notification',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  /**
   * 클라이언트 소켓 연결 시 처리
   * JWT 토큰을 검증하고 사용자 정보를 소켓 세션에 저장하며 유저 룸에 조인합니다.
   *
   * @param client 연결된 소켓 클라이언트
   */
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
      this.logger.log(
        `Notification Client connected: ${client.id}, User ID: ${user.id}`,
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.disconnect();
    }
  }

  /**
   * 클라이언트 소켓 연결 해제 시 처리
   *
   * @param client 연결 해제된 소켓 클라이언트
   */
  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.logger.log(
        `Notification Client disconnected: User ID ${client.data.user.id}`,
      );
    } else {
      this.logger.log(`Notification Client disconnected: ${client.id}`);
    }
  }

  /**
   * 특정 사용자에게 실시간 알림을 전송합니다.
   * 사용자의 모든 활성 탭/기기(user:${recipientId} 룸)로 브로드캐스팅합니다.
   *
   * @param recipientId 수신자 ID
   * @param payload 전송할 알림 데이터
   */
  sendNotification(
    recipientId: number,
    payload: Notification | Record<string, unknown>,
  ) {
    this.server
      ?.to(`user:${recipientId}`)
      .emit('newNotification', toSocketPayload(payload));
    this.logger.log(`Sent notification to User ${recipientId}`);
  }
}
