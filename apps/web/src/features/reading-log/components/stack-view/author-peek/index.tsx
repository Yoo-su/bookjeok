"use client";

import { useEffect, useMemo, useRef } from "react";

import { buildFigure } from "../lib/figure";
import { HEART_CENTER, WAVE_ELBOW } from "../lib/figure-authors";
import { SceneNodes } from "../lib/scene-svg";
import type { SceneColors, StackAuthor } from "../lib/types";

export type PeekAction = "bow" | "wave" | "heart";
export type PeekSide = "left" | "right";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

/** 고개를 돌리는 축(300×1000 단위). 턱 밑 목 */
const NECK: [number, number] = [150, 150];
/** 허리(300×1000 단위). 인사할 때 여기서 접는다 */
const WAIST_Y = 520;
const FADE = "linear-gradient(to bottom, #000 50%, transparent 72%)";

/** 가장자리 너머에서 옆으로 쏙 나와 살짝 지나쳤다가 멈추고, 끝나면 다시 숨는다 */
const SLIDE: Keyframe[] = [
  { translate: "-78% 0", rotate: "-6deg", easing: "cubic-bezier(.2,.9,.3,1)" },
  { translate: "6% 0", rotate: "9deg", offset: 0.14, easing: "ease-in-out" },
  { translate: "0% 0", rotate: "6deg", offset: 0.22 },
  {
    translate: "0% 0",
    rotate: "6deg",
    offset: 0.84,
    easing: "cubic-bezier(.5,0,.8,.4)",
  },
  { translate: "-78% 0", rotate: "-6deg" },
];

/** 나와서 가운데 쪽으로 고개를 갸웃한다 */
const HEAD_CURIOUS: Keyframe[] = [
  { rotate: "0deg" },
  { rotate: "0deg", offset: 0.16, easing: "ease-out" },
  { rotate: "11deg", offset: 0.27, easing: "ease-in-out" },
  { rotate: "6deg", offset: 0.48, easing: "ease-in-out" },
  { rotate: "11deg", offset: 0.64 },
  { rotate: "11deg", offset: 0.8, easing: "ease-in" },
  { rotate: "0deg", offset: 0.9 },
  { rotate: "0deg" },
];

/** 허리를 조금 접는 사이 고개는 한 번 더 깊이 까딱한다 */
const HEAD_BOW: Keyframe[] = [
  { rotate: "0deg" },
  { rotate: "0deg", offset: 0.16, easing: "ease-out" },
  { rotate: "8deg", offset: 0.26 },
  { rotate: "8deg", offset: 0.33, easing: "ease-in" },
  { rotate: "22deg", offset: 0.43, easing: "ease-out" },
  { rotate: "22deg", offset: 0.5, easing: "ease-in-out" },
  { rotate: "6deg", offset: 0.62 },
  { rotate: "6deg", offset: 0.8, easing: "ease-in" },
  { rotate: "0deg", offset: 0.9 },
  { rotate: "0deg" },
];

const WAIST_BOW: Keyframe[] = [
  { rotate: "0deg" },
  { rotate: "0deg", offset: 0.31, easing: "ease-in" },
  { rotate: "13deg", offset: 0.43, easing: "ease-out" },
  { rotate: "13deg", offset: 0.5, easing: "ease-in-out" },
  { rotate: "0deg", offset: 0.63 },
  { rotate: "0deg" },
];

/** 손하트: 고개를 더 갸웃하고 */
const HEAD_HEART: Keyframe[] = [
  { rotate: "0deg" },
  { rotate: "0deg", offset: 0.16, easing: "ease-out" },
  { rotate: "15deg", offset: 0.28, easing: "ease-in-out" },
  { rotate: "10deg", offset: 0.5, easing: "ease-in-out" },
  { rotate: "15deg", offset: 0.66 },
  { rotate: "15deg", offset: 0.8, easing: "ease-in" },
  { rotate: "0deg", offset: 0.9 },
  { rotate: "0deg" },
];

/** 손하트를 내밀듯 두 번 까딱한다 */
const ARM_HEART: Keyframe[] = [
  { rotate: "0deg" },
  { rotate: "0deg", offset: 0.26, easing: "ease-out" },
  { rotate: "-9deg", offset: 0.31, easing: "ease-in-out" },
  { rotate: "0deg", offset: 0.37 },
  { rotate: "0deg", offset: 0.5, easing: "ease-out" },
  { rotate: "-7deg", offset: 0.54, easing: "ease-in-out" },
  { rotate: "0deg", offset: 0.6 },
  { rotate: "0deg" },
];

/** 손끝 위로 하트가 뿅 커졌다가 한 번 더 두근거리고 떠오르며 사라진다 */
const HEART_POP: Keyframe[] = [
  { scale: "0", opacity: 0, translate: "0 0" },
  { scale: "0", opacity: 0, offset: 0.3, easing: "cubic-bezier(.3,1.6,.6,1)" },
  { scale: "1.2", opacity: 1, offset: 0.37, easing: "ease-out" },
  { scale: "1", opacity: 1, offset: 0.43, easing: "ease-in-out" },
  { scale: "1.15", opacity: 1, offset: 0.54, easing: "ease-in-out" },
  { scale: "1", opacity: 1, offset: 0.6, translate: "0 0", easing: "ease-in" },
  { scale: "0.9", opacity: 0, offset: 0.82, translate: "0 -14px" },
  { scale: "0", opacity: 0, translate: "0 -14px" },
];

const WAVE: Keyframe[] = [
  { rotate: "0deg" },
  { rotate: "-18deg", offset: 0.12 },
  { rotate: "12deg", offset: 0.3 },
  { rotate: "-18deg", offset: 0.48 },
  { rotate: "12deg", offset: 0.66 },
  { rotate: "-8deg", offset: 0.84 },
  { rotate: "0deg" },
];

interface AuthorPeekProps {
  author: StackAuthor;
  side: PeekSide;
  action: PeekAction;
  /** 발끝까지 전신 높이(px). 아랫부분은 흐려지며 가려진다 */
  height: number;
  /** 바뀔 때마다 한 번 나왔다 들어간다 */
  playKey: number;
  onDone?: () => void;
}

/**
 * 작가가 화면 가장자리 너머에서 옆으로 나와 고개를 갸웃하며 인사하고 다시 숨는다.
 * 부모는 position: relative·overflow: hidden이어야 가장자리 너머가 가려진다.
 */
export function AuthorPeek({
  author,
  side,
  action,
  height,
  playKey,
  onDone,
}: AuthorPeekProps) {
  const k = height / 1000;
  const pad = 24 * k;
  const width = 330 * k + pad * 2;
  const items = useMemo(
    () =>
      buildFigure({
        fx: pad,
        fy: pad,
        k,
        colors: COLORS,
        u: 1,
        mood: "calm",
        character: author,
        heldColor: "#3F6E8C",
        boil: true,
        arm: action === "bow" ? undefined : action,
        peek: true,
      }),
    [author, action, k, pad],
  );
  const slideRef = useRef<HTMLDivElement>(null);
  const waistRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const slide = slideRef.current;
    const waist = waistRef.current;
    const svg = svgRef.current;
    if (!slide || !waist || !svg || playKey === 0) return;
    const duration = { bow: 3400, wave: 4000, heart: 4200 }[action];
    const pivot = (g: SVGGElement, [x, y]: [number, number]) => {
      g.style.transformBox = "view-box";
      g.style.transformOrigin = `${pad + x * k}px ${pad + y * k}px`;
      return g;
    };
    const groups = (cls: string) =>
      Array.from(svg.querySelectorAll<SVGGElement>(`g.${cls}`));
    const all = [
      slide.animate(SLIDE, { duration }),
      ...(action === "bow" ? [waist.animate(WAIST_BOW, { duration })] : []),
      ...groups("peek-head").map((g) =>
        pivot(g, NECK).animate(
          { bow: HEAD_BOW, wave: HEAD_CURIOUS, heart: HEAD_HEART }[action],
          { duration },
        ),
      ),
      ...groups("peek-forearm").map((g) =>
        action === "heart"
          ? pivot(g, WAVE_ELBOW).animate(ARM_HEART, { duration })
          : pivot(g, WAVE_ELBOW).animate(WAVE, {
              duration: duration * 0.58,
              delay: duration * 0.22,
              easing: "ease-in-out",
            }),
      ),
      ...groups("peek-heart").map((g) => {
        // 애니메이션 밖에서는 하트를 숨겨 둔다
        g.style.opacity = "0";
        return pivot(g, HEART_CENTER).animate(HEART_POP, { duration });
      }),
    ];
    all[0].onfinish = () => onDoneRef.current?.();
    return () => all.forEach((a) => a.cancel());
  }, [playKey, action, k, pad]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        bottom: -height * 0.16,
        [side]: -width * 0.24,
        width,
        height: height + pad * 2,
        // 오른쪽은 좌우를 뒤집어 흔드는 팔과 고개가 가운데를 보게 한다
        transform: side === "right" ? "scaleX(-1)" : undefined,
      }}
    >
      <div
        ref={slideRef}
        className="h-full w-full"
        style={{ translate: "-78% 0", transformOrigin: "50% 100%" }}
      >
        <div
          ref={waistRef}
          className="h-full w-full"
          style={{
            transformOrigin: `50% ${pad + WAIST_Y * k}px`,
            // 몸과 함께 돌아야 숙인 상체가 잘리지 않고 다리만 흐려진다
            maskImage: FADE,
            WebkitMaskImage: FADE,
          }}
        >
          <svg
            ref={svgRef}
            width={width}
            height={height + pad * 2}
            className="overflow-visible"
          >
            <SceneNodes items={items} />
          </svg>
        </div>
      </div>
    </div>
  );
}
