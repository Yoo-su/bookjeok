"use server";

import { revalidatePath } from "next/cache";

/**
 * 도서 리뷰 페이지 캐시를 수동으로 무효화합니다.
 * 리뷰 작성/수정/삭제 후 호출하여 다른 사용자에게도 즉시 반영되도록 합니다.
 */
export async function revalidateReviewsPage() {
  revalidatePath("/book/reviews");
}

/**
 * 홈페이지 캐시를 수동으로 무효화합니다.
 * 최신 리뷰 섹션이 즉시 업데이트되도록 합니다.
 */
export async function revalidateHomePage() {
  revalidatePath("/");
}
