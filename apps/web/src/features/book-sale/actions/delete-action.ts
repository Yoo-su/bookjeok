"use server";

import { del } from "@vercel/blob";

import { isOwnedBlobUrl, resolveBlobOwner } from "@/shared/libs/blob-owner";

/**
 * 요청자 본인의 판매글 이미지를 스토리지에서 지웁니다.
 *
 * 서버 액션은 누구나 호출할 수 있는 공개 엔드포인트입니다. 토큰으로 요청자를
 * 확인하고 본인 디렉터리(`{provider}-{id}/`)의 URL만 지웁니다.
 * @param urls 지울 Blob URL 목록
 * @param accessToken 요청자의 액세스 토큰
 */
export async function deleteImages(urls: string[], accessToken: string) {
  if (!urls || urls.length === 0) {
    return { success: true };
  }

  try {
    if (!accessToken) {
      throw new Error("Unauthorized: No token provided");
    }

    const owner = await resolveBlobOwner(accessToken);
    const ownedUrls = urls.filter((url) => isOwnedBlobUrl(url, owner));

    if (ownedUrls.length > 0) {
      await del(ownedUrls);
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "이미지 삭제에 실패했습니다.",
    };
  }
}
