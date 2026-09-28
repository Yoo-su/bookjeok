import { instanceToPlain } from 'class-transformer';

/**
 * 소켓으로 보낼 값을 HTTP 응답과 같은 규칙으로 직렬화합니다.
 *
 * 전역 `ClassSerializerInterceptor`는 HTTP 응답에만 걸립니다. 엔티티를 그대로
 * emit하면 `@Exclude`가 무시되어 비밀번호 해시·이메일 같은 필드가 상대에게
 * 전달되므로, 게이트웨이에서 내보내기 전에 반드시 이 함수를 거칩니다.
 */
export function toSocketPayload<T>(value: T): Record<string, unknown> {
  return instanceToPlain(value);
}
