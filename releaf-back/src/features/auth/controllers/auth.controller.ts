import { Controller, Get, Post, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

import { AuthService } from '../services/auth.service';
import { ConfigService } from '@nestjs/config';
import { SocialAuth } from '../decorators/social-auth.decorator';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('인증 (Auth)')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('naver')
  @SocialAuth('naver')
  @ApiOperation({
    summary: '네이버 로그인',
    description: '네이버 소셜 로그인을 시작합니다.',
  })
  @ApiResponse({
    status: 302,
    description: '네이버 로그인 페이지로 리다이렉트됩니다.',
  })
  async naverLogin() {
    // initiates the Naver OAuth2 login flow
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({
    summary: '네이버 로그인 콜백',
    description: '네이버 로그인 후 콜백을 처리합니다.',
  })
  @ApiResponse({
    status: 302,
    description: '로그인 성공 후 클라이언트로 리다이렉트됩니다.',
  })
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
  @ApiOperation({
    summary: '카카오 로그인',
    description: '카카오 소셜 로그인을 시작합니다.',
  })
  @ApiResponse({
    status: 302,
    description: '카카오 로그인 페이지로 리다이렉트됩니다.',
  })
  async kakaoLogin() {
    // initiates the Kakao OAuth2 login flow
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({
    summary: '카카오 로그인 콜백',
    description: '카카오 로그인 후 콜백을 처리합니다.',
  })
  @ApiResponse({
    status: 302,
    description: '로그인 성공 후 클라이언트로 리다이렉트됩니다.',
  })
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
  @ApiOperation({
    summary: '토큰 갱신',
    description: 'Refresh Token을 사용하여 Access Token을 갱신합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '새로운 Access Token과 Refresh Token을 반환합니다.',
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않은 Refresh Token입니다.',
  })
  async refresh(@CurrentUser() user: User) {
    const { id: userId, nickname } = user;
    const tokens = await this.authService.refresh(userId, nickname);
    return tokens;
  }
}
