import { JwtPayload } from '../types/jwt-payload.type';

/**
 * 토큰이 발급 뒤 로그아웃으로 무효화됐는지 확인합니다.
 * 액세스·리프레시·소켓 인증이 같은 규칙을 쓰도록 한 곳에 둡니다.
 *
 * tokenVersion이 없는 토큰은 통과시킵니다. 그런 토큰은 액세스 토큰에 버전을 싣기 전
 * 발급분뿐이고(리프레시 토큰은 2026-08-20부터 실었고 수명 7일이라 모두 만료), 배포 순간
 * 접속해 있던 사용자의 소켓 재연결·업로드가 한꺼번에 거부되지 않게 하려는 것입니다.
 * 액세스 토큰 수명이 15분이라 배포 15분 뒤에는 이 분기에 닿는 토큰이 없습니다.
 */
export const isTokenRevoked = (
  payload: Pick<JwtPayload, 'tokenVersion'>,
  user: { tokenVersion: number },
): boolean =>
  payload.tokenVersion !== undefined &&
  payload.tokenVersion !== user.tokenVersion;
