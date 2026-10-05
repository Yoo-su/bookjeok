export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;
/**
 * 한글 완성형·영문·숫자·밑줄, 단어 사이 공백은 한 칸.
 * 허용 목록이어야 한글 채움 문자(U+3164)·폭 없는 공백처럼 보이지 않는 문자로 만든 빈 닉네임을 막는다.
 * 자동 생성 닉네임("행복한 판다")이 공백을 쓰므로 공백은 허용한다.
 */
export const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]+(?: [가-힣a-zA-Z0-9_]+)*$/;

export const USER_NAME_MAX_LENGTH = 50;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 20;
/** 영문·숫자·특수문자(!@#$%^&*+=-)를 각각 하나 이상 포함 */
export const PASSWORD_PATTERN = new RegExp(
  `^(?=.*[a-zA-Z])(?=.*[!@#$%^&*+=-])(?=.*[0-9]).{${PASSWORD_MIN_LENGTH},${PASSWORD_MAX_LENGTH}}$`,
);

/** 'U'는 미선택. 프로필 수정 화면은 미선택을 null로 보낸다 */
export const USER_GENDERS = ["M", "F", "U"] as const;
export const USER_AGE_RANGES = [
  "0-9",
  "10-19",
  "20-29",
  "30-39",
  "40-49",
  "50-59",
  "60-",
] as const;

/** 기본 프로필 이미지 식별자 (default_profile1 ~ default_profile10) */
export const DEFAULT_PROFILE_IMAGE_PATTERN = /^default_profile([1-9]|10)$/;
/** 직접 올린 프로필 이미지가 저장되는 Vercel Blob 주소 */
export const UPLOADED_PROFILE_IMAGE_PATTERN =
  /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/\S+$/;
