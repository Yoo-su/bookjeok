import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function SocialAuth(provider: 'naver' | 'kakao') {
  return applyDecorators(UseGuards(AuthGuard(provider)));
}
