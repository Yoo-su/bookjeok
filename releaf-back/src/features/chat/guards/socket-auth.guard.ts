import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserService } from '@/features/user/services/user.service';
import { JwtPayload } from '@/features/auth/types/jwt-payload.type';

@Injectable()
export class SocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(SocketAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      this.logger.warn('Missing authorization token');
      this.disconnect(client, 'Missing authorization token');
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        this.logger.warn(`User with id ${payload.sub} not found`);
        this.disconnect(client, 'User not found');
        return false;
      }

      client.data.user = user;
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      this.disconnect(client, error.message);
      return false;
    }
  }

  private disconnect(client: Socket, message: string) {
    client.emit('error', new WsException(message));
    client.disconnect();
  }
}
