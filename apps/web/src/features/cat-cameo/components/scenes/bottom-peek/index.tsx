"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { spriteFrame } from "../sprite-frames";
import type { CameoSceneProps } from "../types";
import atlas from "./peek.json";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const DURATION = 4900;
const PEEK_IMAGE = "/cat-cameo/peek.png";
const CROP = { x: 25, y: 12, width: 142, height: 104 };
const HIDDEN = "translateY(105%)";
const FACES = [
  [0, 0],
  [950, 1],
  [1400, 0],
  [2320, 2],
  [2820, 0],
  [2960, 3],
  [3680, 0],
  [4050, 4],
  [4170, 0],
  [DURATION, 0],
].map(([at, frame]) => spriteFrame(atlas.frames[frame], at / DURATION));

/** 화면에 붙어 떠 있는 요소(빠른 메뉴·떠 있는 버튼 등)가 그 점을 덮고 있는지 */
function coveredByFixed(x: number, y: number) {
  for (let el = document.elementFromPoint(x, y); el; el = el.parentElement) {
    if (el.closest("[data-cat-cameo]")) return false;
    if (getComputedStyle(el).position === "fixed") return true;
  }
  return false;
}

export function BottomPeek({ host, rand, onDone }: CameoSceneProps) {
  const layout = useMemo(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = clamp(vw * 0.065, 22, 30);
    const w = 3.24 * r;
    const first = rand() < 0.5;
    // 고른 모서리가 막혀 있으면 안쪽으로 조금씩, 그래도 막히면 반대 모서리
    const tries = [first, !first].flatMap((right) =>
      [12 + rand() * clamp(vw * 0.1, 8, 64), 12, 48, 96].map((inset) => ({
        right,
        inset,
      })),
    );
    const free = tries.find(({ right, inset }) => {
      const x0 = right ? vw - inset - w : inset;
      return [0.15, 0.5, 0.85].every(
        (t) => !coveredByFixed(x0 + w * t, vh - r * 0.8),
      );
    });
    return { w, ...(free ?? tries[0]) };
  }, [rand]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<SVGImageElement>(null);
  const anims = useRef<Animation[]>([]);
  const fled = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const strip = stripRef.current;
    if (!ready || !wrap || !strip) return;
    const options = { duration: DURATION, fill: "both" as const };
    const reveal = wrap.animate(
      [
        { transform: HIDDEN, easing: "cubic-bezier(.2,.7,.3,1)" },
        { offset: 0.15, transform: "translateY(76%)", easing: "ease-in-out" },
        {
          offset: 0.28,
          transform: "translateY(76%)",
          easing: "cubic-bezier(.2,.65,.32,1)",
        },
        { offset: 0.43, transform: "translateY(0%)" },
        { offset: 0.93, transform: "translateY(0%)", easing: "ease-in" },
        { transform: HIDDEN },
      ],
      options,
    );
    anims.current = [reveal, strip.animate(FACES, options)];
    reveal.onfinish = () => {
      if (!fled.current) onDone();
    };
    return () => anims.current.forEach((animation) => animation.cancel());
  }, [ready, onDone]);

  const duck = () => {
    const wrap = wrapRef.current;
    if (fled.current || !wrap) return;
    fled.current = true;
    const from = getComputedStyle(wrap).transform;
    anims.current[0].cancel();
    // 표정은 누른 순간 그대로 유지하면서 내려간다.
    anims.current[1].pause();
    const hide = wrap.animate([{ transform: from }, { transform: HIDDEN }], {
      duration: 220,
      easing: "cubic-bezier(.5,0,.9,.5)",
      fill: "both",
    });
    anims.current[0] = hide;
    hide.onfinish = onDone;
  };

  return createPortal(
    <div
      aria-hidden
      data-cat-cameo
      className="pointer-events-none fixed bottom-0 z-[45] overflow-hidden"
      style={{ [layout.right ? "right" : "left"]: layout.inset }}
    >
      <div ref={wrapRef} style={{ transform: HIDDEN }}>
        <svg
          className="block"
          viewBox={`${CROP.x} ${CROP.y} ${CROP.width} ${CROP.height}`}
          width={layout.w}
          height={(layout.w * CROP.height) / CROP.width}
        >
          <image
            ref={stripRef}
            href={PEEK_IMAGE}
            width={atlas.sheetWidth}
            height={atlas.sheetHeight}
            onLoad={() => setReady(true)}
            onError={onDone}
          />
          <path
            d="M40 116 Q36 105 49 96 Q47 76 57 60 L53 15 L85 43 Q98 37 112 43 L143 15 L140 58 Q151 77 145 97 Q158 103 153 116Z"
            fill="transparent"
            pointerEvents="visibleFill"
            className="cursor-pointer"
            onPointerDown={duck}
          />
        </svg>
      </div>
    </div>,
    host,
  );
}
