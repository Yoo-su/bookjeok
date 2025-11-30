import {
  GetReviewsParams,
  GetReviewsResponse,
  Review,
  ReviewFeed,
  ReviewFormValues,
} from "@/features/review/types";
import { privateAxios, publicAxios } from "@/shared/libs/axios";

const API_PATHS = {
  review: {
    base: "/reviews",
    detail: (id: number) => `/reviews/${id}`,
  },
};

export const createReview = async (data: ReviewFormValues) => {
  const { data: response } = await privateAxios.post<Review>(
    API_PATHS.review.base,
    data
  );
  return response;
};

export const updateReview = async (id: number, data: ReviewFormValues) => {
  const { data: response } = await privateAxios.patch<Review>(
    API_PATHS.review.detail(id),
    data
  );
  return response;
};

export const deleteReview = async (id: number) => {
  const { data: response } = await privateAxios.delete<Review>(
    API_PATHS.review.detail(id)
  );
  return response;
};

export const getReviews = async ({
  page = 1,
  limit = 10,
  bookIsbn,
  tag,
  search,
  category,
  userId,
}: GetReviewsParams) => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (bookIsbn) params.append("bookIsbn", bookIsbn);
  if (tag) params.append("tag", tag);
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (userId) params.append("userId", userId.toString());

  const response = await publicAxios.get<GetReviewsResponse>(
    `${API_PATHS.review.base}?${params.toString()}`
  );
  return response.data;
};

export const getReviewFeeds = async () => {
  const { data } = await publicAxios.get<ReviewFeed[]>(
    `${API_PATHS.review.base}/feeds`
  );
  return data;
};

export const getReview = async (id: number) => {
  const { data } = await publicAxios.get<Review>(API_PATHS.review.detail(id));
  return data;
};
