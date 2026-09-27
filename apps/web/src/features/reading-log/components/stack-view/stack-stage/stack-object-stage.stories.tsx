import type { Meta, StoryObj } from "@storybook/react";
import { useMemo } from "react";

import { gaegu } from "@/styles/fonts";

import { useStackCopy } from "../hooks/use-stack-copy";
import { objectLadder } from "../lib/objects";
import { SAMPLE_BOOKS } from "../lib/sample-books";
import { buildStackScene, objectSceneHeight } from "../lib/scene";
import { SceneNodes } from "../lib/scene-svg";
import { stackStatus } from "../lib/status";
import type { FontRole, SceneColors } from "../lib/types";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number, weight: number, fam: FontRole) => {
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * size * 0.9;
  ctx.font = `${weight} ${size}px ${fam === "hand" ? gaegu.style.fontFamily : "sans-serif"}`;
  return ctx.measureText(text).width;
};

/** 사물 모드 무대. 책 권수로 쌓은 높이를 바꿔 다음 사물이 자동으로 바뀌는지 본다 */
function ObjectStage({
  count,
  width,
  height,
}: {
  count: number;
  width: number;
  height: number;
}) {
  const books = SAMPLE_BOOKS.slice(0, count);
  const stackMm = books.reduce((a, b) => a + b.depth, 0);
  const { next } = objectLadder(stackMm);
  // 서비스와 같은 문구로 그린다
  const { objectScene } = useStackCopy();
  // 무대는 폭에 맞춘 축척만큼만 높인다
  const h = next
    ? objectSceneHeight({
        width,
        books,
        stackMm,
        object: next,
        minHeight: 200,
        maxHeight: height,
      })
    : height;
  const scene = useMemo(() => {
    if (!next) return null;
    const { labels } = objectScene(stackMm, stackMm / books.length);
    return buildStackScene({
      width,
      height: h,
      books,
      stackMm,
      userMm: 1700,
      character: "M",
      status: stackStatus(stackMm, 1700),
      labels,
      colors: COLORS,
      measure,
      boil: true,
      object: next,
    });
  }, [books, stackMm, next, objectScene, width, h]);
  return (
    <figure className={`m-0 grid gap-1 ${gaegu.variable}`}>
      <div
        style={{ width, height: h }}
        className="rounded-2xl border border-stone-200 bg-white bg-[radial-gradient(#e2e0dd_1.1px,transparent_1.4px)] bg-[length:16px_16px]"
      >
        {scene && (
          <svg width={width} height={h} className="block overflow-hidden">
            <SceneNodes items={scene.items} />
          </svg>
        )}
      </div>
      <figcaption className="text-xs text-stone-500">
        {count}권 · {(stackMm / 10).toFixed(1)}cm · {width}×{h}
      </figcaption>
    </figure>
  );
}

/** counts: 보여 줄 권수들. 목표 바로 아래처럼 겹치기 쉬운 경우를 URL 인자로 넣어 본다 */
function Stages({
  width,
  height,
  counts = [2, 6, 14],
}: {
  width: number;
  height: number;
  counts?: number[];
}) {
  return (
    <div className="flex flex-wrap items-start gap-6 bg-stone-50 p-4">
      {counts.map((n) => (
        <ObjectStage key={n} count={n} width={width} height={height} />
      ))}
    </div>
  );
}

const meta: Meta<typeof Stages> = {
  title: "ReadingLog/StackObjectStage",
  component: Stages,
};

export default meta;
type Story = StoryObj<typeof Stages>;

/** 360px 폰. 카드 안쪽 여백을 빼면 무대 폭은 약 310px */
export const Phone360: Story = { args: { width: 310, height: 520 } };
export const Phone390: Story = { args: { width: 340, height: 520 } };
/** 데스크톱 무대(오른쪽 진행률 칸을 뺀 폭) */
export const Desktop: Story = { args: { width: 620, height: 600 } };
/** 목표 바로 아래(0.1~1.1cm 남음)라 쌓은 높이 이름표와 목표 이름표가 부딪히기 쉬운 권수 */
const NEAR_TARGET = [5, 10, 19, 25, 35];
export const NearTargetPhone: Story = {
  args: { width: 340, height: 520, counts: NEAR_TARGET },
};
export const NearTargetDesktop: Story = {
  args: { width: 620, height: 600, counts: NEAR_TARGET },
};
