"use client";

import { useAnimate } from "motion/react";
import { useEffect } from "react";

import { HOP_MS, type useKongFlail } from "../hooks/use-kong-flail";
import type { KongFace, KongLimbs } from "../lib/kong-art";
import { KongFigure } from ".";

interface FlailingKongProps {
  size: number;
  flail: ReturnType<typeof useKongFlail>;
  /** 반응하지 않을 때 표정 */
  restFace?: KongFace;
  /** 반응하지 않을 때 팔다리. 엎어진 종지에서 돌아다니는 콩처럼 걸을 때 */
  restLimbs?: KongLimbs;
  boil?: boolean;
  seed?: number;
  className?: string;
}

/**
 * `useKongFlail` 상태대로 움직이는 콩. 바둥은 좌우로 흔들고, 부르르는 잘게 떨고,
 * 콩 점프는 웅크렸다 뛰어올라 납작하게 내려앉는다
 */
export function FlailingKong({
  size,
  flail,
  restFace = "smile",
  restLimbs = "none",
  boil,
  seed,
  className,
}: FlailingKongProps) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const { reaction, nonce, reduced } = flail;

  useEffect(() => {
    const el = scope.current;
    if (!el || reduced || !nonce) return;
    if (reaction === null) {
      animate(
        el,
        { rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
        { duration: 0.15 },
      );
      return;
    }
    if (reaction === "flail") {
      const controls = animate(
        el,
        { rotate: [-7, 7] },
        {
          duration: 0.18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      );
      return () => controls.stop();
    }
    if (reaction === "shiver") {
      // 몸집에 비례해 떨되 작은 콩도 1px은 떨린다. 끝으로 갈수록 잦아든다
      const a = Math.max(1, size * 0.04);
      const xs = [
        0,
        -a,
        a,
        -a,
        a,
        -a,
        a,
        -a,
        a,
        -a * 0.6,
        a * 0.6,
        -a * 0.3,
        0,
      ];
      animate(
        el,
        {
          x: xs,
          rotate: xs.map((x) => (x / a) * 2),
          scaleY: xs.map((_, i) => (i === 0 || i === xs.length - 1 ? 1 : 0.95)),
        },
        { duration: 0.6, ease: "linear" },
      );
      return;
    }
    // 웅크림 → 뛰어오르며 늘어남 → 착지에 납작 → 제자리
    const h = Math.min(48, Math.max(12, size * 0.5));
    animate(
      el,
      {
        y: [0, 0, -h, 0, 0, 0],
        scaleX: [1, 1.16, 0.9, 1.14, 0.97, 1],
        scaleY: [1, 0.8, 1.12, 0.84, 1.03, 1],
      },
      {
        duration: HOP_MS / 1000,
        times: [0, 0.16, 0.46, 0.76, 0.88, 1],
        ease: ["easeOut", "easeOut", "easeIn", "easeOut", "easeOut"],
      },
    );
  }, [reaction, nonce, reduced, size, animate, scope]);

  return (
    <span
      ref={scope}
      className={className ?? "block"}
      // 바둥은 가운데를 축으로 흔들고, 떨림·점프는 발을 바닥에 붙인 채 눌린다
      style={{
        transformOrigin:
          reaction === "hop" || reaction === "shiver" ? "50% 92%" : "50% 50%",
      }}
    >
      <KongFigure
        size={size}
        face={flail.flailing ? flail.face : restFace}
        limbs={flail.flailing ? flail.limbs : restLimbs}
        boil={boil}
        seed={seed}
      />
    </span>
  );
}
