import { describe, expect, it } from "vitest";

import { NICKNAME_MAX_LENGTH } from "../constants";
import { normalizeNickname, validateNickname } from "../utils";

// 보이지 않는 문자는 소스에 그대로 쓰면 읽을 수 없어 코드 포인트로 만든다
const HANGUL_FILLER = String.fromCharCode(0x3164);
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
const NO_BREAK_SPACE = String.fromCharCode(0xa0);
const DECOMPOSED_GANA = String.fromCharCode(0x1100, 0x1161, 0x1102, 0x1161);

describe("normalizeNickname", () => {
  it("앞뒤 공백을 걷어낸다", () => {
    expect(normalizeNickname("  독자 ")).toBe("독자");
  });

  it("자모 분리 입력을 NFC로 합친다", () => {
    expect(DECOMPOSED_GANA).not.toBe("가나");
    expect(normalizeNickname(DECOMPOSED_GANA)).toBe("가나");
  });
});

describe("validateNickname", () => {
  it.each(["독자", "행복한 판다", "book_lover", "Reader01", "가".repeat(20)])(
    "%s는 받는다",
    (nickname) => {
      expect(validateNickname(nickname)).toBeNull();
    },
  );

  it("너무 짧거나 길면 거부한다", () => {
    expect(validateNickname("")).toBe("too_short");
    expect(validateNickname("가")).toBe("too_short");
    expect(validateNickname("가".repeat(NICKNAME_MAX_LENGTH + 1))).toBe(
      "too_long",
    );
  });

  // 보이지 않는 문자로 만든 빈 닉네임
  it.each([
    HANGUL_FILLER.repeat(2),
    ZERO_WIDTH_SPACE.repeat(2),
    `가${ZERO_WIDTH_SPACE}나`,
    NO_BREAK_SPACE.repeat(2),
  ])("보이지 않는 문자 %j는 거부한다", (nickname) => {
    expect(validateNickname(nickname)).toBe("invalid_chars");
  });

  it.each(["행복한  판다", "ㅋㅋ", "독자😀", "<b>독자</b>", "독자\n"])(
    "%j는 거부한다",
    (nickname) => {
      expect(validateNickname(nickname)).toBe("invalid_chars");
    },
  );
});
