/** 공개 프로필에 노출할 최근 독서기록 개수 상한 */
export const PUBLIC_PROFILE_READING_LOG_LIMIT = 50;

/** 공개 프로필에 노출할 최근 리뷰·판매글 개수 */
export const PUBLIC_PROFILE_RECENT_ITEM_COUNT = 3;

/**
 * 본인에게만 내보내는 사용자 필드의 직렬화 그룹.
 * 로그인·회원가입처럼 응답의 `User`가 요청자 본인일 때 `@SerializeOptions`로 켭니다.
 */
export const USER_SELF_GROUP = 'user:self';
