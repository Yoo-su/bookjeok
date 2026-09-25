"use client";

import type { ReadingTowerBook } from "@bookjeok/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { cn } from "@/shared/utils";
import { gaegu } from "@/styles/fonts";

import { cm1 } from "../hooks/use-tower-copy";
import type { SceneLabels } from "../lib/scene";
import { buildTowerScene } from "../lib/scene";
import { SceneNodes } from "../lib/scene-svg";
import { type TowerStatus, towerStatus } from "../lib/status";
import type { FontRole, SceneColors, TowerCharacter } from "../lib/types";

/** 첫 책이 바닥에 닿기까지의 시간(ms). 제목 숫자 올리기도 이 값을 쓴다 */
export const TOWER_INTRO_LAND_MS = 420;

/** 키가 바뀔 때 캐릭터가 따라가는 시간(ms) */
const HEIGHT_TWEEN_MS = 380;

/** 책이 떨어지는 간격(ms). 책이 많아도 전체가 1.6초 안에 쌓이게 줄인다 */
export const towerIntroStepMs = (count: number) =>
  Math.min(26, 1600 / Math.max(1, count));

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#2563EB",
  muted: "#78716C",
  faint: "#A8A29E",
};

/** 책탑 옆에 세울 캐릭터. 없으면 책탑만 그린다(공개 프로필) */
export interface TowerStagePerson {
  userMm: number;
  character: TowerCharacter;
  labelsFor: (status: TowerStatus, userMm: number) => SceneLabels;
}

interface TowerStageProps {
  books: ReadingTowerBook[];
  towerMm: number;
  person?: TowerStagePerson;
  /** 무대 높이 등을 덮어쓴다 */
  className?: string;
  /** 바뀔 때마다 책을 다시 떨어뜨린다 */
  replayKey: number;
  onIntroStart?: () => void;
  onTowerClick?: () => void;
  towerClickLabel: string;
  ariaLabel: string;
}

function useCanvasMeasure() {
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

/**
 * 책탑과 내 키 캐릭터를 같은 축척으로 그리는 무대. person이 없으면 책탑만 그린다.
 * 키가 바뀌면 축척·캐릭터를 부드럽게 다시 맞추고, replayKey가 바뀌면 책을 다시 쌓는다.
 */
export function TowerStage({
  books,
  towerMm,
  person,
  className,
  replayKey,
  onIntroStart,
  onTowerClick,
  towerClickLabel,
  ariaLabel,
}: TowerStageProps) {
  const userMm = person?.userMm ?? 0;
  const character = person?.character ?? "M";
  const labelsFor = person?.labelsFor;
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [displayMm, setDisplayMm] = useState(userMm);
  const measure = useCanvasMeasure();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setSize({ width: el.clientWidth, height: el.clientHeight }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 키가 바뀌면 캐릭터와 눈금이 튀지 않고 따라가게 한다
  const displayRef = useRef(displayMm);
  displayRef.current = displayMm;
  const lastChangeRef = useRef(0);
  // 키가 바뀌는 동안에는 캐릭터를 한 벌만 그린다. 세 벌이 장면 생성 비용의 2/3다
  const [settling, setSettling] = useState(false);
  useEffect(() => {
    const from = displayRef.current;
    if (from === userMm) return;
    const t0 = performance.now();
    // 슬라이더 드래그처럼 연달아 바뀌면 트윈 없이 바로 따라간다(매 프레임 장면 재생성 방지)
    const continuous = t0 - lastChangeRef.current < HEIGHT_TWEEN_MS;
    lastChangeRef.current = t0;
    setSettling(true);
    const settle = setTimeout(() => setSettling(false), HEIGHT_TWEEN_MS);
    if (reducedMotion || continuous) {
      setDisplayMm(userMm);
      return () => clearTimeout(settle);
    }
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / HEIGHT_TWEEN_MS);
      setDisplayMm(
        t < 1 ? from + (userMm - from) * (1 - (1 - t) ** 3) : userMm,
      );
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [userMm, reducedMotion]);

  const scene = useMemo(() => {
    if (!size.width || !size.height) return null;
    const status = towerStatus(towerMm, displayMm);
    return buildTowerScene({
      width: size.width,
      height: size.height,
      books,
      towerMm,
      userMm: displayMm,
      character,
      status,
      labels: labelsFor
        ? labelsFor(status, displayMm)
        : {
            myHeight: "",
            remain: "",
            approxBooks: "",
            towerHeight: `${cm1(towerMm)}cm`,
            bubble: ["", ""],
          },
      colors: COLORS,
      measure,
      boil: !reducedMotion && !settling,
      figure: Boolean(labelsFor),
    });
  }, [
    size,
    books,
    towerMm,
    displayMm,
    character,
    labelsFor,
    measure,
    reducedMotion,
    settling,
  ]);

  // 책을 한 권씩 떨어뜨린다. 보이지 않는 탭에서는 타임라인이 멈춰 책이 투명하게 남으므로 건너뛴다
  const ready = Boolean(scene);
  useEffect(() => {
    const svg = svgRef.current;
    // 훅은 첫 렌더에 false라 첫 인트로에서는 직접 확인한다
    const reduce =
      reducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (
      !ready ||
      !svg ||
      reduce ||
      document.visibilityState !== "visible" ||
      !books.length
    )
      return;
    const groups = Array.from(
      svg.querySelectorAll<SVGGElement>("g.tower-book"),
    );
    const step = towerIntroStepMs(groups.length);
    const animations = groups.map((g, i) => {
      const bb = g.getBBox();
      return g.animate(
        [
          {
            transform: `translateY(${-(bb.y + bb.height + 40)}px)`,
            opacity: 0,
            easing: "cubic-bezier(.55,0,1,.45)",
          },
          {
            transform: "translateY(0)",
            opacity: 1,
            offset: 0.76,
            easing: "ease-out",
          },
          { transform: "translateY(-2px)", offset: 0.88, easing: "ease-in" },
          { transform: "none", opacity: 1 },
        ],
        { duration: 560, delay: i * step, fill: "backwards" },
      );
    });
    const after = groups.length * step + TOWER_INTRO_LAND_MS;
    const ann = svg.querySelector("g.tower-annotations");
    const bubble = svg.querySelector("g.tower-bubble");
    if (ann)
      animations.push(
        ann.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 350,
          delay: after,
          fill: "backwards",
        }),
      );
    if (bubble) {
      animations.push(
        bubble.animate(
          [
            { transform: "scale(.3)", opacity: 0 },
            { transform: "scale(1.08)", opacity: 1, offset: 0.65 },
            { transform: "none", opacity: 1 },
          ],
          {
            duration: 460,
            delay: after + 120,
            easing: "cubic-bezier(.3,1.3,.5,1)",
            fill: "backwards",
          },
        ),
      );
    }
    onIntroStart?.();
    return () => animations.forEach((a) => a.finish());
    // 장면이 준비되거나 다시 쌓기를 누를 때만 돈다
  }, [ready, replayKey]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative h-[520px] w-full md:h-[600px]", className)}
    >
      {scene && (
        <svg
          ref={svgRef}
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          role="img"
          aria-label={ariaLabel}
          className="block overflow-visible"
        >
          <SceneNodes items={scene.items} />
        </svg>
      )}
      {scene && books.length > 0 && onTowerClick && (
        <button
          type="button"
          onClick={onTowerClick}
          aria-label={towerClickLabel}
          className="absolute cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-blue-600"
          style={{
            left: scene.tower.left - 4,
            top: scene.tower.top - 4,
            width: scene.tower.right - scene.tower.left + 8,
            height: scene.tower.bottom - scene.tower.top + 4,
          }}
        />
      )}
    </div>
  );
}
