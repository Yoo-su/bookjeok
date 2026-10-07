"use client";

import type { ReadingStackBook } from "@bookjeok/core";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { cn } from "@/shared/utils";

import { useAuthorArt } from "../hooks/use-author-art";
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

/** 한 권만 들일 때 대화상자가 자리 잡기를 기다리는 시간(ms) */
const ENTER_DELAY_MS = 280;

/** 한 권만 들일 때 그 책이 자리에 닿기까지(ms). 높이 숫자 올리기도 이 값을 쓴다 */
export const STACK_ENTER_LAND_MS = ENTER_DELAY_MS + 470;

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

/** 위에서 떨어져 바닥(또는 아래 책)에 닿고 살짝 튀는 움직임 */
function dropKeyframes(fromY: number): Keyframe[] {
  return [
    {
      transform: `translateY(${-fromY}px)`,
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
  ];
}

/** 쌓은 책을 아래부터 한 권씩 떨어뜨린다 */
function dropAll(groups: SVGGElement[], step: number) {
  // 먼저 다 재고 나서 건다. 재기와 걸기를 섞으면 책마다 레이아웃을 새로 계산한다
  const drops = groups.map((g) => {
    const bb = g.getBBox();
    return bb.y + bb.height + 40;
  });
  return groups.map((g, i) =>
    g.animate(dropKeyframes(drops[i]), {
      duration: 560,
      delay: i * step,
      fill: "backwards",
    }),
  );
}

/**
 * 한 권만 들인다. 맨 위 책은 떨어뜨리고, 사이에 끼는 책(지난 날짜 기록)은
 * 위 책들을 그 두께만큼 들어 올리며 왼쪽에서 밀어 넣는다
 */
function enterOne(groups: SVGGElement[], index: number) {
  const g = groups[index];
  const bb = g.getBBox();
  if (index === groups.length - 1)
    return [
      g.animate(dropKeyframes(bb.y + bb.height + 40), {
        duration: 620,
        delay: ENTER_DELAY_MS,
        fill: "backwards",
      }),
    ];
  const lift = groups.slice(index + 1).map((up) =>
    up.animate(
      [{ transform: `translateY(${bb.height}px)` }, { transform: "none" }],
      {
        duration: 360,
        delay: ENTER_DELAY_MS,
        easing: "cubic-bezier(.3,.7,.4,1)",
        fill: "backwards",
      },
    ),
  );
  const slide = g.animate(
    [
      {
        transform: `translateX(${-(bb.x + bb.width + 24)}px)`,
        opacity: 0,
        easing: "cubic-bezier(.2,.8,.3,1)",
      },
      { transform: "translateX(3px)", opacity: 1, offset: 0.82 },
      { transform: "none", opacity: 1 },
    ],
    { duration: 470, delay: ENTER_DELAY_MS + 100, fill: "backwards" },
  );
  return [...lift, slide];
}

/** 쌓은 책 꼭대기에서 위로 퍼지는 짧은 선들. 안에서 밖으로 긋는다 */
function sparkLines(cx: number, top: number, stackW: number) {
  const r0 = Math.max(10, stackW * 0.18);
  return [-162, -128, -90, -52, -18].map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    // 가운데 선이 가장 길고 바깥으로 갈수록 짧다
    const len = i === 2 ? 13 : i % 2 ? 10 : 7;
    const x0 = cx + Math.cos(a) * r0;
    const y0 = top - 4 + Math.sin(a) * r0 * 0.6;
    const x1 = x0 + Math.cos(a) * len;
    const y1 = y0 + Math.sin(a) * len;
    return `M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)}`;
  });
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
  /** 쌓은 책만 그릴 때 책 폭 하한(px). 작은 무대에서 다독이 바늘처럼 보이지 않게 */
  minStackWidthPx?: number;
  /** 무대 높이 등을 덮어쓴다 */
  className?: string;
  /** 사람 무대 높이(px). 사물 무대는 objectMaxHeight 안에서 내용만큼 줄인다 */
  height?: number;
  /** 바뀔 때마다 책을 다시 떨어뜨린다 */
  replayKey: number;
  /** 있으면 이 기록 한 권만 들인다. 맨 위면 떨어지고, 사이면 위 책들이 들리며 옆에서 밀려 들어간다 */
  enteringLogId?: string;
  /** 들인 책이 닿을 때 꼭대기에서 연필 선이 뻗는다 */
  celebrate?: boolean;
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
  minStackWidthPx,
  className,
  height: fixedHeight,
  replayKey,
  enteringLogId,
  celebrate = false,
  onIntroStart,
  onStackClick,
  stackClickLabel,
  ariaLabel,
}: StackStageProps) {
  const userMm = person?.userMm ?? 0;
  const character = person?.character ?? "M";
  const { art: authorArt, pending: artPending } = useAuthorArt(character);
  const labelsFor = person?.labelsFor;
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const sparkRef = useRef<SVGGElement>(null);
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
    // 작가 시안 전신을 받는 동안은 그리지 않는다. 옛 그림이 잠깐 보였다 바뀌지 않게
    if (!size.width || !height || (artPending && !object)) return null;
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
      authorArt,
      minStackWidthPx,
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
    minStackWidthPx,
    authorArt,
    artPending,
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
    const enterIdx = enteringLogId
      ? books.findIndex((b) => b.logId === enteringLogId)
      : -1;
    const animations =
      enterIdx >= 0
        ? enterOne(groups, enterIdx)
        : dropAll(groups, stackIntroStepMs(groups.length));
    const after =
      enterIdx >= 0
        ? STACK_ENTER_LAND_MS
        : groups.length * stackIntroStepMs(groups.length) + STACK_INTRO_LAND_MS;
    const ann = svg.querySelector("g.stack-annotations");
    const bubble = svg.querySelector("g.stack-bubble");
    const spark = sparkRef.current;
    if (spark) {
      animations.push(
        spark.animate(
          [{ opacity: 1 }, { opacity: 1, offset: 0.65 }, { opacity: 0 }],
          { duration: 1400, delay: after - 40, fill: "backwards" },
        ),
        ...Array.from(spark.querySelectorAll("path"), (line, i) =>
          line.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
            duration: 260,
            delay: after - 40 + i * 18,
            easing: "cubic-bezier(.2,.8,.3,1)",
            fill: "backwards",
          }),
        ),
      );
    }
    // 한 권만 들일 때는 목표 점선을 먼저 보여 줘 책이 그 선을 넘는 순간이 읽히게 한다
    const annParts =
      enterIdx >= 0 && ann
        ? Array.from(ann.querySelectorAll(":scope > :not(.stack-target-line)"))
        : ann
          ? [ann]
          : [];
    for (const el of annParts)
      animations.push(
        el.animate([{ opacity: 0 }, { opacity: 1 }], {
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
      style={
        objectHeight
          ? { height: objectHeight }
          : fixedHeight
            ? { height: fixedHeight }
            : undefined
      }
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
          {celebrate && enteringLogId && (
            <g ref={sparkRef} opacity={0} aria-hidden="true">
              {sparkLines(
                (scene.stack.left + scene.stack.right) / 2,
                scene.stack.top,
                scene.stack.right - scene.stack.left,
              ).map((d) => (
                <path
                  key={d}
                  d={d}
                  pathLength={1}
                  strokeDasharray="1"
                  stroke={COLORS.ink}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  fill="none"
                />
              ))}
            </g>
          )}
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
