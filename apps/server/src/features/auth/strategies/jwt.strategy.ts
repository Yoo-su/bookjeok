import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserService } from '@/features/user/services/user.service';
import { BusinessException } from '@/shared/exceptions';

import { JwtPayload } from '../types/jwt-payload.type';

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
    return user;
  }
}
