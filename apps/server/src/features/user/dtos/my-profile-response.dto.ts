import { ApiProperty } from '@nestjs/swagger';

import { User } from '../entities/user.entity';

export class MyProfileResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  id: number;

  @ApiProperty({ description: '이메일' })
  email: string;

  @ApiProperty({ description: '닉네임' })
  nickname: string;

  @ApiProperty({ description: '핸들 (고유 ID)' })
  handle: string;

  @ApiProperty({ description: '프로필 이미지 URL', nullable: true })
  profileImageUrl: string | null;

  @ApiProperty({ description: '독서 기록 공개 여부' })
  isReadingLogPublic: boolean;

  @ApiProperty({ description: '소셜 로그인 제공자' })
  provider: string;

  @ApiProperty({ description: '소셜 로그인 제공자 ID' })
  providerId: string;

  @ApiProperty({ description: '실명', nullable: true })
  name: string | null;

  @ApiProperty({ description: '성별', nullable: true })
  gender: string | null;

  @ApiProperty({ description: '연령대', nullable: true })
  ageRange: string | null;

  @ApiProperty({ description: '이메일 인증 완료 여부' })
  isEmailVerified: boolean;

  @ApiProperty({ description: '권한', enum: ['USER', 'ADMIN'] })
  role: 'USER' | 'ADMIN';

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.nickname = user.nickname;
    this.handle = user.handle;
    this.profileImageUrl = user.profileImageUrl;
    this.isReadingLogPublic = user.isReadingLogPublic;
    this.provider = user.provider;
    this.providerId = user.providerId;
    this.name = user.name ?? null;
    this.gender = user.gender ?? null;
    this.ageRange = user.ageRange ?? null;
    this.isEmailVerified = user.isEmailVerified ?? false;
    this.role = user.role;
  }
}
