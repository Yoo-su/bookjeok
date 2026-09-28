import { RECENT_BOOKS_KEY } from "@bookjeok/core";

import { CHAT_STORAGE_KEY } from "@/features/book/constants/ai-chat";

/**
 * 로그인한 사용자의 활동이 담긴 탭 저장소(sessionStorage) 항목을 지웁니다.
 * 하드 내비게이션은 메모리만 비우고 sessionStorage는 남기므로, 지우지 않으면
 * 같은 탭에서 다음에 로그인한 사용자에게 최근 본 책과 AI 대화가 보입니다.
 */
export function purgeUserSessionStorage() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (
        key &&
        (key === RECENT_BOOKS_KEY || key.startsWith(CHAT_STORAGE_KEY))
      ) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // SSR 또는 sessionStorage 차단 환경
  }
}
