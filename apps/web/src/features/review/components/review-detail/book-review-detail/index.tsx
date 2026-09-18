import { CommentTargetType, Review } from "@bookjeok/core";
import { useTranslations } from "next-intl";

import { CommentSection } from "@/features/comment/components/common/comment-section";
import { useReviewWithAuth } from "@/features/review/hooks/use-review-with-auth";
import { AdBanner } from "@/shared/components/ads/ad-banner";
import { Edit } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { RecommendReviews } from "../recommend-reviews";
import { ReviewDetailActions } from "./actions";
import { ReviewDetailContent } from "./content";
import { ReviewDetailHeader } from "./header";
import { PrivateReviewOverlay } from "./private-overlay";
import { ReviewDetailSkeleton } from "./skeleton";

interface ReviewDetailProps {
  id: number;
}

export const ReviewDetail = ({ id }: ReviewDetailProps) => {
  const t = useTranslations("review.detail");
  const { review, isLoading, isAuthor, isPrivateMasked, isAuthenticating } =
    useReviewWithAuth(id);

  // 로딩 중이거나, 본인 비공개 리뷰의 데이터를 가져오는 중이면 스켈레톤 표시
  if (isLoading || isAuthenticating) {
    return <ReviewDetailSkeleton />;
  }

  if (!review) {
    return (
      <NotFoundRedirect message={t("not_found")} fallbackPath={PATHS.REVIEWS} />
    );
  }

  const book = review.book;

  return (
    <article className="min-h-screen bg-white pb-20">
      <ReviewDetailHeader review={review} book={book} />

      <div className="container mx-auto px-4 w-full py-12">
        {isPrivateMasked ? (
          <PrivateReviewOverlay />
        ) : (
          <ReviewDetailContent content={review.content} />
        )}

        {/* 액션 버튼들 (공개 또는 본인일 때만 노출) */}
        {!isPrivateMasked && (
          <ReviewDetailActions
            reviewId={String(id)}
            reactionCounts={review.reactionCounts}
          />
        )}

        {/* 광고 배너 */}
        <AdBanner
          dataAdSlot="3367138518"
          dataAdFormat="horizontal"
          className="w-full my-8"
        />

        {/* 댓글 섹션 */}
        <CommentSection
          targetType={CommentTargetType.REVIEW}
          targetId={String(id)}
        />

        {/* 추천 리뷰 섹션 */}
        <RecommendReviews id={id} category={review.category} />

        {/* 네비게이션 & 편집 버튼 */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-stone-100">
          <Button
            variant="ghost"
            className="text-stone-500 hover:text-stone-900"
            asChild
          >
            <Link href={PATHS.REVIEWS}>{t("back")}</Link>
          </Button>

          {isAuthor && (
            <Button
              variant="outline"
              size="sm"
              className="border-stone-200 hover:bg-stone-50"
              asChild
            >
              <Link href={PATHS.REVIEW_EDIT(String(id))}>
                <Edit className="w-4 h-4 mr-2" />
                {t("edit")}
              </Link>
            </Button>
          )}
        </div>
      </div>
      <ScrollTopButton />
    </article>
  );
};
