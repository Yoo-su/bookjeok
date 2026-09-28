import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

import { JwtPayload } from '@/features/auth/types/jwt-payload.type';
import { isTokenRevoked } from '@/features/auth/utils/is-token-revoked';
import { User } from '@/features/user/entities/user.entity';

/** 소켓 인증에 필요한 유저 조회 능력만 요구한다 (UserService 전체를 묶지 않기 위함) */
export interface SocketUserLookup {
  findById(id: number): Promise<User | null>;
}

/**
 * 소켓 연결 핸드셰이크의 JWT를 검증하고 유저를 돌려줍니다.
 *
 * NestJS 가드는 `@SubscribeMessage` 핸들러에만 걸리고 `handleConnection`에는
 * 걸리지 않습니다. 그래서 연결 시점 인증은 게이트웨이가 직접 해야 하는데,
 * 게이트웨이마다 따로 구현하면 한쪽만 고쳐지는 일이 생깁니다. 검증 규칙을
 * 여기 한 곳에 둡니다.
 *
 * @throws Error 토큰이 없거나, 유효하지 않거나, 탈퇴한 계정일 때
 */
export async function authenticateSocket(
  client: Socket,
  jwtService: JwtService,
  userLookup: SocketUserLookup,
): Promise<User> {
  const token =
    (client.handshake.auth?.token as string | undefined) ||
    client.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new Error('인증 토큰이 없습니다.');
  }

  const payload = await jwtService.verifyAsync<JwtPayload>(token, {
    secret: process.env.JWT_SECRET,
  });

  const user = await userLookup.findById(payload.sub);

  if (!user) {
    throw new Error(`ID가 ${payload.sub}인 사용자를 찾을 수 없습니다.`);
  }

  // 탈퇴한 계정의 토큰은 만료 전까지 유효하므로 여기서 막는다.
  if (user.deletedAt) {
    throw new Error('탈퇴한 계정입니다.');
  }

  // 로그아웃으로 무효화된 토큰. 인증은 연결 시점에만 하므로 여기서 막아야 한다.
  if (isTokenRevoked(payload, user)) {
    throw new Error('무효화된 토큰입니다.');
  }

  return user;
}
