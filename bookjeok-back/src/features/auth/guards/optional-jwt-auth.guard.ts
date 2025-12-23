import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

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
    _info: any,
    _context: ExecutionContext,
    _status?: any,
  ): TUser | null {
    // 에러가 있거나 유저가 없으면 null 반환 (예외 던지지 않음)
    if (err || !user) {
      return null as TUser;
    }
    return user;
  }
}
