"use client";

import type { ReadingStackBook } from "@bookjeok/core";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { cn } from "@/shared/utils";

import { useCanvasMeasure } from "../hooks/use-canvas-measure";
import { cm1 } from "../hooks/use-stack-copy";
import type { StackObjectSpec } from "../lib/objects";
import type { SceneLabels } from "../lib/scene";
import { buildStackScene, objectSceneHeight } from "../lib/scene";
import { SceneNodes } from "../lib/scene-svg";
import { type StackStatus, stackStatus } from "../lib/status";
import type { SceneColors, StackCharacter } from "../lib/types";

/** 첫 책이 바닥에 닿기까지의 시간(ms). 제목 숫자 올리기도 이 값을 쓴다 */
export const STACK_INTRO_LAND_MS = 420;

/** 키가 바뀔 때 캐릭터가 따라가는 시간(ms) */
const HEIGHT_TWEEN_MS = 380;

/** 책이 떨어지는 간격(ms). 책이 많아도 전체가 1.6초 안에 쌓이게 줄인다 */
export const stackIntroStepMs = (count: number) =>
  Math.min(26, 1600 / Math.max(1, count));

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

/** 쌓은 책 옆에 세울 캐릭터. 없으면 쌓은 책만 그린다(공개 프로필) */
export interface StackStagePerson {
  userMm: number;
  character: StackCharacter;
  labelsFor: (status: StackStatus, userMm: number) => SceneLabels;
}

/** 쌓은 책 옆에 세울 사물과 그 무대의 문구 */
export interface StackStageObject {
  spec: StackObjectSpec;
  labels: SceneLabels;
}

/** 사물 무대의 높이 범위(px). 폭이 축척을 정하므로 그 안에서 내용만큼 줄인다 */
const OBJECT_STAGE = { min: 200, max: 600 };

interface StackStageProps {
  books: ReadingStackBook[];
  stackMm: number;
  person?: StackStagePerson;
  /** 있으면 캐릭터 대신 사물을 세운다 */
  object?: StackStageObject;
  /** 사물 무대의 최대 높이(px) */
  objectMaxHeight?: number;
  /** false면 사물 무대도 높이를 줄이지 않고 부모 높이를 그대로 쓴다(소개 모달처럼 틀이 정해진 곳) */
  fitObjectHeight?: boolean;
  /** 무대 높이 등을 덮어쓴다 */
  className?: string;
  /** 바뀔 때마다 책을 다시 떨어뜨린다 */
  replayKey: number;
  onIntroStart?: () => void;
  onStackClick?: () => void;
  stackClickLabel: string;
  ariaLabel: string;
}

/**
 * 쌓은 책과 내 키 캐릭터를 같은 축척으로 그리는 무대. person이 없으면 쌓은 책만 그린다.
 * 키가 바뀌면 축척·캐릭터를 부드럽게 다시 맞추고, replayKey가 바뀌면 책을 다시 쌓는다.
 */
export function StackStage({
  books,
  stackMm,
  person,
  object,
  objectMaxHeight = OBJECT_STAGE.max,
  fitObjectHeight = true,
  className,
  replayKey,
  onIntroStart,
  onStackClick,
  stackClickLabel,
  ariaLabel,
}: StackStageProps) {
  const userMm = person?.userMm ?? 0;
  const character = person?.character ?? "M";
  const labelsFor = person?.labelsFor;
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [displayMm, setDisplayMm] = useState(userMm);
  const measure = useCanvasMeasure();

  // 사물 무대는 폭에 맞춘 축척만큼만 높인다. 좁은 화면에서 위가 텅 비지 않게
  const objectHeight =
    object && fitObjectHeight && size.width
      ? objectSceneHeight({
          width: size.width,
          books,
          stackMm,
          object: object.spec,
          minHeight: Math.min(OBJECT_STAGE.min, objectMaxHeight),
          maxHeight: objectMaxHeight,
        })
      : undefined;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setSize({ width: el.clientWidth, height: el.clientHeight }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 관찰자는 그린 뒤에 알려 주므로, 처음 띄울 때와 사물↔사람을 바꿀 때는 그리기 전에 잰다.
  // 그러지 않으면 사물 무대가 기본 높이로 한 번 그려졌다 줄어든다
  const isObject = Boolean(object);
  const [animateHeight, setAnimateHeight] = useState(false);
  const prevIsObjectRef = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setSize({ width: el.clientWidth, height: el.clientHeight });
    // 높이 트윈은 사용자가 바꿀 때만. 처음 띄울 때 줄어드는 모습이 보이면 안 된다
    const prev = prevIsObjectRef.current;
    if (prev !== null && prev !== isObject) setAnimateHeight(true);
    prevIsObjectRef.current = isObject;
  }, [isObject]);

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

  // 사물 무대는 높이가 바뀌는 동안에도 목표 높이로 그려 장면을 매 프레임 다시 만들지 않는다
  const height = objectHeight ?? size.height;
  const scene = useMemo(() => {
    if (!size.width || !height) return null;
    const status = stackStatus(stackMm, displayMm);
    if (object)
      return buildStackScene({
        width: size.width,
        height,
        books,
        stackMm,
        userMm: displayMm,
        character,
        status,
        labels: object.labels,
        colors: COLORS,
        measure,
        boil: !reducedMotion,
        object: object.spec,
      });
    return buildStackScene({
      width: size.width,
      height,
      books,
      stackMm,
      userMm: displayMm,
      character,
      status,
      labels: labelsFor
        ? labelsFor(status, displayMm)
        : {
            myHeight: "",
            remain: "",
            approxBooks: "",
            stackHeight: `${cm1(stackMm)}cm`,
            bubble: ["", ""],
          },
      colors: COLORS,
      measure,
      boil: !reducedMotion && !settling,
      figure: Boolean(labelsFor),
    });
  }, [
    size.width,
    height,
    object,
    books,
    stackMm,
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
      svg.querySelectorAll<SVGGElement>("g.stack-book"),
    );
    const step = stackIntroStepMs(groups.length);
    // 먼저 다 재고 나서 건다. 재기와 걸기를 섞으면 책마다 레이아웃을 새로 계산한다
    const drops = groups.map((g) => {
      const bb = g.getBBox();
      return bb.y + bb.height + 40;
    });
    const animations = groups.map((g, i) => {
      return g.animate(
        [
          {
            transform: `translateY(${-drops[i]}px)`,
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
    const after = groups.length * step + STACK_INTRO_LAND_MS;
    const ann = svg.querySelector("g.stack-annotations");
    const bubble = svg.querySelector("g.stack-bubble");
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
      className={cn(
        "relative h-[520px] w-full md:h-[600px]",
        className,
        object &&
          animateHeight &&
          "motion-safe:transition-[height] motion-safe:duration-300",
      )}
      style={objectHeight ? { height: objectHeight } : undefined}
    >
      {scene && (
        <svg
          ref={svgRef}
          width={size.width}
          height={height}
          viewBox={`0 0 ${size.width} ${height}`}
          role="img"
          aria-label={ariaLabel}
          className="block overflow-visible"
        >
          <SceneNodes items={scene.items} />
        </svg>
      )}
      {scene && books.length > 0 && onStackClick && (
        <button
          type="button"
          onClick={onStackClick}
          aria-label={stackClickLabel}
          className="absolute cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-emerald-700"
          style={{
            left: scene.stack.left - 4,
            top: scene.stack.top - 4,
            width: scene.stack.right - scene.stack.left + 8,
            height: scene.stack.bottom - scene.stack.top + 4,
          }}
        />
      )}
    </div>
  );
}
