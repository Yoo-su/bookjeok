import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  NICKNAME_PATTERN,
} from "./constants";

export type NicknameError = "too_short" | "too_long" | "invalid_chars";

/** 자모 분리 입력(macOS 등)을 NFC로 합치고 앞뒤 공백을 걷어낸다 */
export const normalizeNickname = (nickname: string): string =>
  nickname.normalize("NFC").trim();

/** 정규화된 닉네임을 검사한다. 통과하면 null */
export const validateNickname = (nickname: string): NicknameError | null => {
  if (nickname.length < NICKNAME_MIN_LENGTH) return "too_short";
  if (nickname.length > NICKNAME_MAX_LENGTH) return "too_long";
  if (!NICKNAME_PATTERN.test(nickname)) return "invalid_chars";
  return null;
};
