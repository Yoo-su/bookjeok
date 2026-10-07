import type { ReadingStackBook } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { useMemo } from "react";

import { gaegu } from "@/styles/fonts";

import { useStackCopy } from "../hooks/use-stack-copy";
import { SAMPLE_BOOKS } from "../lib/sample-books";
import { buildStackScene } from "../lib/scene";
import { SceneNodes } from "../lib/scene-svg";
import { stackStatus } from "../lib/status";
import type { FontRole, SceneColors, StackReaderCharacter } from "../lib/types";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

/** 입력 전 기본 키(남 173·여 161cm)와 같다 */
const USER_MM: Record<StackReaderCharacter, number> = { M: 1730, F: 1610 };

/** 쌓은 높이 ÷ 키. 표정이 calm → happy → yay → wow로 바뀌는 구간을 하나씩 짚는다 */
const RATIOS = [0.15, 0.4, 0.7, 0.95, 1.12];

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number, weight: number, fam: FontRole) => {
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * size * 0.9;
  ctx.font = `${weight} ${size}px ${fam === "hand" ? gaegu.style.fontFamily : "sans-serif"}`;
  return ctx.measureText(text).width;
};

/** 목표 높이를 넘을 때까지 샘플 책을 쌓는다. 모자라면 처음부터 다시 쌓는다 */
function booksUpTo(targetMm: number) {
  const books: ReadingStackBook[] = [];
  let mm = 0;
  for (let i = 0; mm < targetMm; i++) {
    const b = SAMPLE_BOOKS[i % SAMPLE_BOOKS.length];
    books.push({ ...b, logId: `${b.logId}-${i}` });
    mm += b.depth;
  }
  return { books, stackMm: mm };
}

/** 사람 모드 무대 한 칸. 서비스와 같은 장면 함수·문구로 그린다 */
function Situation({
  character,
  ratio,
  width,
  height,
  boil,
}: {
  character: StackReaderCharacter;
  ratio: number;
  width: number;
  height: number;
  boil: boolean;
}) {
  const userMm = USER_MM[character];
  const { sceneLabels } = useStackCopy();
  const { books, stackMm } = useMemo(
    () => booksUpTo(ratio * userMm),
    [ratio, userMm],
  );
  const status = useMemo(() => stackStatus(stackMm, userMm), [stackMm, userMm]);
  const scene = useMemo(
    () =>
      buildStackScene({
        width,
        height,
        books,
        stackMm,
        userMm,
        character,
        status,
        labels: sceneLabels({
          status,
          stackMm,
          userMm,
          avgDepthMm: stackMm / books.length,
          authorName: null,
        }),
        colors: COLORS,
        measure,
        boil,
      }),
    [
      width,
      height,
      books,
      stackMm,
      userMm,
      character,
      status,
      sceneLabels,
      boil,
    ],
  );
  return (
    <figure className={`m-0 grid gap-1 ${gaegu.variable}`}>
      <div
        style={{ width, height }}
        className="rounded-2xl border border-stone-200 bg-white bg-[radial-gradient(#e2e0dd_1.1px,transparent_1.4px)] bg-[length:16px_16px]"
      >
        <svg width={width} height={height} className="block overflow-hidden">
          <SceneNodes items={scene.items} />
        </svg>
      </div>
      <figcaption className="text-xs text-stone-500">
        {character} · {status.mood} · {(stackMm / 10).toFixed(1)}cm /{" "}
        {userMm / 10}cm ({Math.round(status.ratio * 100)}%)
      </figcaption>
    </figure>
  );
}

/** 기본 남녀 캐릭터가 쌓은 높이에 따라 무대에서 어떻게 보이는지 한 화면에 모은다 */
function Situations({
  width,
  height,
  boil,
  characters,
}: {
  width: number;
  height: number;
  boil: boolean;
  characters: StackReaderCharacter[];
}) {
  return (
    <div className="grid gap-8 bg-stone-50 p-4">
      {characters.map((c) => (
        <div key={c} className="flex flex-wrap items-start gap-6">
          {RATIOS.map((r) => (
            <Situation
              key={r}
              character={c}
              ratio={r}
              width={width}
              height={height}
              boil={boil}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const meta: Meta<typeof Situations> = {
  title: "Features/ReadingLog/Stack/StackReaderSituations",
  component: Situations,
  args: { boil: true, characters: ["M", "F"] },
};

export default meta;
type Story = StoryObj<typeof Situations>;

/** 360px 폰. 카드 안쪽 여백을 빼면 무대 폭은 약 310px */
export const Phone360: Story = { args: { width: 310, height: 520 } };
/** 데스크톱 무대(오른쪽 진행률 칸을 뺀 폭) */
export const Desktop: Story = { args: { width: 620, height: 600 } };
/** 남자만 */
export const Male: Story = {
  args: { width: 310, height: 520, characters: ["M"] },
};
/** 여자만 */
export const Female: Story = {
  args: { width: 310, height: 520, characters: ["F"] },
};
