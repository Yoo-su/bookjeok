import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { BusinessException } from '@/shared/exceptions';

/**
 * 선택적 JWT 인증 가드
 * 토큰이 있으면 검증하고 user를 설정하고,
 * 토큰이 없거나 유효하지 않으면 user를 null로 설정합니다.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: Error | null,
    user: TUser | false,
    _info?: unknown,
    context?: ExecutionContext,
  ): TUser | null {
    const request = context?.switchToHttp().getRequest<{
      headers?: { authorization?: string };
    }>();

    // 토큰을 보내지 않은 요청만 익명으로 허용합니다.
    if (!request?.headers?.authorization) {
      return null as TUser;
    }

    // 토큰을 보냈다면 만료·손상된 세션을 익명으로 숨기지 않고 401로 알려
    // 클라이언트가 토큰 갱신 후 요청을 재시도할 수 있게 합니다.
    if (err || !user) {
      if (err instanceof BusinessException) throw err;
      throw new BusinessException('AUTH_UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}
