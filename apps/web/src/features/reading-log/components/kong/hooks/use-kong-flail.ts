"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { KongFace, KongLimbs } from "../lib/kong-art";

const FRAME_MS = 90;

/** flail: 바둥 · shiver: 부르르 · hop: 제자리에서 콩 점프 */
export type KongReaction = "flail" | "shiver" | "hop";
const REACTIONS: KongReaction[] = ["flail", "shiver", "hop"];
const SHIVER_MS = 620;
export const HOP_MS = 640;
/** 점프 중 발이 떨어져 있는 구간. `FlailingKong`의 점프 keyframe(times 0.16~0.76)과 맞춘다 */
const HOP_AIR_MS: [number, number] = [100, 490];

const FACE: Record<KongReaction, KongFace> = {
  flail: "squeeze",
  shiver: "shiver",
  hop: "joy",
};

/**
 * 콩을 누르면 반응한다. `flail`은 늘 바둥(로그인을 권할 때처럼 뜻이 있는 반응),
 * `poke`는 바둥·부르르·콩 점프 중 하나를 고르되 같은 동작을 연달아 고르지 않는다.
 * 움직임은 `FlailingKong`이 그린다. 동작 줄이기를 켰으면 움직임 없이 표정만 잠깐 바꾼다
 */
export function useKongFlail(durationMs = 950) {
  const reduced = useReducedMotion();
  const [reaction, setReaction] = useState<KongReaction | null>(null);
  const [frame, setFrame] = useState<0 | 1>(0);
  const [airborne, setAirborne] = useState(false);
  // 같은 반응을 다시 눌러도 처음부터 움직이게
  const [nonce, setNonce] = useState(0);
  const last = useRef<KongReaction | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const interval = useRef<ReturnType<typeof setInterval>>(undefined);

  const stop = useCallback(() => {
    clearInterval(interval.current);
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => stop, [stop]);

  const play = useCallback(
    (next: KongReaction) => {
      stop();
      last.current = next;
      setReaction(next);
      setFrame(0);
      setAirborne(false);
      setNonce((n) => n + 1);
      const later = (fn: () => void, ms: number) =>
        timers.current.push(setTimeout(fn, ms));

      if (reduced) {
        later(() => setReaction(null), 500);
        return;
      }
      if (next === "flail") {
        interval.current = setInterval(
          () => setFrame((f) => (f === 0 ? 1 : 0)),
          FRAME_MS,
        );
      }
      if (next === "hop") {
        later(() => setAirborne(true), HOP_AIR_MS[0]);
        later(() => setAirborne(false), HOP_AIR_MS[1]);
      }
      later(
        () => {
          clearInterval(interval.current);
          setReaction(null);
        },
        next === "flail" ? durationMs : next === "hop" ? HOP_MS : SHIVER_MS,
      );
    },
    [durationMs, reduced, stop],
  );

  const flail = useCallback(() => play("flail"), [play]);
  const poke = useCallback(() => {
    const options = REACTIONS.filter((r) => r !== last.current);
    play(options[Math.floor(Math.random() * options.length)]);
  }, [play]);

  const flailing = reaction !== null;
  const face: KongFace = reaction ? FACE[reaction] : "smile";
  let limbs: KongLimbs = "none";
  if (reaction && !reduced) {
    if (reaction === "flail") limbs = frame === 0 ? "flail0" : "flail1";
    else if (reaction === "shiver") limbs = "brr";
    else if (airborne) limbs = "cheer";
  }

  return {
    flail,
    poke,
    /** 반응을 골라서. 스토리에서 하나씩 볼 때 */
    play,
    reaction,
    nonce,
    flailing,
    face,
    limbs,
    reduced: !!reduced,
  };
}
