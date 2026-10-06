"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { KongFace, KongLimbs } from "../lib/kong-art";

const FRAME_MS = 90;

/**
 * 콩을 누르면 팔다리를 꺼내 바둥거린다. 두 프레임을 번갈아 그리고 몸을 좌우로 흔든다.
 * 동작 줄이기를 켰으면 팔다리·흔들기 없이 눈만 질끈 감았다 뜬다
 */
export function useKongFlail(durationMs = 950) {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState<0 | 1 | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const interval = useRef<ReturnType<typeof setInterval>>(undefined);

  const stop = useCallback(() => {
    clearInterval(interval.current);
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => stop, [stop]);

  const flail = useCallback(() => {
    stop();
    setFrame(0);
    if (!reduced) {
      interval.current = setInterval(
        () => setFrame((f) => (f === 0 ? 1 : 0)),
        FRAME_MS,
      );
    }
    timers.current.push(
      setTimeout(
        () => {
          clearInterval(interval.current);
          setFrame(null);
        },
        reduced ? 500 : durationMs,
      ),
    );
  }, [durationMs, reduced, stop]);

  const flailing = frame !== null;
  const face: KongFace = flailing ? "squeeze" : "smile";
  const limbs: KongLimbs =
    !flailing || reduced ? "none" : frame === 0 ? "flail0" : "flail1";

  return { flail, flailing, face, limbs, reduced: !!reduced };
}
