import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';

import { USER_SELF_GROUP } from '@/features/user/constants';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';
import { ActivityType } from '@/shared/activity/activity-type.enum';
import { TrackActivity } from '@/shared/activity/decorators/track-activity.decorator';

import { SocialAuth } from '../decorators/social-auth.decorator';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { AuthService } from '../services/auth.service';

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
  async naverLogin() {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({
    summary: '네이버 로그인 콜백',
    description:
      '네이버 로그인 후 1회용 인증 티켓을 발급하여 클라이언트로 리다이렉트합니다.',
  })
  @ApiResponse({
    status: 302,
    description: '로그인 성공 후 클라이언트로 리다이렉트됩니다.',
  })
  async naverLoginCallback(@CurrentUser() user: User, @Res() res: Response) {
    const ticket = await this.authService.createAuthTicket(user);

    const clientDomain =
      this.configService.get<string>('CLIENT_DOMAIN') ??
      'http://localhost:3000';
    const url = new URL(`${clientDomain}/callback`);
    url.searchParams.set('ticket', ticket);
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
  async kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({
    summary: '카카오 로그인 콜백',
    description:
      '카카오 로그인 후 1회용 인증 티켓을 발급하여 클라이언트로 리다이렉트합니다.',
  })
  @ApiResponse({
    status: 302,
    description: '로그인 성공 후 클라이언트로 리다이렉트됩니다.',
  })
  async kakaoLoginCallback(@CurrentUser() user: User, @Res() res: Response) {
    const ticket = await this.authService.createAuthTicket(user);

    const clientDomain =
      this.configService.get<string>('CLIENT_DOMAIN') ??
      'http://localhost:3000';
    const url = new URL(`${clientDomain}/callback`);
    url.searchParams.set('ticket', ticket);
    return res.redirect(url.toString());
  }

  @Post('send-verification-email')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: '이메일 인증 메일 재발송',
    description: '로그인한 사용자에게 이메일 인증 링크를 재발송합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '인증 메일 발송 성공',
  })
  async sendVerificationEmail(@CurrentUser() user: User) {
    return await this.authService.resendVerificationEmail(user.id);
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: '이메일 인증 토큰 검증',
    description:
      '이메일로 전달받은 1회용 인증 토큰을 검증하여 이메일 인증을 완료합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '이메일 인증 완료',
  })
  async verifyEmail(@Body('token') token: string) {
    return await this.authService.verifyEmail(token);
  }

  @Post('exchange')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: '1회용 인증 티켓 교환',
    description:
      '소셜 로그인 후 발급된 1회용 인증 티켓을 Access/Refresh Token으로 교환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '토큰 및 사용자 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않거나 만료된 티켓입니다.',
  })
  async exchangeTicket(@Body('ticket') ticket: string) {
    return await this.authService.exchangeTicket(ticket);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
    const { id: userId, nickname, role, tokenVersion } = user;
    const tokens = await this.authService.refresh(
      userId,
      nickname,
      role,
      tokenVersion ?? 0,
    );
    return tokens;
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '로그아웃',
    description:
      '사용자의 토큰 버전을 증가시켜 기존 Refresh Token을 즉시 무효화합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
  })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    return { success: true };
  }

  @Post('signup')
  // 응답의 user가 요청자 본인이라 이메일 등 본인용 필드를 함께 내보낸다
  @SerializeOptions({ groups: [USER_SELF_GROUP] })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @TrackActivity(ActivityType.REGISTER)
  @ApiOperation({
    summary: '이메일 회원가입',
    description: '이메일과 비밀번호로 회원가입을 진행합니다.',
  })
  async signup(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  // 응답의 user가 요청자 본인이라 이메일 등 본인용 필드를 함께 내보낸다
  @SerializeOptions({ groups: [USER_SELF_GROUP] })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @TrackActivity(ActivityType.LOGIN)
  @ApiOperation({
    summary: '이메일 로그인',
    description: '이메일과 비밀번호로 로그인을 진행합니다.',
  })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}
