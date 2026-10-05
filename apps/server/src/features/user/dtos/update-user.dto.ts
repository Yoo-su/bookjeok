import {
  DEFAULT_PROFILE_IMAGE_PATTERN,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  UPLOADED_PROFILE_IMAGE_PATTERN,
  USER_AGE_RANGES,
  USER_GENDERS,
  USER_NAME_MAX_LENGTH,
} from '@bookjeok/core';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { NicknameRules } from './nickname-rules.decorator';

/** 공백뿐인 실명은 미입력(null)으로 본다 */
const toName = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

const PROFILE_IMAGE_PATTERN = new RegExp(
  `${DEFAULT_PROFILE_IMAGE_PATTERN.source}|${UPLOADED_PROFILE_IMAGE_PATTERN.source}`,
);

/**
 * 생략한 필드는 바꾸지 않는다. null을 허용하는 필드(실명·성별·연령대·프로필 이미지)는
 * null로 비울 수 있고, 닉네임은 비울 수 없다.
 */
export class UpdateUserDto {
  @ApiProperty({
    description: `닉네임 (${NICKNAME_MIN_LENGTH}~${NICKNAME_MAX_LENGTH}자, 한글·영문·숫자·_, 단어 사이 공백 한 칸)`,
    required: false,
  })
  @ValidateIf((_, value) => value !== undefined)
  @NicknameRules()
  nickname?: string;

  @ApiProperty({
    description: '프로필 이미지 (기본 이미지 식별자 또는 업로드한 이미지 URL)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(PROFILE_IMAGE_PATTERN, {
    message: '사용할 수 없는 프로필 이미지입니다.',
  })
  profileImageUrl?: string | null;

  @ApiProperty({ description: '실명', required: false, nullable: true })
  @Transform(toName)
  @IsOptional()
  @IsString()
  @MaxLength(USER_NAME_MAX_LENGTH, {
    message: `이름은 ${USER_NAME_MAX_LENGTH}자 이하로 입력해주세요.`,
  })
  name?: string | null;

  @ApiProperty({
    description: '성별',
    required: false,
    nullable: true,
    enum: USER_GENDERS,
  })
  @IsOptional()
  @IsIn(USER_GENDERS, { message: '올바른 성별 값이 아닙니다.' })
  gender?: string | null;

  @ApiProperty({
    description: '연령대',
    required: false,
    nullable: true,
    enum: USER_AGE_RANGES,
  })
  @IsOptional()
  @IsIn(USER_AGE_RANGES, { message: '올바른 연령대 값이 아닙니다.' })
  ageRange?: string | null;

  @ApiProperty({
    description: '이메일 주소 (로컬 가입자는 비울 수 없음)',
    required: false,
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsOptional()
  email?: string;
}
