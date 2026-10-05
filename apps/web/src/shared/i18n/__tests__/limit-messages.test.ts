import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
  SALE_CONTENT_MAX_LENGTH,
  SALE_CONTENT_MIN_LENGTH,
  SALE_IMAGE_MAX_COUNT,
  SALE_TITLE_MAX_LENGTH,
  SALE_TITLE_MIN_LENGTH,
  TRADE_REVIEW_CONTENT_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
} from "@bookjeok/core";
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import en from "@/shared/i18n/messages/en.json";
import ko from "@/shared/i18n/messages/ko.json";

// 숫자를 상수에서 넣도록 바꾸기 전 문구와 같아야 한다(가입 닉네임 최대 길이만 20자로 정책 변경)
const cases: [string, Record<string, number>, string, string][] = [
  [
    "auth.validation.password_min",
    { min: PASSWORD_MIN_LENGTH },
    "비밀번호는 최소 8자 이상이어야 합니다.",
    "Password must be at least 8 characters.",
  ],
  [
    "auth.validation.nickname_min",
    { min: NICKNAME_MIN_LENGTH },
    "닉네임은 최소 2자 이상이어야 합니다.",
    "Nickname must be at least 2 characters.",
  ],
  [
    "auth.validation.nickname_max",
    { max: NICKNAME_MAX_LENGTH },
    "닉네임은 최대 20자까지 가능합니다.",
    "Nickname can be up to 20 characters.",
  ],
  [
    "auth.validation.name_max",
    { max: USER_NAME_MAX_LENGTH },
    "이름은 50자 이하로 입력해주세요.",
    "Name cannot exceed 50 characters.",
  ],
  [
    "my_page.edit_modal.nickname_placeholder",
    { min: NICKNAME_MIN_LENGTH, max: NICKNAME_MAX_LENGTH },
    "닉네임을 입력하세요 (2-20자)",
    "Enter nickname (2-20 chars)",
  ],
  [
    "my_page.edit_modal.nickname_help",
    { min: NICKNAME_MIN_LENGTH, max: NICKNAME_MAX_LENGTH },
    "한글, 영문, 숫자, 밑줄(_) 2-20자",
    "2-20 characters, Korean/English/numbers/underscore",
  ],
  [
    "my_page.edit_modal.nickname_min",
    { min: NICKNAME_MIN_LENGTH, max: NICKNAME_MAX_LENGTH },
    "닉네임은 2자 이상이어야 합니다.",
    "Nickname must be at least 2 characters.",
  ],
  [
    "my_page.edit_modal.nickname_max",
    { min: NICKNAME_MIN_LENGTH, max: NICKNAME_MAX_LENGTH },
    "닉네임은 20자 이하여야 합니다.",
    "Nickname must be 20 characters or less.",
  ],
  [
    "market.validation.title_min",
    { min: SALE_TITLE_MIN_LENGTH },
    "제목은 5자 이상 입력해주세요.",
    "Title must be at least 5 characters.",
  ],
  [
    "market.validation.title_max",
    { max: SALE_TITLE_MAX_LENGTH },
    "제목은 50자를 초과할 수 없습니다.",
    "Title cannot exceed 50 characters.",
  ],
  [
    "market.validation.content_min",
    { min: SALE_CONTENT_MIN_LENGTH },
    "상세 내용은 10자 이상 입력해주세요.",
    "Description must be at least 10 characters.",
  ],
  [
    "market.validation.content_max",
    { max: SALE_CONTENT_MAX_LENGTH },
    "상세 내용은 1,000자를 초과할 수 없습니다.",
    "Description cannot exceed 1,000 characters.",
  ],
  [
    "market.validation.images_max",
    { max: SALE_IMAGE_MAX_COUNT },
    "이미지는 최대 5개까지 등록할 수 있습니다.",
    "You can upload up to 5 images.",
  ],
  [
    "market.validation.images_edit_max",
    { max: SALE_IMAGE_MAX_COUNT },
    "새로 추가하는 이미지는 최대 5개까지 등록할 수 있습니다.",
    "You can add up to 5 new images.",
  ],
  [
    "order.trade_review.errors.content_max",
    { max: TRADE_REVIEW_CONTENT_MAX_LENGTH },
    "후기는 500자 이하로 작성해주세요.",
    "Review must be 500 characters or fewer.",
  ],
];

describe("입력 제한 문구", () => {
  it.each([
    ["ko", ko, 2],
    ["en", en, 3],
  ] as const)(
    "%s 문구가 상수 값으로 기존과 같게 나온다",
    (locale, messages, column) => {
      const t = createTranslator({
        locale,
        messages,
        onError: (error) => {
          throw error;
        },
      }) as unknown as (key: string, values: Record<string, number>) => string;
      for (const row of cases) {
        expect(t(row[0], row[1])).toBe(row[column]);
      }
    },
  );
});
