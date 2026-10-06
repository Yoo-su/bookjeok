import { bookKeys, FeedbackType, User } from "@bookjeok/core";
import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { BookSearchResultList } from "@/features/book/components/book-search/book-search-result-list";
import { DefaultFooter } from "@/layouts/default-layout/default-footer";
import { Toaster } from "@/shared/components/shadcn/sonner";

import {
  FeedbackPreset,
  useFeedbackDialogStore,
} from "../../stores/use-feedback-dialog-store";
import { FeedbackDialog } from ".";

const SEARCH_QUERY = "급류";

const PREVIEW_USER = {
  id: 1,
  provider: "kakao",
  providerId: "preview",
  email: "reader@example.com",
  nickname: "미리보기",
  handle: "preview",
  profileImageUrl: null,
} as unknown as User;

// 로컬에 API가 없어 보내기는 실패 토스트로 끝난다. 검색 0건은 캐시로 채운다
const withProviders: Decorator = (Story) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(bookKeys.search(SEARCH_QUERY).queryKey, {
      pages: [{ items: [], currentPage: 1, isLastPage: true }],
      pageParams: [1],
    });
    return client;
  });
  useAuthStore.setState({ user: PREVIEW_USER });

  return (
    <QueryClientProvider client={queryClient}>
      <Story />
      <FeedbackDialog />
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
};

const OpenOnMount = ({ preset }: { preset?: FeedbackPreset }) => {
  useEffect(() => {
    useFeedbackDialogStore.getState().open(preset);
    return () => useFeedbackDialogStore.getState().close();
  }, [preset]);
  return null;
};

const meta = {
  title: "Features/Feedback/FeedbackDialog",
  decorators: [withProviders],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/ko/book/search",
        query: { q: SEARCH_QUERY },
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** 검색 결과 0건에서 「책 요청하기」를 눌렀을 때. 검색어가 제목에 들어가 있다 */
export const BookRequestFromSearch: Story = {
  name: "창 · 검색에서 책 요청",
  render: () => (
    <OpenOnMount
      preset={{ type: FeedbackType.BOOK_REQUEST, bookTitle: SEARCH_QUERY }}
    />
  ),
};

/** 푸터·프로필 메뉴에서 열었을 때의 첫 화면 */
export const Default: Story = {
  name: "창 · 기본",
  render: () => <OpenOnMount />,
};

export const Bug: Story = {
  name: "창 · 버그 제보",
  render: () => <OpenOnMount preset={{ type: FeedbackType.BUG }} />,
};

export const Suggestion: Story = {
  name: "창 · 기능 제안",
  render: () => <OpenOnMount preset={{ type: FeedbackType.SUGGESTION }} />,
};

/** 320px 기기에서 저자·출판사 두 칸이 나란히 들어가는지 */
export const NarrowMobile: Story = {
  ...BookRequestFromSearch,
  name: "창 · 좁은 모바일 (320px)",
  parameters: {
    viewport: {
      viewports: {
        narrow: { name: "320px", styles: { width: "320px", height: "640px" } },
      },
      defaultViewport: "narrow",
    },
  },
};

/** 여는 곳 ① 도서 검색 결과 0건. 버튼을 누르면 창이 열린다 */
export const EntrySearchNoResults: Story = {
  name: "여는 곳 · 검색 결과 없음",
  render: () => (
    <div className="mx-auto max-w-5xl p-6">
      <BookSearchResultList />
    </div>
  ),
};

/** 여는 곳 ② 푸터 「문의」 칸 */
export const EntryFooter: Story = {
  name: "여는 곳 · 푸터",
  render: () => (
    <div className="pt-24 bg-stone-50">
      <DefaultFooter />
    </div>
  ),
};
