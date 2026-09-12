"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** 점근이 멈춘 뒤에도 막대가 남지 않도록 두는 상한 */
const MAX_VISIBLE_MS = 10_000;

/**
 * 전역 내비게이션 진행 표시기.
 *
 * 목록 링크가 `prefetch={false}`라 클릭 시점에 페이로드를 받아온다. 그 공백을
 * `loading.tsx`로 가리면 Suspense 경계가 생겨 notFound() 전에 200 셸이 flush된다.
 * (soft 404 → ISR 캐시 오염) 그래서 라우트 밖에서 지연만 가린다.
 *
 * `useSearchParams`는 정적 렌더링을 무효화하므로 쓰지 않는다. 쿼리만 바뀌는
 * 전환은 상한 타이머로 정리한다.
 */
export const NavigationProgress = () => {
  const pathname = usePathname();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
    if (capRef.current) clearTimeout(capRef.current);
    tickRef.current = hideRef.current = capRef.current = null;
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setProgress(100);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    setVisible(true);
    setProgress(8);

    // 도착 시점을 모르므로 90%까지만 점근한다. 남은 10%는 완료 때 채운다.
    tickRef.current = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + (90 - prev) * 0.12));
    }, 120);
    capRef.current = setTimeout(finish, MAX_VISIBLE_MS);
  }, [clearTimers, finish]);

  // 경로가 바뀌면 내비게이션이 끝난 것
  useEffect(() => {
    finish();
    return clearTimers;
  }, [pathname, finish, clearTimers]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // 새 탭·다운로드·수정키 조합은 현재 문서를 떠나지 않음
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const next = new URL(anchor.href, window.location.href);
      if (next.origin !== window.location.origin) return;
      // 같은 문서 내 해시 이동은 라우트 전환이 아님
      if (
        next.pathname === window.location.pathname &&
        next.search === window.location.search
      )
        return;

      start();
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [start]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[9999] h-0.5 bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-stone-900 transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  );
};
