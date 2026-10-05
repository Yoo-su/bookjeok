import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  USER_NAME_MAX_LENGTH,
} from '@bookjeok/core';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

import { NicknameRules } from '@/features/user/dtos/nickname-rules.decorator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '이메일 주소',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: `비밀번호 (${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자)`,
  })
  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하로 입력해주세요.`,
  })
  @Matches(PASSWORD_PATTERN, {
    message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.',
  })
  password!: string;

  @ApiProperty({
    example: 'booklover',
    description: `닉네임 (${NICKNAME_MIN_LENGTH}~${NICKNAME_MAX_LENGTH}자, 한글·영문·숫자·_, 단어 사이 공백 한 칸)`,
  })
  @NicknameRules()
  nickname!: string;

  @ApiProperty({
    example: '홍길동',
    description: '회원 실명',
  })
  @IsString()
  @Length(1, USER_NAME_MAX_LENGTH, { message: '이름을 올바르게 입력해주세요.' })
  name!: string;

  @ApiProperty({
    example: 'M',
    description: '성별 (M, F, U 또는 미입력)',
    required: false,
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    example: '20-29',
    description:
      '연령대 (0-9, 10-19, 20-29, 30-39, 40-49, 50-59, 60- 또는 미입력)',
    required: false,
  })
  @IsString()
  @IsOptional()
  ageRange?: string;
}
