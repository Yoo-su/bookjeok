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

  /**
   * 소셜 로그인 정보를 검증하고 유저를 생성하거나 반환합니다.
   * @param socialLoginDto 소셜 로그인 정보
   * @returns 유저 정보
   */
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

  /**
   * 유저 ID와 닉네임을 기반으로 Access Token과 Refresh Token을 생성합니다.
   * @param userId 유저 ID
   * @param userNickname 유저 닉네임
   * @returns Access Token과 Refresh Token
   */
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

  /**
   * 소셜 로그인 성공 후 토큰과 유저 정보를 반환합니다.
   * @param user 유저 엔티티
   * @returns 토큰과 유저 정보
   */
  async socialLogin(user: User) {
    const { accessToken, refreshToken } = await this.getTokens(
      user.id,
      user.nickname,
    );

    return { accessToken, refreshToken, user };
  }

  /**
   * Refresh Token을 사용하여 새로운 토큰을 발급합니다.
   * @param userId 유저 ID
   * @param nickname 유저 닉네임
   * @returns 새로운 Access Token과 Refresh Token
   */
  async refresh(userId: number, nickname: string) {
    return await this.getTokens(userId, nickname);
  }
}
