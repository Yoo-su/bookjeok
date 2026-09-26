import type { ReadingStackBook, ReadingStackResponse } from "@bookjeok/core";
import { readingLogKeys } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { gaegu } from "@/styles/fonts";

import { SAMPLE_BOOKS } from "../lib/sample-books";
import { PublicReadingStack } from "./index";

const HANDLE = "user_story01";

function withPublicStack(byYear: Record<number, ReadingStackBook[]>) {
  return function Decorator(Story: () => React.ReactElement) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    for (const [year, items] of Object.entries(byYear)) {
      const data: ReadingStackResponse = { year: Number(year), items };
      client.setQueryData(
        readingLogKeys.publicStack(HANDLE, Number(year)).queryKey,
        data,
      );
    }
    return (
      <QueryClientProvider client={client}>
        <div
          className={`${gaegu.variable} mx-auto w-full max-w-4xl p-4 sm:p-6`}
        >
          <Story />
        </div>
      </QueryClientProvider>
    );
  };
}

const meta: Meta<typeof PublicReadingStack> = {
  title: "ReadingLog/PublicReadingStack",
  component: PublicReadingStack,
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
  args: { handle: HANDLE, nickname: "책벌레", initialYear: 2026 },
};

export default meta;
type Story = StoryObj<typeof PublicReadingStack>;

/** 46권. 캐릭터 없이 쌓은 책만, 축척은 쌓은 높이에 맞춘다 */
export const Default: Story = {
  decorators: [withPublicStack({ 2026: SAMPLE_BOOKS, 2025: [] })],
};

/** 몇 권뿐이어도 바닥에 붙지 않는다 */
export const FewBooks: Story = {
  decorators: [withPublicStack({ 2026: SAMPLE_BOOKS.slice(0, 3) })],
};

export const EmptyYear: Story = {
  decorators: [withPublicStack({ 2026: [] })],
};
