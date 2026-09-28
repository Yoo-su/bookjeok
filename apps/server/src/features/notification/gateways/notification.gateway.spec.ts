/* eslint-disable @typescript-eslint/unbound-method */
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';

import { UserService } from '@/features/user/services/user.service';

import { NotificationGateway } from './notification.gateway';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let jwtService: { verifyAsync: jest.Mock };
  let userService: { findById: jest.Mock };

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn(),
    };
    userService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
    gateway.server = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('handleConnection should authenticate and join user room', async () => {
    const mockSocket = {
      id: 'sock-1',
      handshake: {
        auth: { token: 'valid-jwt-token' },
      },
      data: {},
      join: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      emit: jest.fn(),
    } as unknown as Socket;

    const user = { id: 42, nickname: 'User42', tokenVersion: 0 };
    jwtService.verifyAsync.mockResolvedValue({ sub: 42, tokenVersion: 0 });
    userService.findById.mockResolvedValue(user);

    await gateway.handleConnection(mockSocket);

    expect(mockSocket.data.user).toEqual(user);
    expect(mockSocket.join).toHaveBeenCalledWith('user:42');
  });

  it('handleConnection은 로그아웃으로 버전이 오른 토큰을 거부한다', async () => {
    const payload = { sub: 42, tokenVersion: 0 };
    const mockSocket = {
      id: 'sock-2',
      handshake: { auth: { token: 'revoked-jwt-token' } },
      data: {},
      join: jest.fn(),
      disconnect: jest.fn(),
      emit: jest.fn(),
    } as unknown as Socket;

    jwtService.verifyAsync.mockResolvedValue(payload);
    userService.findById.mockResolvedValue({ id: 42, tokenVersion: 1 });

    await gateway.handleConnection(mockSocket);

    expect(mockSocket.join).not.toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('sendNotification should broadcast to user room', () => {
    const mockPayload = { id: 1, type: 'COMMENT_LIKE' };
    const mockToEmitter = { emit: jest.fn() };
    (gateway.server.to as jest.Mock).mockReturnValue(mockToEmitter);

    gateway.sendNotification(42, mockPayload as any);

    expect(gateway.server.to).toHaveBeenCalledWith('user:42');
    expect(mockToEmitter.emit).toHaveBeenCalledWith(
      'newNotification',
      mockPayload,
    );
  });
});
