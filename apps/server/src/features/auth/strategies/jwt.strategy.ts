import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserService } from '@/features/user/services/user.service';
import { BusinessException } from '@/shared/exceptions';

import { JwtPayload } from '../types/jwt-payload.type';
import { isTokenRevoked } from '../utils/is-token-revoked';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private userService: UserService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);

    // 탈퇴 검사를 여기서도 한다. 액세스 토큰은 탈퇴 후에도 만료 전까지
    // 유효하므로, 리프레시 경로에서만 막으면 그 사이 요청이 통과한다.
    if (!user || user.deletedAt) {
      throw new BusinessException('AUTH_UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }

    // 로그아웃으로 무효화된 토큰. 401을 받은 클라이언트는 리프레시를 시도하고,
    // 리프레시 토큰도 같은 이유로 거부되어 세션이 끝난다
    if (isTokenRevoked(payload, user)) {
      throw new BusinessException(
        'AUTH_TOKEN_EXPIRED',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }
}
