import type { BookInfo, ChatRoom, User } from "@bookjeok/core";
import { chatKeys, type ReadingLog, readingLogKeys } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useBookSearchUiStore } from "@/features/book/stores/use-book-search-ui-store";
import { useRecentBookStore } from "@/features/book/stores/use-recent-book-store";
import { ChatWidget } from "@/features/chat/components/widgets/chat-widget";
import { useChatStore } from "@/features/chat/stores/use-chat-store";
import { useMusicStore } from "@/features/music";
import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";
import { useReadingLogViewStore } from "@/features/reading-log/stores/use-reading-log-view-store";

import { BottomDock } from ".";

/** 안 읽음 3건을 캐시에 미리 채움. 로컬에 API가 없어 요청하지 않게 */
const SeedChatRooms = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  useState(() =>
    queryClient.setQueryData<ChatRoom[]>(chatKeys.rooms.queryKey, [
      { id: 1, unreadCount: 2 } as ChatRoom,
      { id: 2, unreadCount: 1 } as ChatRoom,
    ]),
  );
  return children;
};

const Page = () => (
  <div className="min-h-[300vh] bg-stone-50">
    {/* 실제 헤더처럼 패널(z-45) 위에 있는 고정 헤더. 패널이 이 아래까지만 커지는지 확인 */}
    <header
      data-site-header
      className="sticky top-0 z-50 flex h-[72px] items-center border-b border-stone-200 bg-white px-6 text-sm font-semibold text-stone-500"
    >
      헤더
    </header>
    <main className="mx-auto max-w-5xl p-6">
      {Array.from({ length: 40 }, (_, i) => (
        <p key={i} className="py-4 text-stone-400">
          본문 {i + 1} — 300px을 넘기면 맨 위로가 dock 끝에 붙습니다. 모바일
          폭에서는 아래로 스크롤하면 dock이 숨습니다.
        </p>
      ))}
      <input
        placeholder="포커스하면 모바일에서 dock이 숨음"
        className="w-full rounded-md border border-stone-300 bg-white p-2 text-base"
      />
    </main>
    <BottomDock />
  </div>
);

const meta = {
  title: "Layout/BottomDock",
  component: Page,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/ko" } },
  },
  beforeEach: () => {
    useRecentBookStore.setState({
      recentBooks: SAMPLE_BOOKS.slice(0, 6) as unknown as BookInfo[],
    });
    useMusicStore.setState({ isPlaying: false, isModalOpen: false });
    useChatStore.setState({ isChatOpen: false });
    useBookSearchUiStore.setState({ isHeroSearchHidden: false });
  },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 비로그인: 최근 본 책만. 스크롤하면 맨 위로가 추가됨 */
export const Guest: Story = {};

/** 로그인: 채팅(안 읽음 배지)·최근 본 책 */
export const LoggedIn: Story = {
  decorators: [
    (Story) => (
      <SeedChatRooms>
        <Story />
      </SeedChatRooms>
    ),
  ],
  beforeEach: () => {
    useAuthStore.setState({
      user: { id: 1, nickname: "미리보기" } as unknown as User,
    });
  },
};

/** 음악 재생 중: 도는 음반이 추가됨. 누르면 플레이어 모달 */
export const MusicPlaying: Story = {
  ...LoggedIn,
  beforeEach: () => {
    useAuthStore.setState({
      user: { id: 1, nickname: "미리보기" } as unknown as User,
    });
    useMusicStore.setState({ isPlaying: true });
  },
};

/** 도서 검색: 히어로가 가려지면 맨 앞에 검색이 생기고, 누르면 입력창으로 펼침 */
export const BookSearch: Story = {
  ...LoggedIn,
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/ko/book/search" } },
  },
  beforeEach: () => {
    useAuthStore.setState({
      user: { id: 1, nickname: "미리보기" } as unknown as User,
    });
    useBookSearchUiStore.setState({ isHeroSearchHidden: true });
  },
};

/** 빈 채팅 목록. 패널 틀(데스크톱 카드·모바일 시트)만 확인 */
const SeedEmptyChat = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  useState(() =>
    queryClient.setQueryData<ChatRoom[]>(chatKeys.rooms.queryKey, []),
  );
  return children;
};

/** 채팅 패널: dock의 채팅을 누르면 데스크톱은 dock 위 카드, 모바일은 바텀시트 */
export const ChatPanel: Story = {
  render: () => (
    <SeedEmptyChat>
      <Page />
      <ChatWidget />
    </SeedEmptyChat>
  ),
  beforeEach: () => {
    useAuthStore.setState({
      user: { id: 1, nickname: "미리보기" } as unknown as User,
    });
  },
};

/** 이번 달·지난달 기록과 올해 키재기를 캐시에 채움. 하루 여러 권(+N)·빈 날·오늘·미래가 다 보이게 */
const SeedReading = ({
  children,
  copies = 1,
}: {
  children: React.ReactNode;
  /** 예시 46권을 몇 벌 쌓을지. 다독가 확인용 */
  copies?: number;
}) => {
  const queryClient = useQueryClient();
  useState(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const days = [1, 1, 2, 4, 4, 4, 7, 9, 12, 12, 15, 18, 21, 23, 26, 28];
    const seedMonth = (d: Date, lastDay: number, offset: number) => {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const logs = days
        .filter((day) => day <= lastDay)
        .map((day, i) => {
          const b = SAMPLE_BOOKS[(i + offset) % SAMPLE_BOOKS.length];
          return {
            id: `log-${month}-${i}`,
            isbn: b.isbn,
            date: `${year}-${pad(month)}-${pad(day)}`,
            book: { isbn: b.isbn, title: b.title, image: b.image },
          };
        }) as unknown as ReadingLog[];
      queryClient.setQueryData(
        readingLogKeys.list({ year, month }).queryKey,
        logs,
      );
    };
    seedMonth(now, now.getDate(), 0);
    seedMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1), 31, 16);
    queryClient.setQueryData(readingLogKeys.stack(now.getFullYear()).queryKey, {
      year: now.getFullYear(),
      items: Array.from({ length: copies }, (_, c) =>
        SAMPLE_BOOKS.map((b) => ({ ...b, logId: `${b.logId}-${c}` })),
      ).flat(),
    });
    return null;
  });
  return children;
};

/** 기록 달력·키재기 패널: 로그인 상태에서 dock의 달력·자 아이콘 */
export const ReadingPanels: Story = {
  decorators: [
    (Story) => (
      <SeedReading>
        <Story />
      </SeedReading>
    ),
  ],
  beforeEach: () => {
    useAuthStore.setState({
      user: { id: 1, nickname: "미리보기" } as unknown as User,
    });
  },
};

/** 독서기록 페이지: 달력·키재기는 패널 대신 페이지 보기를 바꾸고, 지금 보기에 점이 붙음 */
export const OnReadingLogPage: Story = {
  ...ReadingPanels,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/ko/my-page/reading-log" },
    },
  },
  beforeEach: () => {
    useAuthStore.setState({
      user: { id: 1, nickname: "미리보기" } as unknown as User,
    });
    useReadingLogViewStore.setState({ viewMode: "calendar" });
  },
};

/** 다독가: 140권(약 3m, 주 3권 꼴). 키재기 패널에서 쌓은 책이 어떻게 줄어드는지 */
export const HeavyReader: Story = {
  ...ReadingPanels,
  decorators: [
    (Story) => (
      <SeedReading copies={3}>
        <Story />
      </SeedReading>
    ),
  ],
};

/** 극단: 322권(약 6.7m) */
export const ExtremeReader: Story = {
  ...ReadingPanels,
  decorators: [
    (Story) => (
      <SeedReading copies={7}>
        <Story />
      </SeedReading>
    ),
  ],
};
