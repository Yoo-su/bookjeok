import {
  API_PATHS,
  Comment,
  CreateCommentParams,
  GetCommentsParams,
  GetCommentsResponse,
  GetMyCommentsResponse,
  UpdateCommentParams,
} from "@bookjeok/core";

import { privateApiClient } from "../../client";

/**
 * 댓글 목록을 조회합니다.
 */
export const getComments = async (
  params: GetCommentsParams,
): Promise<GetCommentsResponse> => {
  const { data } = await privateApiClient.get<GetCommentsResponse>(
    API_PATHS.comment.base,
    { params },
  );
  return data;
};

/**
 * 댓글을 생성합니다.
 */
export const createComment = async (
  params: CreateCommentParams,
  options?: { idempotencyKey?: string },
): Promise<Comment> => {
  const config = options?.idempotencyKey
    ? { headers: { "x-idempotency-key": options.idempotencyKey } }
    : undefined;
  const { data } = await privateApiClient.post<Comment>(
    API_PATHS.comment.base,
    params,
    config,
  );
  return data;
};

/**
 * 댓글을 수정합니다.
 */
export const updateComment = async (
  id: number,
  params: UpdateCommentParams,
): Promise<Comment> => {
  const { data } = await privateApiClient.patch<Comment>(
    API_PATHS.comment.detail(id),
    params,
  );
  return data;
};

/**
 * 댓글을 삭제합니다.
 */
export const deleteComment = async (id: number): Promise<void> => {
  await privateApiClient.delete(API_PATHS.comment.detail(id));
};

/**
 * 댓글 좋아요를 토글합니다.
 */
export const toggleCommentLike = async (
  id: number,
): Promise<Comment & { isLiked: boolean }> => {
  const { data } = await privateApiClient.post<Comment & { isLiked: boolean }>(
    API_PATHS.comment.like(id),
  );
  return data;
};

/**
 * 내 좋아요 상태를 조회합니다.
 */
export const getMyLikeStatus = async (id: number): Promise<boolean> => {
  const { data } = await privateApiClient.get<{ isLiked: boolean }>(
    API_PATHS.comment.like(id),
  );
  return data.isLiked;
};

/**
 * 내 댓글 목록을 조회합니다.
 */
export const getMyComments = async (
  page: number = 1,
  limit: number = 10,
  cursorId?: number,
): Promise<GetMyCommentsResponse> => {
  const { data } = await privateApiClient.get<GetMyCommentsResponse>(
    API_PATHS.comment.my,
    { params: { page, limit, cursorId } },
  );
  return data;
};
