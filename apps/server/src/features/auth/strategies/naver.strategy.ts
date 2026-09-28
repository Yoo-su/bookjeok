import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-naver';

import { User } from '@/features/user/entities/user.entity';

import { AuthService } from '../services/auth.service';

interface NaverProfileJson {
  id?: string | number;
  nickname?: string;
  profile_image?: string;
  name?: string;
  email?: string;
  gender?: string;
  age?: string | number;
}

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get('NAVER_CLIENT_ID') ?? '',
      clientSecret: configService.get('NAVER_CLIENT_SECRET') ?? '',
      callbackURL: configService.get('NAVER_CALLBACK_URL') ?? '',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: User | false, info?: unknown) => void,
  ) {
    const naverJson = (profile as unknown as { _json: NaverProfileJson })._json;
    const providerId = naverJson.id != null ? `${naverJson.id}` : '';
    const nickname = naverJson.nickname || '';
    const profileImg = naverJson.profile_image || '';
    const name = naverJson.name || undefined;
    const email = naverJson.email || undefined;
    const gender = naverJson.gender || undefined;
    const ageRange = naverJson.age != null ? `${naverJson.age}` : undefined;
    const provider = 'naver';

    try {
      const user = await this.authService.validateUser({
        provider,
        providerId,
        nickname,
        profileImg,
        name,
        email,
        gender,
        ageRange,
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}
