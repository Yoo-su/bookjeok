import { API_PATHS } from "@/shared/constants/apis";
import { privateAxios } from "@/shared/libs/axios";

import {
  Comment,
  CreateCommentParams,
  GetCommentsParams,
  GetCommentsResponse,
  GetMyCommentsResponse,
  UpdateCommentParams,
} from "./types";

/**
 * 댓글 목록을 조회합니다.
 * 로그인 시 좋아요 상태(isLiked)도 함께 반환됩니다.
 * @param params 조회 파라미터 (타겟 타입, 타겟 ID, 페이지, 개수)
 * @returns 댓글 목록 및 메타 정보
 */
export const getComments = async (
  params: GetCommentsParams
): Promise<GetCommentsResponse> => {
  const { data } = await privateAxios.get<GetCommentsResponse>(
    API_PATHS.comment.base,
    { params }
  );
  return data;
};

/**
 * 댓글을 생성합니다.
 * @param params 생성 파라미터
 * @returns 생성된 댓글
 */
export const createComment = async (
  params: CreateCommentParams
): Promise<Comment> => {
  const { data } = await privateAxios.post<Comment>(
    API_PATHS.comment.base,
    params
  );
  return data;
};

/**
 * 댓글을 수정합니다.
 * @param id 댓글 ID
 * @param params 수정 파라미터
 * @returns 수정된 댓글
 */
export const updateComment = async (
  id: number,
  params: UpdateCommentParams
): Promise<Comment> => {
  const { data } = await privateAxios.patch<Comment>(
    API_PATHS.comment.detail(id),
    params
  );
  return data;
};

/**
 * 댓글을 삭제합니다.
 * @param id 댓글 ID
 */
export const deleteComment = async (id: number): Promise<void> => {
  await privateAxios.delete(API_PATHS.comment.detail(id));
};

/**
 * 댓글 좋아요를 토글합니다.
 * @param id 댓글 ID
 * @returns 업데이트된 댓글 (isLiked 포함)
 */
export const toggleCommentLike = async (
  id: number
): Promise<Comment & { isLiked: boolean }> => {
  const { data } = await privateAxios.post<Comment & { isLiked: boolean }>(
    API_PATHS.comment.like(id)
  );
  return data;
};

/**
 * 내 좋아요 상태를 조회합니다.
 * @param id 댓글 ID
 * @returns 좋아요 여부
 */
export const getMyLikeStatus = async (id: number): Promise<boolean> => {
  const { data } = await privateAxios.get<{ isLiked: boolean }>(
    API_PATHS.comment.like(id)
  );
  return data.isLiked;
};

/**
 * 내 댓글 목록을 조회합니다.
 * @param page 페이지 번호
 * @param limit 페이지당 항목 수
 * @returns 내 댓글 목록 및 메타 정보
 */
export const getMyComments = async (
  page: number = 1,
  limit: number = 10
): Promise<GetMyCommentsResponse> => {
  const { data } = await privateAxios.get<GetMyCommentsResponse>(
    API_PATHS.comment.my,
    { params: { page, limit } }
  );
  return data;
};
