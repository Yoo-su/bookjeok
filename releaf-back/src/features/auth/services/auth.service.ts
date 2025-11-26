import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/features/user/services/user.service';

import { User } from '@/features/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.type';
import { TOKEN_EXPIRY } from '../auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(socialLoginDto: {
    provider: string;
    providerId: string;
    nickname: string;
    profileImg: string;
  }) {
    const { provider, providerId, nickname, profileImg } = socialLoginDto;
    const user = await this.userService.findByProviderId(provider, providerId);
    if (user) {
      let isChanged = false;

      // 프로필 이미지가 변경되었다면 업데이트
      if (profileImg && user.profileImageUrl !== profileImg) {
        user.profileImageUrl = profileImg;
        isChanged = true;
      }

      // 닉네임이 변경되었다면 업데이트
      if (nickname && user.nickname !== nickname) {
        user.nickname = nickname;
        isChanged = true;
      }

      if (isChanged) {
        await this.userService.updateUser(user);
      }
      return user;
    }
    const newUser = await this.userService.createUser({
      provider,
      providerId,
      nickname,
      profileImageUrl: profileImg,
    });
    return newUser;
  }

  async getTokens(userId: number, userNickname: string) {
    const payload: JwtPayload = { sub: userId, nickname: userNickname };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async socialLogin(user: User) {
    const { accessToken, refreshToken } = await this.getTokens(
      user.id,
      user.nickname,
    );

    return { accessToken, refreshToken, user };
  }

  async refresh(userId: number, nickname: string) {
    return await this.getTokens(userId, nickname);
  }
}
