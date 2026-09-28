"use client";

import { getReviewAuthenticated } from "@bookjeok/api-client";
import { reviewKeys } from "@bookjeok/core";
import { useReviewDetailQuery } from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

/**
 * 리뷰 상세 데이터를 인증 분기와 함께 제공하는 커스텀 훅입니다.
 *
 * - 비공개 리뷰이며 본인이 작성한 경우, 인증된 요청으로 원본을 가져옵니다.
 * - 컴포넌트에서 인증 로직을 신경 쓰지 않고 데이터만 소비할 수 있게 합니다.
 *
 * 초기 데이터는 ServerQueryBoundary의 하이드레이션으로 들어온다.
 *
 * @param id 리뷰 ID
 */
export const useReviewWithAuth = (id: number) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isFetchingAuth, setIsFetchingAuth] = useState(false);

  const { data: review, isLoading } = useReviewDetailQuery(id);

  // 비공개 상태 판별 (review가 있을 때만)
  const isPrivateMasked = review ? !review.isPublic && !review.content : false;
  const isAuthor = review ? user?.id === review.userId : false;

  // 본인의 비공개 리뷰인데 마스킹 상태라면, 인증된 요청으로 원본 데이터를 가져옴
  useEffect(() => {
    if (isPrivateMasked && isAuthor && !isFetchingAuth) {
      setIsFetchingAuth(true);
      getReviewAuthenticated(id)
        .then((fullReview) => {
          queryClient.setQueryData(reviewKeys.detail(id).queryKey, fullReview);
        })
        .catch((error) => {
          console.error("Failed to fetch authenticated review:", error);
        })
        .finally(() => {
          setIsFetchingAuth(false);
        });
    }
  }, [id, isPrivateMasked, isAuthor, isFetchingAuth, queryClient]);

  return {
    review,
    isLoading,
    isAuthor,
    isPrivateMasked,
    /** 본인 비공개 리뷰의 인증된 데이터를 불러오는 중인지 여부 */
    isAuthenticating: isPrivateMasked && isAuthor,
  };
};
