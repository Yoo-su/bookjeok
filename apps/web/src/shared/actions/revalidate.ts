"use server";

import { revalidatePath } from "next/cache";

import { routing } from "@/shared/config/i18n/routing";

/**
 * ISR(Full Route Cache)을 즉시 파괴하는 서버 액션
 *
 * 클라이언트 쿼리 캐시 무효화는 서버 캐시에 닿지 않으므로, 다른 방문자와
 * 크롤러가 받는 HTML을 갱신하려면 이쪽을 함께 호출해야 한다.
 *
 * ⚠️ 이 액션은 서버 캐시만 지운다. 브라우저 Router Cache는 별개라
 * 호출한 쪽에서 `router.refresh()`도 함께 실행한다. (purgeRouteCache)
 *
 * 재검증 범위 규칙
 * - 아이템 상세만 즉시 재검증한다. 그 페이지의 주제가 바뀐 것이므로.
 * - 목록·홈 같은 집계는 시간 기반 revalidate에 위임한다. 쓰기마다 파기하면
 *   트래픽이 늘수록 적중률이 0에 수렴해 ISR이 사실상 SSR로 퇴화한다.
 *   상호작용 중인 사용자는 쿼리 무효화 + refetchOnMount로 이미 최신을 본다.
 * - 삭제만 예외로 집계까지 비운다. 목록에 남은 링크가 404로 이어지기 때문.
 * - 생성은 대상이 없다. 방금 만든 id의 상세는 아직 ISR에 없어 비울 것이 없다.
 * - 200을 404로 바꾸는 쓰기(회원 탈퇴)는 삭제와 같이 취급한다.
 */

/** 모든 로케일에 대해 같은 경로를 재검증 (localePrefix: "always") */
const revalidateAllLocales = (path: string) => {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}${path}`);
  }
};

/**
 * 판매글 변경 시 재검증 대상
 * - 판매글 상세. 마켓·홈은 시간 기반에 위임
 * - 도서 상세는 대상이 아니다. 연관 판매글이 클라이언트 전용이라 HTML에 안 실림
 * @param deleted 삭제 여부. 마켓·홈에 남은 죽은 링크를 함께 비운다
 */
export async function revalidateBookSale(params: {
  saleId?: number;
  deleted?: boolean;
}) {
  const { saleId, deleted } = params;

  if (saleId) revalidateAllLocales(`/book/sales/${saleId}`);

  if (deleted) {
    revalidateAllLocales("/book/market");
    revalidateAllLocales("");
  }
}

/**
 * 프로필 변경 시 재검증 대상
 * - 공개 프로필 페이지. 닉네임이 generateMetadata 타이틀에도 들어간다
 * - 목록·홈에 실린 작성자 이름까지 좇지 않는다 (집계는 시간 기반 재검증에 위임)
 * - 탈퇴도 여기로 온다. 소프트 삭제라 다음 요청은 404지만 ISR에 남은 200이
 *   만료 시각까지 탈퇴 회원의 프로필을 계속 내보낸다
 * - 핸들은 수정 대상이 아니라(UpdateUserDto에 없다) 옛 경로를 좇을 필요가 없다.
 *   바꿀 수 있게 만든다면 이전 핸들 경로도 함께 비워야 한다
 */
export async function revalidateUserProfile(params: { handle: string }) {
  const { handle } = params;

  if (!handle) return;
  revalidateAllLocales(`/users/${handle}`);
}

/**
 * 리뷰 변경 시 재검증 대상
 * - 리뷰 상세. 목록·홈은 시간 기반에 위임
 * @param deleted 삭제 여부. 목록·홈에 남은 죽은 링크를 함께 비운다
 */
export async function revalidateReview(params: {
  reviewId?: number;
  deleted?: boolean;
}) {
  const { reviewId, deleted } = params;

  if (reviewId) revalidateAllLocales(`/book/reviews/${reviewId}`);

  if (deleted) {
    revalidateAllLocales("/book/reviews");
    revalidateAllLocales("");
  }
}
