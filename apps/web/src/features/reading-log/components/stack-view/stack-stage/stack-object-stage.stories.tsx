import type { Meta, StoryObj } from "@storybook/react";
import { useMemo } from "react";

import { gaegu } from "@/styles/fonts";

import { cm1 } from "../hooks/use-stack-copy";
import { objectLadder } from "../lib/objects";
import { SAMPLE_BOOKS } from "../lib/sample-books";
import { buildStackScene, objectSceneHeight } from "../lib/scene";
import { SceneNodes } from "../lib/scene-svg";
import { stackStatus } from "../lib/status";
import type { FontRole, SceneColors, StackObject } from "../lib/types";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

const NAMES: Record<StackObject, string> = {
  sugar: "각설탕",
  eraser: "지우개",
  egg: "달걀",
  hamster: "햄스터",
  pencil: "연필 한 자루",
  soju: "소주병",
  dachshund: "닥스훈트",
  bowlingPin: "볼링핀",
  extinguisher: "소화기",
  adelie: "아델리펭귄",
  emperor: "황제펭귄",
  hoop: "농구 골대",
  giraffe: "기린",
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
  const { next, passed } = objectLadder(stackMm);
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
    const remain = Math.max(1, Math.ceil((next.heightMm - stackMm) / 10));
    return buildStackScene({
      width,
      height: h,
      books,
      stackMm,
      userMm: 1700,
      character: "M",
      status: stackStatus(stackMm, 1700),
      labels: {
        myHeight: `${NAMES[next.id]} 약 ${next.heightMm / 10}cm`,
        myHeightShort: `약 ${next.heightMm / 10}cm`,
        remain: `${remain}cm 남음`,
        approxBooks: `약 ${Math.ceil((next.heightMm - stackMm) / 15)}권`,
        stackHeight: `${cm1(stackMm)}cm`,
        bubble: [
          `${remain}cm만 더!`,
          passed ? `${NAMES[passed.id]}는 넘었다!` : "이제 시작!",
        ],
      },
      colors: COLORS,
      measure,
      boil: true,
      object: next,
    });
  }, [books, stackMm, next, passed, width, h]);
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
        {count}권 · {cm1(stackMm)}cm · {width}×{h}
      </figcaption>
    </figure>
  );
}

function Stages({ width, height }: { width: number; height: number }) {
  return (
    <div className="flex flex-wrap items-start gap-6 bg-stone-50 p-4">
      {[2, 6, 14].map((n) => (
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
