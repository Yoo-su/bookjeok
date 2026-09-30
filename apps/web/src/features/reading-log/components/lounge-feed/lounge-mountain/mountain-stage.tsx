"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

import { useCanvasMeasure } from "../../stack-view/hooks/use-canvas-measure";
import {
  buildMountainScene,
  type MountainSceneOptions,
} from "../../stack-view/lib/mountain-scene";
import { SceneNodes } from "../../stack-view/lib/scene-svg";
import type { SceneColors } from "../../stack-view/lib/types";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

/** 무대 높이 범위(px). 폭이 축척을 정하므로 그 안에서 내용만큼 줄인다 */
const STAGE = { min: 240, max: 520 };

/** 무대가 채우는 값(폭·높이 범위·색·글자 재기)을 뺀 장면 입력. 부모가 memo해서 넘긴다 */
export type MountainStageScene = Omit<
  MountainSceneOptions,
  "width" | "minHeight" | "maxHeight" | "colors" | "measure" | "boil" | "u"
>;

/** 북적 책동산 무대. 화면에 처음 들어올 때 산이 바닥에서 솟고 이름표·말풍선이 뒤따른다 */
export default function MountainStage({
  scene,
  ariaLabel,
}: {
  scene: MountainStageScene;
  ariaLabel: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const measure = useCanvasMeasure();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const built = useMemo(
    () =>
      width
        ? buildMountainScene({
            ...scene,
            width,
            minHeight: STAGE.min,
            maxHeight: STAGE.max,
            colors: COLORS,
            measure,
            boil: !reducedMotion,
          })
        : null,
    [width, scene, measure, reducedMotion],
  );

  // 화면에 들어올 때 한 번 솟는다. 보이지 않는 탭·동작 줄이기면 건너뛴다
  const ready = Boolean(built);
  useEffect(() => {
    const svg = svgRef.current;
    if (
      !ready ||
      !svg ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const mountain = svg.querySelector("g.mountain-rise");
    const rest = [
      svg.querySelector("g.stack-annotations"),
      svg.querySelector("g.stack-bubble"),
    ].filter((el): el is Element => el !== null);
    const hide = [mountain, ...rest].filter((el): el is Element => !!el);
    hide.forEach((el) => ((el as SVGGElement).style.opacity = "0"));
    const animations: Animation[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        hide.forEach((el) => ((el as SVGGElement).style.opacity = ""));
        if (document.visibilityState !== "visible") return;
        if (mountain)
          animations.push(
            mountain.animate(
              [
                { transform: "scaleY(0)", opacity: 1 },
                { transform: "scaleY(1.03)", offset: 0.8 },
                { transform: "none" },
              ],
              {
                duration: 1100,
                easing: "cubic-bezier(.2,.8,.3,1)",
                fill: "backwards",
              },
            ),
          );
        rest.forEach((el, i) =>
          animations.push(
            el.animate(
              i === 0
                ? [{ opacity: 0 }, { opacity: 1 }]
                : [
                    { transform: "scale(.3)", opacity: 0 },
                    { transform: "scale(1.08)", opacity: 1, offset: 0.65 },
                    { transform: "none", opacity: 1 },
                  ],
              {
                duration: i === 0 ? 350 : 460,
                delay: 1000 + i * 140,
                easing: i === 0 ? "ease-out" : "cubic-bezier(.3,1.3,.5,1)",
                fill: "backwards",
              },
            ),
          ),
        );
      },
      { threshold: 0.35 },
    );
    io.observe(svg);
    return () => {
      io.disconnect();
      hide.forEach((el) => ((el as SVGGElement).style.opacity = ""));
      animations.forEach((a) => a.finish());
    };
  }, [ready]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{ height: built?.height ?? STAGE.min }}
    >
      {built && (
        <svg
          ref={svgRef}
          width={width}
          height={built.height}
          viewBox={`0 0 ${width} ${built.height}`}
          role="img"
          aria-label={ariaLabel}
          className="block overflow-visible"
        >
          <SceneNodes items={built.items} />
        </svg>
      )}
    </div>
  );
}
