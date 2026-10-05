import type { ReadingStackBook } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { stackMilestone } from "../lib/collection";
import { SAMPLE_BOOKS } from "../lib/sample-books";
import { StackObjectCollection } from "../stack-object-collection";
import { StackMilestoneDialog } from "./index";

type Kind = "object-top" | "object-inserted" | "part" | "over";

const sum = (books: ReadingStackBook[]) =>
  books.reduce((a, b) => a + b.depth, 0);

/** 내 키를 넘는 장면까지 쌓으려고 예시 책을 날짜 순서대로 되풀이한다 */
const POOL: ReadingStackBook[] = Array.from({ length: 160 }, (_, i) => ({
  ...SAMPLE_BOOKS[i % SAMPLE_BOOKS.length],
  logId: `pool-${i}`,
}));

/**
 * 예시 책에서 장면을 고른다. 맨 위 책이 사물을 넘는 권수, 사이에 낀 책이 사물을 넘기는 권수,
 * 몸 부위·내 키를 넘는 권수를 찾는다
 */
function scenario(kind: Kind, userMm: number) {
  for (let n = 4; n <= POOL.length; n++) {
    const books = POOL.slice(0, n);
    const total = sum(books);
    const pick =
      kind === "object-inserted" ? books[Math.floor(n / 2)] : books[n - 1];
    const m = stackMilestone(total - pick.depth, total, userMm);
    if (!m) continue;
    if ((kind === "object-top" || kind === "object-inserted") && n < 8)
      continue;
    if (kind.startsWith("object") && m.kind !== "object") continue;
    if (kind === "part" && m.kind !== "part") continue;
    if (kind === "over" && m.kind !== "over") continue;
    return { books, logId: pick.logId, milestone: m };
  }
  throw new Error(`장면을 찾지 못함: ${kind}`);
}

function Demo({
  kind,
  userMm,
  character,
}: {
  kind: Kind;
  userMm: number;
  character: "M" | "F";
}) {
  const [run, setRun] = useState(0);
  const [open, setOpen] = useState(true);
  const [collection, setCollection] = useState(false);
  const s = scenario(kind, userMm);
  return (
    <div className="grid min-h-[760px] place-items-start gap-3 bg-stone-100 p-6">
      <button
        type="button"
        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold"
        onClick={() => {
          setOpen(true);
          setRun((r) => r + 1);
        }}
      >
        다시 보기
      </button>
      <StackMilestoneDialog
        key={run}
        open={open}
        onOpenChange={setOpen}
        books={s.books}
        logId={s.logId}
        milestone={s.milestone}
        userMm={userMm}
        character={character}
        onOpenCollection={() => {
          setOpen(false);
          setCollection(true);
        }}
        onViewStack={() => setOpen(false)}
      />
      <StackObjectCollection
        open={collection}
        onOpenChange={setCollection}
        year={2026}
        books={s.books}
      />
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "ReadingLog/StackMilestoneDialog",
  component: Demo,
  args: { userMm: 1700, character: "F" },
};

export default meta;
type Story = StoryObj<typeof Demo>;

/** 오늘 날짜로 기록해 맨 위에 떨어진 책이 사물을 넘는다 */
export const ObjectOnTop: Story = { args: { kind: "object-top" } };
/** 지난 날짜로 기록해 사이에 낀 책이 사물을 넘긴다. 위 책들이 들리며 옆에서 밀려 들어간다 */
export const ObjectInserted: Story = { args: { kind: "object-inserted" } };
/** 사물 대신 몸 부위를 넘었다 */
export const BodyPart: Story = { args: { kind: "part", character: "M" } };
/** 내 키를 넘었다 */
export const OverHeight: Story = { args: { kind: "over" } };
