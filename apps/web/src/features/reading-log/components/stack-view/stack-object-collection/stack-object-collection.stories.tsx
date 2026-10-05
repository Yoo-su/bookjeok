import type { Meta, StoryObj } from "@storybook/react";

import { SAMPLE_BOOKS } from "../lib/sample-books";
import { StackObjectCollection } from "./index";

/** 다 모은 해: 예시 책을 날짜를 바꿔 여러 번 쌓는다 */
const MANY = Array.from({ length: 400 }, (_, i) => {
  const b = SAMPLE_BOOKS[i % SAMPLE_BOOKS.length];
  const month = String(1 + Math.floor((i / 400) * 12)).padStart(2, "0");
  const day = String(1 + (i % 28)).padStart(2, "0");
  return { ...b, logId: `many-${i}`, date: `2026-${month}-${day}` };
});

function Demo({ count }: { count: number }) {
  const books =
    count <= SAMPLE_BOOKS.length
      ? SAMPLE_BOOKS.slice(0, count)
      : MANY.slice(0, count);
  return (
    <div className="min-h-[900px] bg-stone-100">
      <StackObjectCollection
        open
        onOpenChange={() => {}}
        year={2026}
        books={books}
      />
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "ReadingLog/StackObjectCollection",
  component: Demo,
};

export default meta;
type Story = StoryObj<typeof Demo>;

export const Empty: Story = { args: { count: 0 } };
/** 몇 권 읽은 대부분의 사용자 */
export const Few: Story = { args: { count: 4 } };
export const Half: Story = { args: { count: 18 } };
export const All: Story = { args: { count: 400 } };
