"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { gaegu } from "@/styles/fonts";

import type { FontRole } from "../lib/types";

/** 장면 글자 폭을 캔버스로 잰다. 독서 키재기 무대와 북적 책산이 같이 쓴다 */
export function useCanvasMeasure() {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [fontsVersion, setFontsVersion] = useState(0);

  // 손글씨 글꼴은 글자 묶음별로 늦게 받아진다. 받을 때마다 다시 재야 말풍선 폭이 맞는다
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let timer: ReturnType<typeof setTimeout>;
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setFontsVersion((v) => v + 1), 120);
    };
    document.fonts.addEventListener("loadingdone", bump);
    document.fonts.ready.then(bump);
    return () => {
      clearTimeout(timer);
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, []);

  const measure = useCallback(
    (text: string, size: number, weight: number, fam: FontRole) => {
      if (!ctxRef.current)
        ctxRef.current = document.createElement("canvas").getContext("2d");
      const ctx = ctxRef.current;
      if (!ctx) return text.length * size * 0.9;
      ctx.font = `${weight} ${size}px ${fam === "hand" ? gaegu.style.fontFamily : "Pretendard Variable, sans-serif"}`;
      return ctx.measureText(text).width;
    },
    // fontsVersion이 바뀌면 새 함수를 돌려줘 장면을 다시 만들게 한다
    [fontsVersion],
  );
  return measure;
}
