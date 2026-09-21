import {
  API_PATHS,
  GetReviewsParams,
  GetReviewsResponse,
  GetTagSuggestionsParams,
  Review,
  ReviewFeed,
  ReviewFormValues,
  ReviewReactionType,
  TagSuggestion,
} from "@bookjeok/core";

import { privateApiClient, publicApiClient } from "../../client";

/**
 * 리뷰를 생성합니다.
 */
export const createReview = async (
  formValues: ReviewFormValues,
  options?: { idempotencyKey?: string },
) => {
  const config = options?.idempotencyKey
    ? { headers: { "x-idempotency-key": options.idempotencyKey } }
    : undefined;
  const { data } = await privateApiClient.post<Review>(
    API_PATHS.review.base,
    formValues,
    config,
  );
  return data;
};

/**
 * 리뷰를 수정합니다.
 */
export const updateReview = async (
  id: number,
  formValues: ReviewFormValues,
) => {
  const { data } = await privateApiClient.patch<Review>(
    API_PATHS.review.detail(id),
    formValues,
  );
  return data;
};

/**
 * 리뷰를 삭제합니다.
 */
export const deleteReview = async (id: number) => {
  const { data } = await privateApiClient.delete<Review>(
    API_PATHS.review.detail(id),
  );
  return data;
};

/**
 * 리뷰 목록을 조회합니다.
 */
export const getReviews = async ({
  page = 1,
  limit = 10,
  isbn,
  tag,
  search,
  category,
  userId,
  excludeId,
  cursorId,
}: GetReviewsParams) => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (isbn) params.append("isbn", isbn);
  if (tag) params.append("tag", tag);
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (userId) params.append("userId", userId.toString());
  if (excludeId) params.append("excludeId", excludeId.toString());
  if (cursorId) params.append("cursorId", cursorId.toString());

  const { data } = await publicApiClient.get<GetReviewsResponse>(
    `${API_PATHS.review.base}?${params.toString()}`,
  );
  return data;
};

/**
 * 태그 자동완성 후보를 조회합니다.
 */
export const getTagSuggestions = async ({
  q,
  limit,
}: GetTagSuggestionsParams = {}) => {
  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (limit) params.append("limit", limit.toString());

  const query = params.toString();
  const { data } = await publicApiClient.get<TagSuggestion[]>(
    query ? `${API_PATHS.review.tags}?${query}` : API_PATHS.review.tags,
  );
  return data;
};

/**
 * 리뷰 피드(카테고리별 최신 리뷰)를 조회합니다.
 */
export const getReviewFeeds = async () => {
  const { data } = await publicApiClient.get<ReviewFeed[]>(
    API_PATHS.review.feeds,
  );
  return data;
};

/**
 * 인기 리뷰를 조회합니다.
 */
export const getPopularReviews = async () => {
  const { data } = await publicApiClient.get<Review[]>(
    API_PATHS.review.popular,
  );
  return data;
};

/**
 * 리뷰 상세 정보를 조회합니다.
 */
export const getReview = async (id: number) => {
  const { data } = await publicApiClient.get<Review>(
    API_PATHS.review.detail(id),
  );
  return data;
};

/**
 * 인증된 상태로 리뷰 상세 정보를 조회합니다.
 * 비공개 리뷰의 경우 작성자 본인만 원본 내용을 조회할 수 있습니다.
 */
export const getReviewAuthenticated = async (id: number) => {
  const { data } = await privateApiClient.get<Review>(
    API_PATHS.review.detail(id),
  );
  return data;
};

/**
 * 수정을 위한 리뷰 조회 (본인 리뷰만 조회 가능)
 */
export const getReviewForEdit = async (id: number) => {
  const { data } = await privateApiClient.get<Review>(
    API_PATHS.review.edit(id),
  );
  return data;
};

/**
 * 추천 리뷰(복합 로직)를 조회합니다.
 */
export const getRecommendedReviews = async (id: number) => {
  const { data } = await publicApiClient.get<Review[]>(
    API_PATHS.review.recommend(id),
  );
  return data;
};

/**
 * 나의 리액션 정보를 조회합니다.
 */
export const getMyReviewReaction = async (id: number) => {
  const { data } = await privateApiClient.get<ReviewReactionType | null>(
    API_PATHS.review.myReaction(id),
  );
  return data;
};

/**
 * 리뷰 리액션을 토글합니다.
 */
export const toggleReviewReaction = async (
  id: number,
  type: ReviewReactionType,
) => {
  const { data } = await privateApiClient.post<Review>(
    API_PATHS.review.toggleReaction(id),
    { type },
  );
  return data;
};
/**
 * 리뷰 상세페이지 조회수를 기록합니다.
 */
export const recordReviewView = async (id: number): Promise<void> => {
  await publicApiClient.post(API_PATHS.review.recordView(id));
};
