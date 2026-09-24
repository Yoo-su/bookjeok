import {
  getErrorCode,
  getErrorMessage,
  handleApiError,
} from "@bookjeok/api-client";
import { toast } from "sonner";

export { getErrorCode, getErrorMessage };

/**
 * 서버가 내려주는 에러 코드 중 화면이 분기에 쓰는 것들입니다.
 *
 * 서버는 `BusinessException`을 통해 `{ code, message }` 형태로 응답하고,
 * message는 사용자에게 그대로 보여줄 한국어 문장입니다. 따라서 분기는 반드시
 * message가 아니라 code로 해야 합니다. (문구를 다듬는 순간 분기가 깨집니다)
 *
 * 원본: apps/server/src/shared/exceptions/error-codes.ts
 */
export const API_ERROR_CODES = {
  EMAIL_ALREADY_EXISTS: "AUTH_005",
  SOCIAL_LOGIN_USER: "AUTH_013",
  NICKNAME_ALREADY_EXISTS: "USER_003",
  READING_LOG_DUPLICATE: "READING_LOG_002",
} as const;

/**
 * Mutation 에러를 HTTP 상태 코드별로 분기 처리하는 공통 유틸리티입니다.
 * @bookjeok/api-client의 공통 로직을 사용하며, 웹 플랫폼에 맞게 toast로 출력합니다.
 *
 * @param error 발생한 에러 객체
 * @param context 에러 발생 컨텍스트 설명 (로깅용)
 */
export const handleMutationError = (error: unknown, context?: string) => {
  handleApiError(error, {
    context,
    onShowError: (message) => toast.error(message),
  });
};
