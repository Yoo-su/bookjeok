import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SocialLoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '소셜 로그인 제공자 (예: naver, kakao)',
    example: 'naver',
  })
  provider: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '소셜 로그인 제공자 ID', example: '1234567890' })
  providerId: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: '이메일',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '닉네임', example: '홍길동' })
  nickname: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profileImageUrl?: string;
}
