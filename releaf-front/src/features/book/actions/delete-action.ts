"use server";

import { del } from "@vercel/blob";

export async function deleteImages(urls: string[]) {
  if (!urls || urls.length === 0) {
    return { success: true };
  }

  try {
    await del(urls);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "이미지 삭제에 실패했습니다.",
    };
  }
}
