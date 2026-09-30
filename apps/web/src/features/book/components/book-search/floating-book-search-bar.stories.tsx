import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";

import { FloatingBookSearchBar } from "./floating-book-search-bar";

/** 실제 헤더와 같은 여백·알약 모양의 목업 */
const MockHeader = () => (
  <header className="sticky top-0 z-50 w-full px-3 py-2.5 sm:px-4 sm:py-3">
    <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-stone-200/70 bg-white/90 px-4 py-2.5 shadow-[0_10px_40px_-12px_rgba(28,25,23,0.22)] backdrop-blur-xl sm:px-6">
      <span className="font-[family-name:var(--font-gowun-batang)] text-2xl">
        북적
      </span>
      <nav className="hidden gap-6 text-sm text-stone-500 lg:flex">
        <span>01 라운지</span>
        <span>02 독서기록</span>
        <span>03 책리뷰</span>
        <span>04 중고마켓</span>
        <span className="text-stone-900">05 책검색</span>
      </nav>
      <span className="size-9 rounded-full bg-stone-200" />
    </div>
  </header>
);

/** 채팅 토글 버튼 목업(fixed bottom-4 right-6, 56px) */
const MockChatButton = () => (
  <div className="fixed bottom-4 right-6 z-50 size-14 rounded-full bg-emerald-700 shadow-2xl" />
);

/** 음악 알약 목업(fixed bottom-6 left-6) */
const MockMusicPill = () => (
  <div className="fixed bottom-6 left-6 z-40 flex items-center gap-3 rounded-full border border-stone-800 bg-stone-900/95 py-2 pl-3 pr-2 text-white shadow-2xl">
    <span className="size-5 rounded-full border-2 border-emerald-400" />
    <div className="max-w-[130px] sm:max-w-[180px]">
      <p className="truncate text-xs font-semibold">비 오는 날의 재즈</p>
      <p className="truncate text-[10px] text-stone-400">Bookjeok Radio</p>
    </div>
    <span className="size-7 rounded-full bg-stone-800" />
  </div>
);

interface HarnessProps {
  hasChatButton: boolean;
  hasMusicPill: boolean;
}

const Harness = ({ hasChatButton, hasMusicPill }: HarnessProps) => {
  // 히어로 입력창이 보이면 숨기고, 목록 끝에서는 맨 위로 버튼만 남김
  const { ref: heroRef, inView: heroInView } = useInView({
    initialInView: true,
  });
  const { ref: endRef, inView: endInView } = useInView({
    rootMargin: "0px 0px -80px 0px",
  });

  return (
    <div className="min-h-dvh bg-white">
      <MockHeader />
      <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <div className="mb-8 flex h-[420px] flex-col justify-end gap-4 rounded-lg bg-stone-900 p-8 text-white">
          <p className="text-3xl">도서 검색</p>
          <div
            ref={heroRef}
            className="h-14 max-w-md rounded-lg bg-white/95 px-4 leading-[3.5rem] text-stone-400"
          >
            히어로 입력창 (지나가면 하단 알약 등장)
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {SAMPLE_BOOKS.map((book) => (
            <div key={book.isbn}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={book.image}
                alt=""
                className="aspect-[3/4] w-full rounded-md border border-stone-200 object-cover"
                style={{ backgroundColor: book.coverColor ?? undefined }}
              />
              <p className="mt-2 text-sm font-medium">{book.title}</p>
              <p className="text-xs text-stone-500">{book.author}</p>
            </div>
          ))}
        </div>
        <p className="py-10 text-center text-gray-500">
          모든 결과를 불러왔어요
        </p>
        <div ref={endRef} />
      </main>
      <footer className="border-t border-stone-200 bg-stone-50 px-6 py-12 text-center text-sm text-stone-500">
        <p>독서 기록 관리, 중고책 거래, 도서 리뷰 공유를 한 곳에서</p>
        <p className="mt-6">© 2026 bookjeok. 이용약관 · 개인정보처리방침</p>
      </footer>

      {hasChatButton && <MockChatButton />}
      {hasMusicPill && <MockMusicPill />}
      <FloatingBookSearchBar
        mode={heroInView ? "hidden" : endInView ? "top" : "search"}
        hasChatButton={hasChatButton}
        hasMusicPill={hasMusicPill}
      />
    </div>
  );
};

const meta: Meta<typeof Harness> = {
  title: "Book/FloatingBookSearchBar",
  component: Harness,
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  args: { hasChatButton: false, hasMusicPill: false },
};

export default meta;
type Story = StoryObj<typeof Harness>;

/** 비로그인: 하단에 검색 알약만 */
export const Default: Story = {};

/** 로그인: 모바일에서 채팅 버튼 자리를 비움 */
export const WithChatButton: Story = { args: { hasChatButton: true } };

/** 음악 재생 중: lg 미만에서 음악 알약 위로 올라감 */
export const WithChatAndMusic: Story = {
  args: { hasChatButton: true, hasMusicPill: true },
};
