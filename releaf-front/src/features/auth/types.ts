export interface User {
  /** 우리 서비스에서 사용하는 고유 ID */
  id: number;

  /** 소셜 로그인 제공자 (e.g., 'kakao', 'naver') */
  provider: string;

  /** 소셜 로그인 제공자가 부여하는 고유 ID */
  providerId: string;

  /** 사용자 이메일 (선택) */
  email: string | null;

  /** 사용자 닉네임 */
  nickname: string;

  /** 프로필 이미지 URL (선택) */
  profileImageUrl: string | null;

  /** 계정 생성일 (ISO 8601 형식의 문자열) */
  createdAt: string;

  /** 계정 수정일 (ISO 8601 형식의 문자열) */
  updatedAt: string;
}
