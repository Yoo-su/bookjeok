import { BookSaleDetailSkeleton } from "@/features/book-sale/components/sale-detail/book-sale-detail/skeleton";

/**
 * 판매 상세 내비게이션 로딩 UI
 *
 * `BookSaleDetail`이 쓰는 스켈레톤을 그대로 재사용한다. 지도·도서 정보 카드는
 * 좌표가 없는 판매글에서는 렌더되지 않으므로 골격에 넣지 않는다. (넣으면 레이아웃이 튄다)
 */
export default function Loading() {
  return <BookSaleDetailSkeleton />;
}
