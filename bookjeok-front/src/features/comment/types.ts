/**
 * 댓글 타겟 타입
 */
export enum CommentTargetType {
  BOOK = "BOOK",
  REVIEW = "REVIEW",
}

/**
 * 댓글 작성자 정보
 */
export interface CommentUser {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
}

/**
 * 댓글 타입
 */
export interface Comment {
  id: number;
  content: string;
  targetType: CommentTargetType;
  targetId: string;
  userId: number;
  user: CommentUser;
  likeCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 댓글 목록 응답 메타 정보
 */
export interface CommentsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 댓글 목록 응답
 */
export interface GetCommentsResponse {
  data: Comment[];
  meta: CommentsMeta;
}

/**
 * 댓글 생성 파라미터
 */
export interface CreateCommentParams {
  content: string;
  targetType: CommentTargetType;
  targetId: string;
}

/**
 * 댓글 수정 파라미터
 */
export interface UpdateCommentParams {
  content: string;
}

/**
 * 댓글 목록 조회 파라미터
 */
export interface GetCommentsParams {
  targetType: CommentTargetType;
  targetId: string;
  page?: number;
  limit?: number;
}

/**
 * 내 댓글 (간소화 버전)
 */
export interface MyComment {
  id: number;
  content: string;
  targetType: CommentTargetType;
  targetId: string;
  /** 대상 제목 (리뷰 제목 또는 도서 제목) */
  targetTitle: string | null;
  /** 대상 부제목 (리뷰인 경우 도서 제목) */
  targetSubtitle: string | null;
  likeCount: number;
  createdAt: string;
}

/**
 * 내 댓글 목록 응답
 */
export interface GetMyCommentsResponse {
  data: MyComment[];
  meta: CommentsMeta;
}
