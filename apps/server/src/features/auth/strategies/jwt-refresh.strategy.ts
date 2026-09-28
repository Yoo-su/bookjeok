import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserService } from '@/features/user/services/user.service';
import { BusinessException } from '@/shared/exceptions';

import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);
    if (!user || user.deletedAt) {
      throw new BusinessException('AUTH_UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }

    // 발급 시점의 tokenVersion과 현재 DB의 tokenVersion이 다르면(로그아웃 또는 무효화된 토큰) 거부
    if (
      payload.tokenVersion !== undefined &&
      user.tokenVersion !== payload.tokenVersion
    ) {
      throw new BusinessException(
        'AUTH_TOKEN_EXPIRED',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
