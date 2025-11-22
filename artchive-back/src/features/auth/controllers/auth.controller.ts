import { Controller, Get, Post, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

import { AuthService } from '../services/auth.service';
import { ConfigService } from '@nestjs/config';
import { SocialAuth } from '../decorators/social-auth.decorator';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('naver')
  @SocialAuth('naver')
  async naverLogin() {
    // initiates the Naver OAuth2 login flow
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverLoginCallback(@CurrentUser() user: User, @Res() res: Response) {
    const {
      accessToken,
      refreshToken,
      user: userInfo,
    } = await this.authService.socialLogin(user);

    const url = new URL(`${this.configService.get('CLIENT_DOMAIN')}/callback`);
    url.searchParams.set('accessToken', accessToken);
    url.searchParams.set('refreshToken', refreshToken);
    url.searchParams.set('user', JSON.stringify(userInfo));
    return res.redirect(url.toString());
  }

  @Get('kakao')
  @SocialAuth('kakao')
  async kakaoLogin() {
    // initiates the Kakao OAuth2 login flow
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLoginCallback(@CurrentUser() user: User, @Res() res: Response) {
    const {
      accessToken,
      refreshToken,
      user: userInfo,
    } = await this.authService.socialLogin(user);

    const url = new URL(`${this.configService.get('CLIENT_DOMAIN')}/callback`);
    url.searchParams.set('accessToken', accessToken);
    url.searchParams.set('refreshToken', refreshToken);
    url.searchParams.set('user', JSON.stringify(userInfo));
    return res.redirect(url.toString());
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(@CurrentUser() user: User) {
    const { id: userId, nickname } = user;
    const tokens = await this.authService.refresh(userId, nickname);
    return tokens;
  }
}
