"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

import { drawPeekingCat } from "../../../lib/draw";
import { CatPart } from "../cat-part";
import type { CameoSceneProps } from "../types";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * 화면 아래 모서리 너머에서 귀 끝부터 올라와 두리번거리고 쏙 내려가는 고양이.
 * 시각(ms)은 귀 → 갸웃 → 눈까지 → 앞발 → 왼쪽·오른쪽 → 깜빡 → 쏙
 */
const T = {
  ears: 700,
  tilt: 1050,
  untilt: 1350,
  up: 1950,
  paws: 2300,
  lookL: 2650,
  lookR: 3250,
  lookC: 3850,
  blink: 4050,
  stay: 4650,
  gone: 4900,
} as const;

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
    return { r, ...(free ?? tries[0]) };
  }, [rand]);
  const cat = useMemo(() => drawPeekingCat(layout.r), [layout.r]);
  const headRef = useRef<SVGGElement>(null);
  const pawsRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);
  const fled = useRef(false);
  const anims = useRef<Animation[]>([]);

  const hidden = cat.height + 2;
  const earsOnly = cat.height - 0.5 * cat.r;
  const pawsHidden = 0.75 * cat.r;

  useEffect(() => {
    const head = headRef.current;
    const paws = pawsRef.current;
    if (!head || !paws) return;
    const total = T.gone;
    const at = (ms: number) => ms / total;
    const y = (v: number, deg = 0) =>
      `translateY(${v.toFixed(1)}px) rotate(${deg}deg)`;
    const list: Animation[] = [
      head.animate(
        [
          {
            offset: 0,
            transform: y(hidden),
            easing: "cubic-bezier(.2,.7,.3,1)",
          },
          { offset: at(T.ears), transform: y(earsOnly), easing: "ease-in-out" },
          {
            offset: at(T.tilt),
            transform: y(earsOnly, -8),
            easing: "ease-in-out",
          },
          {
            offset: at(T.untilt),
            transform: y(earsOnly),
            easing: "cubic-bezier(.3,.6,.3,1.25)",
          },
          { offset: at(T.up), transform: y(0) },
          {
            offset: at(T.stay),
            transform: y(0),
            easing: "cubic-bezier(.6,0,.9,.6)",
          },
          { offset: 1, transform: y(hidden) },
        ],
        { duration: total, fill: "both" },
      ),
      paws.animate(
        [
          { offset: 0, transform: y(pawsHidden) },
          {
            offset: at(T.up),
            transform: y(pawsHidden),
            easing: "cubic-bezier(.3,.7,.4,1.2)",
          },
          { offset: at(T.paws), transform: y(0) },
          { offset: at(T.stay - 60), transform: y(0), easing: "ease-in" },
          { offset: at(T.stay + 140), transform: y(pawsHidden) },
          { offset: 1, transform: y(pawsHidden) },
        ],
        { duration: total, fill: "both" },
      ),
    ];
    const look = 0.13 * cat.r;
    if (pupilsRef.current)
      list.push(
        pupilsRef.current.animate(
          [
            { offset: 0, transform: "translateX(0px)" },
            {
              offset: at(T.lookL),
              transform: "translateX(0px)",
              easing: "ease-in-out",
            },
            { offset: at(T.lookL + 180), transform: `translateX(${-look}px)` },
            {
              offset: at(T.lookR),
              transform: `translateX(${-look}px)`,
              easing: "ease-in-out",
            },
            { offset: at(T.lookR + 200), transform: `translateX(${look}px)` },
            {
              offset: at(T.lookC),
              transform: `translateX(${look}px)`,
              easing: "ease-in-out",
            },
            { offset: at(T.lookC + 160), transform: "translateX(0px)" },
            { offset: 1, transform: "translateX(0px)" },
          ],
          { duration: total, fill: "both" },
        ),
      );
    if (eyesRef.current)
      list.push(
        eyesRef.current.animate(
          [
            { offset: 0, transform: "scaleY(1)" },
            { offset: at(T.blink), transform: "scaleY(1)", easing: "ease-in" },
            {
              offset: at(T.blink + 70),
              transform: "scaleY(0.08)",
              easing: "ease-out",
            },
            { offset: at(T.blink + 190), transform: "scaleY(1)" },
            { offset: 1, transform: "scaleY(1)" },
          ],
          { duration: total },
        ),
      );
    anims.current = list;
    list[0].onfinish = () => {
      if (!fled.current) onDone();
    };
    return () => list.forEach((a) => a.cancel());
  }, [cat, hidden, earsOnly, pawsHidden, onDone]);

  /** 누르면 놀라서 쏙 숨는다 */
  const duck = () => {
    const head = headRef.current;
    const paws = pawsRef.current;
    if (fled.current || !head || !paws) return;
    fled.current = true;
    const from = (el: Element) => getComputedStyle(el).transform;
    const headFrom = from(head);
    const pawsFrom = from(paws);
    anims.current.forEach((a) => a.cancel());
    const opts = {
      duration: 220,
      easing: "cubic-bezier(.5,0,.9,.5)",
      fill: "both" as const,
    };
    paws.animate(
      [{ transform: pawsFrom }, { transform: `translateY(${pawsHidden}px)` }],
      opts,
    );
    head.animate(
      [{ transform: headFrom }, { transform: `translateY(${hidden}px)` }],
      { ...opts, delay: 40 },
    ).onfinish = () => onDone();
  };

  return createPortal(
    <div
      aria-hidden
      data-cat-cameo
      className="pointer-events-none fixed bottom-0 z-[45]"
      style={{
        [layout.right ? "right" : "left"]: layout.inset,
        width: cat.width,
        height: cat.height,
      }}
    >
      <svg width={cat.width} height={cat.height}>
        <g
          className="cursor-pointer"
          pointerEvents="visiblePainted"
          onPointerDown={duck}
        >
          <g
            ref={headRef}
            style={{
              transform: `translateY(${hidden}px)`,
              transformOrigin: `${cat.width / 2}px ${cat.height}px`,
            }}
          >
            <CatPart items={cat.front.face} />
            <CatPart
              ref={eyesRef}
              pivot={cat.front.eyeCenter}
              items={cat.front.eyes}
            />
            <CatPart ref={pupilsRef} items={cat.front.pupils} />
          </g>
          <g ref={pawsRef} style={{ transform: `translateY(${pawsHidden}px)` }}>
            <CatPart items={cat.paws} />
          </g>
        </g>
      </svg>
    </div>,
    host,
  );
}
