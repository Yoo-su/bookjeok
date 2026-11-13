import { saveCurrentReturnUrl } from "@/features/auth/utils/return-url";
import { PATHS } from "@/shared/constants/paths";

import { localizedPath, splitLocalizedPath } from "./browser-navigation";

/**
 * 세션 종료(로그아웃 · 토큰 만료 · 인증 실패) 처리 유틸
 *
 * SPA 라우팅(router.push)으로 세션을 끝내면 브라우저 힙이 그대로 유지된다.
 * TanStack Query 캐시, Next.js Router Cache(static 5분),
 * zustand 스토어, 소켓 연결, 진행 중인 요청이 모두 이전 사용자의 것으로 남고,
 * 같은 브라우저에서 다음 사용자가 로그인하면 그 데이터가 그대로 노출된다.
 *
 * 세션 종료는 예외 없이 하드 내비게이션으로 처리해 브라우저 힙 자체를 폐기한다.
 * (회원 탈퇴가 이미 쓰던 방식이며, 로그아웃·인증 실패도 이쪽으로 통일한다.)
 */

/** 하드 내비게이션 이후에 띄울 토스트 메시지 보관 키 */
const PENDING_TOAST_KEY = "bookjeok:pending-session-toast";

/**
 * 세션 종료 직후 보여줄 토스트를 예약합니다.
 * 하드 내비게이션은 리액트 트리를 통째로 폐기하므로 토스트를 즉시 띄울 수 없습니다.
 */
export const markSessionToast = (message: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_TOAST_KEY, message);
  } catch {
    // sessionStorage 차단 환경(사파리 프라이빗 등) — 토스트만 생략하고 진행
  }
};

/** 예약된 토스트 메시지를 한 번만 꺼냅니다. */
export const consumeSessionToast = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const message = window.sessionStorage.getItem(PENDING_TOAST_KEY);
    if (message) window.sessionStorage.removeItem(PENDING_TOAST_KEY);
    return message;
  } catch {
    return null;
  }
};

/**
 * 로케일을 유지한 채 하드 내비게이션합니다.
 * router.push와 달리 브라우저 힙(쿼리 캐시 · Router Cache · 스토어 · 소켓)을 폐기합니다.
 */
export const hardRedirect = (path: string) => {
  if (typeof window === "undefined") return;
  const { locale } = splitLocalizedPath(window.location.pathname);
  window.location.replace(localizedPath(path, locale ?? "ko"));
};

/** 인증이 끊긴 상태에서 로그인 페이지로 보냅니다. */
export const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  const { pathname: route } = splitLocalizedPath(window.location.pathname);
  const pathname = route.replace(/\/+$/, "");
  if (
    pathname === PATHS.LOGIN ||
    pathname === PATHS.SIGNUP ||
    pathname === PATHS.CALLBACK
  )
    return;
  saveCurrentReturnUrl();
  hardRedirect(PATHS.LOGIN);
};
