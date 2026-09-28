/** 프로필 이미지로 첨부할 수 있는 원본 최대 용량 (20MB). 압축에 실패하면 원본이 그대로 올라간다 */
export const MAX_PROFILE_IMAGE_SIZE = 20 * 1024 * 1024;

/**
 * 업로드 토큰에 거는 서버 상한. 클라이언트가 허용하는 가장 큰 원본(프로필)과 같다.
 * 클라이언트 검증은 우회할 수 있으므로 서버에서도 막는다.
 */
export const MAX_BLOB_UPLOAD_SIZE = MAX_PROFILE_IMAGE_SIZE;
