import { memo } from "react";

import type { FontRole, SceneItem } from "./types";

const FONT_FAMILY: Record<FontRole, string> = {
  hand: "var(--font-gaegu), cursive",
  ui: "var(--font-pretendard), sans-serif",
};

/** 장면 도형 목록을 SVG 요소로 그린다. 장면이 그대로면 다시 비교하지 않는다 */
export const SceneNodes = memo(function SceneNodes({
  items,
}: {
  items: SceneItem[];
}) {
  return (
    <>
      {items.map((it, i) => {
        const key = it.id ?? i;
        if (it.k === "g") {
          return (
            <g key={key} className={it.cls}>
              <SceneNodes items={it.children} />
            </g>
          );
        }
        if (it.k === "p") {
          return (
            <path
              key={key}
              d={it.d}
              fill={it.fill ?? "none"}
              stroke={it.stroke}
              strokeWidth={it.sw}
              strokeLinecap={it.cap}
              strokeLinejoin={it.join}
              strokeDasharray={it.dash?.map((v) => v.toFixed(1)).join(" ")}
              opacity={it.op}
              className={it.cls}
            />
          );
        }
        return (
          <text
            key={key}
            x={it.x}
            y={it.y}
            fontSize={it.size}
            fontWeight={it.weight}
            fill={it.fill}
            textAnchor={it.anchor ?? "start"}
            dominantBaseline="central"
            opacity={it.op}
            stroke={it.halo}
            strokeWidth={it.hw}
            strokeLinejoin={it.halo ? "round" : undefined}
            paintOrder={it.halo ? "stroke" : undefined}
            transform={
              it.rot
                ? `rotate(${it.rot.toFixed(2)} ${it.x.toFixed(1)} ${it.y.toFixed(1)})`
                : undefined
            }
            style={{ fontFamily: FONT_FAMILY[it.fam] }}
          >
            {it.t}
          </text>
        );
      })}
    </>
  );
});
