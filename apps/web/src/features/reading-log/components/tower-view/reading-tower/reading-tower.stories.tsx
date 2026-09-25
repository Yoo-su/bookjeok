import type { ReadingTowerBook, ReadingTowerResponse } from "@bookjeok/core";
import { readingLogKeys } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { gaegu } from "@/styles/fonts";

import { ReadingTower } from "./index";
import { SAMPLE_BOOKS as SAMPLE } from "./stories-data";

/** 10/30 이후 신간처럼 크기·표지색이 없는 책을 섞는다 */
const WITH_ESTIMATED = SAMPLE.map((b, i) =>
  i % 5 === 0
    ? { ...b, coverColor: null, sizeSource: "estimated" as const, pages: null }
    : b,
);

/** 다독가: 300권 */
const MANY = Array.from({ length: 300 }, (_, i) => {
  const b = SAMPLE[i % SAMPLE.length];
  const day = String(1 + (i % 28)).padStart(2, "0");
  const month = String(1 + Math.floor((i / 300) * 12)).padStart(2, "0");
  return { ...b, logId: `many-${i}`, date: `2026-${month}-${day}` };
});

function withTower(items: ReadingTowerBook[] | "error") {
  return function Decorator(Story: () => React.ReactElement) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    if (items === "error") {
      client.setQueryDefaults(readingLogKeys.tower(2026).queryKey, {
        queryFn: () => Promise.reject(new Error("offline")),
      });
    } else {
      const data: ReadingTowerResponse = { year: 2026, items };
      client.setQueryData(readingLogKeys.tower(2026).queryKey, data);
    }
    return (
      <QueryClientProvider client={client}>
        <div
          className={`${gaegu.variable} mx-auto w-full max-w-5xl p-4 sm:p-6`}
        >
          <Story />
        </div>
      </QueryClientProvider>
    );
  };
}

const meta: Meta<typeof ReadingTower> = {
  title: "ReadingLog/ReadingTower",
  component: ReadingTower,
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
  args: { year: 2026 },
};

export default meta;
type Story = StoryObj<typeof ReadingTower>;

export const Default: Story = { decorators: [withTower(SAMPLE)] };
export const EstimatedSizes: Story = {
  decorators: [withTower(WITH_ESTIMATED)],
};
export const ManyBooks: Story = { decorators: [withTower(MANY)] };
export const Empty: Story = { decorators: [withTower([])] };
export const LoadError: Story = { decorators: [withTower("error")] };
