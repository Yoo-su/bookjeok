"use client";

import { ReviewFormValues } from "@bookjeok/core";
import {
  useCreateReviewMutation as useSharedCreateReviewMutation,
  useDeleteReviewMutation as useSharedDeleteReviewMutation,
  useToggleReviewReactionMutation as useSharedToggleReviewReactionMutation,
  useUpdateReviewMutation as useSharedUpdateReviewMutation,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { deleteImages } from "@/features/book-sale/actions/delete-action";
import { revalidateReview } from "@/shared/actions/revalidate";
import { useRouter } from "@/shared/config/i18n/routing";
import { handleMutationError } from "@/shared/utils/error-handler";
import { purgeRouteCache } from "@/shared/utils/purge-route-cache";

/**
 * 리뷰 리액션을 토글하는 뮤테이션 훅입니다.
 */
export const useToggleReviewReactionMutation = (reviewId: number) => {
  const t = useTranslations("review.toast");

  // 실패하면 공유 훅이 낙관적 반영을 되돌린다. 알리지 않으면 버튼만 조용히 원복된다.
  return useSharedToggleReviewReactionMutation(reviewId, {
    onError: () => {
      toast.error(t("reaction_error"));
    },
  });
};

/**
 * 리뷰를 생성하는 뮤테이션 훅입니다.
 */
export const useCreateReviewMutation = () => {
  const t = useTranslations("review.toast");

  return useSharedCreateReviewMutation({
    // 재검증 대상이 없다. 상세는 아직 ISR에 없고, 목록·홈은 시간 기반에 위임한다.
    // 작성자 본인은 쿼리 무효화 + refetchOnMount로 목록에서 바로 확인한다.
    onSuccess: () => {
      toast.success(t("create_success"));
    },
  });
};

/**
 * 리뷰를 수정하는 뮤테이션 훅입니다.
 */
export const useUpdateReviewMutation = () => {
  const t = useTranslations("review.toast");
  const router = useRouter();

  const sharedMutation = useSharedUpdateReviewMutation({
    onSuccess: (data) => {
      toast.success(t("update_success"));
      void purgeRouteCache(revalidateReview({ reviewId: data.id }), () =>
        router.refresh(),
      );
    },
  });

  return {
    ...sharedMutation,
    mutate: async ({
      id,
      data,
      deletedImageUrls,
    }: {
      id: number;
      data: ReviewFormValues;
      deletedImageUrls?: string[];
    }) => {
      if (deletedImageUrls && deletedImageUrls.length > 0) {
        await deleteImages(deletedImageUrls);
      }
      return sharedMutation.mutate({ id, data });
    },
    mutateAsync: async ({
      id,
      data,
      deletedImageUrls,
    }: {
      id: number;
      data: ReviewFormValues;
      deletedImageUrls?: string[];
    }) => {
      if (deletedImageUrls && deletedImageUrls.length > 0) {
        await deleteImages(deletedImageUrls);
      }
      return sharedMutation.mutateAsync({ id, data });
    },
  };
};

/**
 * 리뷰를 삭제하는 뮤테이션 훅입니다.
 */
export const useDeleteReviewMutation = () => {
  const t = useTranslations("review.toast");
  const router = useRouter();

  return useSharedDeleteReviewMutation({
    onSuccess: (id: number) => {
      toast.success(t("delete_success"));
      // 상세가 ISR에 200으로 남으면 다른 방문자·크롤러에게 계속 노출되고,
      // 목록·홈에 남은 링크는 404로 이어진다.
      void purgeRouteCache(
        revalidateReview({ reviewId: id, deleted: true }),
        () => router.refresh(),
      );
    },
  });
};
