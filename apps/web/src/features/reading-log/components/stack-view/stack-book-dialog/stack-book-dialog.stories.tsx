import { privateApiClient } from "@bookjeok/api-client";
import type { ReceivedKongsResponse, User } from "@bookjeok/core";
import { readingLogKeys } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AxiosAdapter } from "axios";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { Toaster } from "@/shared/components/shadcn/sonner";
import { gaegu } from "@/styles/fonts";

import { LONG_NAMES, sampleReceivedKongs } from "../../kong/lib/sample-kongs";
import { SAMPLE_BOOKS } from "../lib/sample-books";
import { StackBookDialog, type StackBookKong } from "./index";

const HANDLE = "reader01";
// 채식주의자. 한줄평이 있는 책
const BOOK = SAMPLE_BOOKS[2];

/** 로컬에 API가 없어 콩 보내기·보낸 목록 요청을 받는 어댑터를 갈아 끼움 */
const fakeAdapter =
  (sent: string[]): AxiosAdapter =>
  async (config) => {
    await new Promise((r) => setTimeout(r, 300));
    const url = config.url ?? "";
    let data: unknown = {};
    if (config.method === "post" && url.endsWith("/kongs")) {
      const logId = url.split("/")[2];
      const fresh = !sent.includes(logId);
      if (fresh) sent.push(logId);
      data = { logId, sent: fresh };
    } else if (url.endsWith("/kongs/sent")) {
      data = { logIds: [...sent] };
    }
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };

interface Args {
  kong: StackBookKong;
  loggedIn: boolean;
  sent: boolean;
  received?: ReceivedKongsResponse;
  isPublic: boolean;
}

function Harness({ kong, received, isPublic }: Args) {
  const [client] = useState(() => {
    const c = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    if (received)
      c.setQueryData(readingLogKeys.kongsReceived.queryKey, received);
    c.setQueryData(readingLogKeys.settings.queryKey, {
      isReadingLogPublic: isPublic,
    });
    return c;
  });
  const [open, setOpen] = useState(true);
  return (
    <QueryClientProvider client={client}>
      <div className={`${gaegu.variable} p-8`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm"
        >
          다시 열기
        </button>
        <StackBookDialog
          book={BOOK}
          open={open}
          belowMm={142}
          onOpenChange={setOpen}
          kong={kong}
        />
        <Toaster position="bottom-center" />
      </div>
    </QueryClientProvider>
  );
}

const meta: Meta<Args> = {
  title: "Features/ReadingLog/Stack/StackBookDialog",
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
  render: (args) => <Harness {...args} />,
  args: {
    kong: { owner: false, handle: HANDLE, nickname: "책벌레" },
    loggedIn: true,
    sent: false,
    isPublic: true,
  },
  beforeEach: ({ args }) => {
    useAuthStore.setState({
      user: args.loggedIn
        ? ({ id: 1, handle: "me", nickname: "미리보기" } as unknown as User)
        : null,
    });
    const original = privateApiClient.defaults.adapter;
    privateApiClient.defaults.adapter = fakeAdapter(
      args.sent ? [BOOK.logId] : [],
    );
    return () => {
      privateApiClient.defaults.adapter = original;
    };
  },
};

export default meta;
type Story = StoryObj<Args>;

/** 콩을 누르면 납작해졌다가 「콩!」 하고 표지 위로 날아가 앉는다 */
export const Visitor: Story = {};

/** 이미 보냈으면 표지 위 콩만. 누르면 바둥거린다 */
export const AlreadySent: Story = { args: { sent: true } };

/** 비로그인은 콩이 바둥거리며 로그인 말풍선을 띄운다 */
export const Guest: Story = { args: { loggedIn: false } };

/** 내 기록. 보내기 대신 받은 콩과 보낸 사람 */
export const Owner: Story = {
  args: {
    kong: { owner: true },
    received: (() => {
      const data = sampleReceivedKongs([5]);
      data.logs[0].logId = BOOK.logId;
      return data;
    })(),
  },
};

/** 내 기록인데 아직 콩이 없을 때 */
export const OwnerEmpty: Story = {
  args: { kong: { owner: true }, received: { total: 0, logs: [] } },
};

/** 비공개라 콩을 받을 수 없을 때 */
export const OwnerPrivate: Story = {
  args: {
    kong: { owner: true },
    received: { total: 0, logs: [] },
    isPublic: false,
  },
};

/** 한 기록에 콩이 아주 많고 닉네임이 길 때. 콩은 5알까지, 이름은 셋과 「외 N명」 */
export const OwnerMany: Story = {
  args: {
    kong: { owner: true },
    received: (() => {
      const data = sampleReceivedKongs([12345], LONG_NAMES);
      data.logs[0].logId = BOOK.logId;
      return data;
    })(),
  },
};
