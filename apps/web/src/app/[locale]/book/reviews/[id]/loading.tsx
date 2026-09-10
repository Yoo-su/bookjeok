import { ReviewDetailSkeleton } from "@/features/review/components/review-detail/book-review-detail/skeleton";

/**
 * 리뷰 상세 내비게이션 로딩 UI
 *
 * `ReviewDetail`이 쓰는 스켈레톤을 그대로 재사용한다. 헤더·본문·액션을 모두 포함한다.
 */
export default function Loading() {
  return <ReviewDetailSkeleton />;
}
