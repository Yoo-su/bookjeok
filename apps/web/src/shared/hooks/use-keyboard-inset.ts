"use client";

import { useEffect, useState } from "react";

interface KeyboardInset {
  /** 화면 아래에서 키보드가 가린 높이(px). 키보드가 없으면 0 */
  bottom: number;
  /** 키보드를 뺀 보이는 높이(px). 키보드가 없으면 null */
  visibleHeight: number | null;
}

const NONE: KeyboardInset = { bottom: 0, visibleHeight: null };

/**
 * 모바일 키보드가 가린 영역. 하단 고정 시트를 키보드 위로 올릴 때 쓴다
 * - iOS는 키보드가 떠도 레이아웃 뷰포트가 그대로라 fixed 하단 요소가 키보드 뒤에 깔림
 * - visualViewport로 보이는 영역을 읽어 그 바닥에 맞춤
 */
export function useKeyboardInset(enabled: boolean) {
  const [inset, setInset] = useState<KeyboardInset>(NONE);

  useEffect(() => {
    const vv = typeof window === "undefined" ? null : window.visualViewport;
    if (!enabled || !vv) {
      setInset(NONE);
      return;
    }

    const update = () => {
      const bottom = Math.max(
        0,
        Math.round(window.innerHeight - vv.height - vv.offsetTop),
      );
      // 주소창 접힘 정도의 차이는 키보드로 보지 않음
      setInset(
        bottom > 80 ? { bottom, visibleHeight: Math.round(vv.height) } : NONE,
      );
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return inset;
}
