import { forwardRef } from "react";

import { SceneNodes } from "@/features/reading-log/components/stack-view/lib/scene-svg";
import type { SceneItem } from "@/features/reading-log/components/stack-view/lib/types";

import type { CatPart as Part } from "../../lib/draw";

/** 축(px)을 중심으로 돌거나 움직이는 고양이 부품 한 묶음 */
export const CatPart = forwardRef<
  SVGGElement,
  { part: Part } | { items: SceneItem[]; pivot?: [number, number] }
>(function CatPart(props, ref) {
  const items = "part" in props ? props.part.items : props.items;
  const pivot = "part" in props ? props.part.pivot : props.pivot;
  return (
    <g
      ref={ref}
      style={
        pivot ? { transformOrigin: `${pivot[0]}px ${pivot[1]}px` } : undefined
      }
    >
      <SceneNodes items={items} />
    </g>
  );
});
