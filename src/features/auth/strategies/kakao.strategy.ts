import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { AuthService } from '../services/auth.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID ?? '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_CALLBACK_URL ?? '',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void,
  ) {
    try {
      const { id, username: name, profile_image } = profile._json;
      let profileImg = profile_image;
      const provider = 'kakao';
      const providerId = id;
      const username = name;

      if (
        profileImg &&
        typeof profileImg === 'string' &&
        profileImg.startsWith('http://')
      ) {
        profileImg = profileImg.replace('http://', 'https://');
      }

      const user = await this.authService.validateUser({
        provider,
        providerId,
        username,
        profileImg,
      });

      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}
