/**
 * 프로필 이미지 URL 유틸리티
 * 기본 프로필 이미지 식별자(default_profile1~5)를 실제 경로로 변환합니다.
 */

/**
 * 기본 프로필 이미지 식별자인지 확인합니다.
 * @param url 프로필 이미지 URL 또는 식별자
 * @returns 기본 프로필 식별자 여부
 */
export function isDefaultProfileImage(url: string | null | undefined): boolean {
  if (!url) return false;
  // default_profile1 ~ default_profile10
  return /^default_profile([1-9]|10)$/.test(url);
}

/**
 * 프로필 이미지 URL을 실제 표시 가능한 경로로 변환합니다.
 * - 기본 프로필 식별자(default_profile1~5): /images/avatars/default_profile1.svg 형태로 변환
 * - 일반 URL: 그대로 반환
 * - null/undefined: undefined 반환 (AvatarFallback 사용)
 *
 * @param url 프로필 이미지 URL 또는 식별자
 * @returns 실제 표시 가능한 이미지 경로
 */
export function getProfileImageUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;

  // 기본 프로필 이미지 식별자인 경우 정적 경로로 변환
  if (isDefaultProfileImage(url)) {
    return `/images/avatars/${url}.svg`;
  }

  // 일반 URL인 경우 그대로 반환
  return url;
}

/**
 * 랜덤 기본 프로필 이미지 경로를 반환합니다.
 * @returns 기본 프로필 이미지 경로 (1-10 중 랜덤)
 */
export function getRandomDefaultProfileImage(): string {
  const randomNum = Math.floor(Math.random() * 10) + 1;
  return `/images/avatars/default_profile${randomNum}.svg`;
}
