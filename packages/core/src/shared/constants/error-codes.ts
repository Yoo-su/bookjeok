/**
 * 화면이 분기에 쓰는 서버 에러 코드입니다.
 * 서버 `ERROR_CODES`의 해당 항목이 이 값을 참조하므로 번호는 여기서만 바꿉니다.
 */
export const API_ERROR_CODES = {
  EMAIL_ALREADY_EXISTS: "AUTH_005",
  SOCIAL_LOGIN_USER: "AUTH_013",
  NICKNAME_ALREADY_EXISTS: "USER_003",
  READING_LOG_DUPLICATE: "READING_LOG_002",
  FEEDBACK_DAILY_LIMIT_EXCEEDED: "FEEDBACK_003",
} as const;
