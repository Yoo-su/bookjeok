"use server";

import { revalidatePath } from "next/cache";

/**
 * 중고책 마켓 페이지 캐시를 수동으로 무효화합니다.
 * 판매글 작성/수정/삭제 후 호출하여 다른 사용자에게도 즉시 반영되도록 합니다.
 */
export async function revalidateBookMarketPage() {
  revalidatePath("/book/market");
}

/**
 * 홈페이지 캐시를 수동으로 무효화합니다.
 * 최근 판매글 섹션이 즉시 업데이트되도록 합니다.
 */
export async function revalidateHomePage() {
  revalidatePath("/");
}
