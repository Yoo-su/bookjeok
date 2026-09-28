import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';

import { User } from '@/features/user/entities/user.entity';

import { AuthService } from '../services/auth.service';

interface KakaoProfileJson {
  id?: string | number;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
    name?: string;
    email?: string;
    gender?: string;
    age_range?: string;
  };
}

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get('KAKAO_CLIENT_ID') ?? '',
      clientSecret: configService.get('KAKAO_CLIENT_SECRET') ?? '',
      callbackURL: configService.get('KAKAO_CALLBACK_URL') ?? '',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: User | false, info?: unknown) => void,
  ) {
    const kakaoJson = (profile as unknown as { _json: KakaoProfileJson })._json;
    const providerId = kakaoJson.id != null ? `${kakaoJson.id}` : '';
    const nickname =
      kakaoJson.kakao_account?.profile?.nickname ||
      kakaoJson.properties?.nickname ||
      '';
    const profileImg =
      kakaoJson.kakao_account?.profile?.profile_image_url ||
      kakaoJson.properties?.profile_image ||
      '';
    const name = kakaoJson.kakao_account?.name || undefined;
    const email = kakaoJson.kakao_account?.email || undefined;

    // 성별 포맷 정규화 ('male' -> 'M', 'female' -> 'F')
    let gender: string | undefined = undefined;
    if (kakaoJson.kakao_account?.gender === 'male') {
      gender = 'M';
    } else if (kakaoJson.kakao_account?.gender === 'female') {
      gender = 'F';
    }

    // 연령대 포맷 정규화 ('20~29' -> '20-29')
    const ageRange = kakaoJson.kakao_account?.age_range
      ? kakaoJson.kakao_account.age_range.replace('~', '-')
      : undefined;

    const provider = 'kakao';

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
