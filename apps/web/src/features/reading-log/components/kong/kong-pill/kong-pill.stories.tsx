import type { ReceivedKongsResponse } from "@bookjeok/core";
import { readingLogKeys } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { gaegu } from "@/styles/fonts";

import { sampleReceivedKongs } from "../lib/sample-kongs";
import { KongPill } from "./index";

/** 독서기록 hero처럼 계절 사진 위에 얹는다 */
function withHero(data: ReceivedKongsResponse) {
  return function Decorator(Story: () => React.ReactElement) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(readingLogKeys.kongsReceived.queryKey, data);
    return (
      <QueryClientProvider client={client}>
        <div
          className={`${gaegu.variable} relative flex h-[420px] items-end justify-end overflow-hidden bg-stone-900 bg-[url(/images/season/fall1.jpg)] bg-cover bg-center p-8`}
        >
          <div className="absolute inset-0 bg-linear-to-t from-stone-900/90 via-stone-900/40 to-transparent" />
          <div className="relative">
            <Story />
          </div>
        </div>
      </QueryClientProvider>
    );
  };
}

const meta: Meta<typeof KongPill> = {
  title: "Features/ReadingLog/Kong/KongPill",
  component: KongPill,
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
  args: { onOpenDate: () => {} },
};

export default meta;
type Story = StoryObj<typeof KongPill>;

/** 받은 콩이 있으면 종지가 열린다 */
export const WithKongs: Story = {
  decorators: [withHero(sampleReceivedKongs([5, 4, 3]))],
};

/** 종지가 수북할 때. 30알까지 그리고 그 위로는 수만 늘어난다 */
export const FullBowl: Story = {
  decorators: [withHero(sampleReceivedKongs([7, 7, 6, 5, 4, 3, 2]))],
};

/** 아직 없으면 자는 콩. 누르면 「콩이란?」 */
export const Empty: Story = {
  decorators: [withHero({ total: 0, logs: [] })],
};
