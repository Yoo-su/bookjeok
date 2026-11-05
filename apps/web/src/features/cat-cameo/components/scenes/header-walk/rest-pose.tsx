import { type Ref, useId } from "react";

import { SceneNodes } from "@/features/reading-log/components/stack-view/lib/scene-svg";

import { drawRestingCatFace } from "../../../lib/draw";
import { CatPart } from "../cat-part";
import atlas from "./walk.json";

export const WALK_IMAGE = "/cat-cameo/walk.png";
export const WALK_CROP = { x: 16, y: 24, width: 164, height: 125, ground: 145 };
// 네 발이 몸 아래에 모인 프레임을 정지 자세와 한 걸음의 시작에 함께 쓴다.
export const REST_FRAME_INDEX = 1;

const face = drawRestingCatFace();

export function RestPose({ eyesRef }: { eyesRef?: Ref<SVGGElement> }) {
  const bodyClip = useId();
  return (
    <>
      <defs>
        <clipPath id={bodyClip}>
          <path d="M16 24H101V65Q101 73 107 78L121 84Q126 88 128 95H180V149H16Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${bodyClip})`}>
        <image
          href={WALK_IMAGE}
          x={-atlas.frames[REST_FRAME_INDEX].x}
          width={atlas.sheetWidth}
          height={atlas.sheetHeight}
        />
      </g>
      <path
        d="M105 75C115 73 131 74 144 76C142 82 137 87 132 90Q128 94 128 100C124 95 115 92 108 89Z"
        fill="#1C1917"
      />
      <CatPart items={face.face} />
      <g
        ref={eyesRef}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <SceneNodes items={[...face.eyes, ...face.pupils]} />
      </g>
    </>
  );
}
