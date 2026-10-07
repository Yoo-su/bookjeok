import type { ReceivedKongsResponse } from "@bookjeok/core";
import { readingLogKeys } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LONG_NAMES, sampleReceivedKongs } from "../../kong/lib/sample-kongs";
import { ReadingLogHero } from "./index";

/** 공개 설정과 받은 콩을 시드한다. 레이아웃 main처럼 max-w-5xl·p-4 안에 둔다 */
function withData(kongs: ReceivedKongsResponse, isPublic = true) {
  return function Decorator(Story: () => React.ReactElement) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(readingLogKeys.kongsReceived.queryKey, kongs);
    client.setQueryData(readingLogKeys.settings.queryKey, {
      isReadingLogPublic: isPublic,
    });
    return (
      <QueryClientProvider client={client}>
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
          <Story />
        </div>
      </QueryClientProvider>
    );
  };
}

const meta: Meta<typeof ReadingLogHero> = {
  title: "Features/ReadingLog/ReadingLogHero",
  component: ReadingLogHero,
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
  args: { currentDate: new Date(2026, 9, 7), onOpenDate: () => {} },
};

export default meta;
type Story = StoryObj<typeof ReadingLogHero>;

/** 받은 콩은 우상단 모서리에 붙은 스티커. 누르면 종지 */
export const WithKongs: Story = {
  decorators: [withData(sampleReceivedKongs([5, 4, 3]))],
};

/** 아직 없으면 자는 콩만 둔 동그라미. 누르면 「콩이란?」 */
export const Empty: Story = {
  decorators: [withData({ total: 0, logs: [] })],
};

/** 비공개면 콩을 받을 수 없어 빈 동그라미를 숨긴다 */
export const PrivateEmpty: Story = {
  decorators: [withData({ total: 0, logs: [] }, false)],
};

/** 비공개로 돌려도 이미 받은 콩은 보인다 */
export const PrivateWithKongs: Story = {
  decorators: [withData(sampleReceivedKongs([2, 1]), false)],
};

/** 수가 클 때 알약이 길어져도 제목과 겹치지 않는지 */
export const Many: Story = {
  decorators: [
    withData(
      sampleReceivedKongs(
        [12345, 2048, 512, ...Array.from({ length: 20 }, (_, i) => 30 - i)],
        LONG_NAMES,
      ),
    ),
  ],
};
