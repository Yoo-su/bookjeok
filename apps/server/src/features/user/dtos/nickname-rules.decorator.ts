import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  NICKNAME_PATTERN,
  normalizeNickname,
} from '@bookjeok/core';
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

/**
 * 닉네임 정규화(NFC·앞뒤 공백 제거)와 길이·문자 규칙입니다.
 * 회원가입과 프로필 수정이 같은 규칙을 씁니다.
 */
export const NicknameRules = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? normalizeNickname(value) : value,
    ),
    IsString({ message: '닉네임을 입력해주세요.' }),
    Length(NICKNAME_MIN_LENGTH, NICKNAME_MAX_LENGTH, {
      message: `닉네임은 ${NICKNAME_MIN_LENGTH}자 이상 ${NICKNAME_MAX_LENGTH}자 이하로 입력해주세요.`,
    }),
    Matches(NICKNAME_PATTERN, {
      message:
        '닉네임은 한글, 영문, 숫자, 밑줄(_)과 단어 사이 공백 한 칸만 사용할 수 있습니다.',
    }),
  );
