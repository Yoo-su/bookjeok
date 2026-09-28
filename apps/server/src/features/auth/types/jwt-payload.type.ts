export interface JwtPayload {
  sub: number;
  nickname: string;
  role: 'USER' | 'ADMIN';
  /**
   * 발급 시점의 User.tokenVersion. 로그아웃하면 DB 값이 올라가 기존 토큰이 전부 무효가 된다.
   * 새로 발급하는 토큰에는 항상 싣는다. 선택 필드인 것은 도입 전 발급분을 해석하기 위해서다
   */
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}
