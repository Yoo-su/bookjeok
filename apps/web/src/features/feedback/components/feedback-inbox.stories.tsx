import {
  AdminFeedback,
  feedbackKeys,
  FeedbackStatus,
  FeedbackType,
  MyFeedback,
  Notification,
  NotificationType,
  User,
} from "@bookjeok/core";
import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { NotificationItem } from "@/features/notification/components/notification-popover/notification-item";
import { Toaster } from "@/shared/components/shadcn/sonner";
import { MyFeedbackView } from "@/views/my-feedback-view";

import { AdminFeedbackEditDialog } from "./admin-feedback-edit-dialog";
import { AdminFeedbackList } from "./admin-feedback-list";

const now = Date.now();
const daysAgo = (days: number) =>
  new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

const MY_ITEMS: MyFeedback[] = [
  {
    id: 12,
    type: FeedbackType.BOOK_REQUEST,
    status: FeedbackStatus.DONE,
    content: "",
    book: { title: "급류", author: "정대건", publisher: "민음사" },
    reply: "넣어 두었어요. 이제 검색하면 나와요. 알려 주셔서 고마워요!",
    repliedAt: daysAgo(1),
    createdAt: daysAgo(3),
  },
  {
    id: 9,
    type: FeedbackType.BUG,
    status: FeedbackStatus.IN_PROGRESS,
    content:
      "독서 키재기에서 책을 20권 넘게 쌓으면 캐릭터 말풍선이 화면 밖으로 나가요.\n아이폰 13 사파리입니다.",
    book: null,
    reply: null,
    repliedAt: null,
    createdAt: daysAgo(5),
  },
  {
    id: 4,
    type: FeedbackType.SUGGESTION,
    status: FeedbackStatus.WONT_FIX,
    content: "리뷰에 별점 대신 10점 만점 점수를 쓸 수 있으면 좋겠어요.",
    book: null,
    reply:
      "좋은 제안 고마워요. 다른 분들의 리뷰와 비교하기 쉽도록 당분간은 별점을 유지하려고 해요.",
    repliedAt: daysAgo(8),
    createdAt: daysAgo(10),
  },
];

const withUser = (
  item: MyFeedback,
  overrides: Partial<AdminFeedback> = {},
): AdminFeedback => ({
  ...item,
  user: { id: 3, nickname: "책벌레", handle: "bookworm" },
  pagePath: "/ko/book/search?q=%EA%B8%89%EB%A5%98",
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  adminNote: null,
  updatedAt: item.createdAt,
  ...overrides,
});

const ADMIN_ITEMS: AdminFeedback[] = [
  withUser({
    ...MY_ITEMS[0],
    id: 15,
    status: FeedbackStatus.RECEIVED,
    reply: null,
    repliedAt: null,
    book: {
      title: "이처럼 사소한 것들",
      author: "클레어 키건",
      publisher: null,
    },
    content: "영화 보고 원작이 궁금해졌어요.",
    createdAt: daysAgo(0),
  }),
  withUser(
    { ...MY_ITEMS[1], id: 14, status: FeedbackStatus.RECEIVED },
    { adminNote: "재현됨. 말풍선 위치 계산 확인 필요" },
  ),
  withUser(
    {
      ...MY_ITEMS[2],
      id: 13,
      status: FeedbackStatus.RECEIVED,
      reply: null,
      repliedAt: null,
      type: FeedbackType.OTHER,
      content: "중고거래 직거래 장소를 지도에서 고를 수 있나요?",
    },
    { user: null, pagePath: null },
  ),
];

const PREVIEW_ADMIN = {
  id: 1,
  provider: "kakao",
  providerId: "preview",
  email: null,
  nickname: "운영자",
  handle: "admin",
  profileImageUrl: null,
  role: "ADMIN",
} as unknown as User;

// 로컬 API가 없어 목록은 캐시로 채운다. 저장은 실패 토스트로 끝난다
const withProviders: Decorator = (Story) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(feedbackKeys.my.queryKey, {
      pages: [{ items: MY_ITEMS, nextCursor: null }],
      pageParams: [undefined],
    });
    client.setQueryData(
      feedbackKeys.admin({ status: FeedbackStatus.RECEIVED }).queryKey,
      {
        pages: [{ items: ADMIN_ITEMS, nextCursor: null }],
        pageParams: [undefined],
      },
    );
    return client;
  });
  useAuthStore.setState({ user: PREVIEW_ADMIN });

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <Story />
      </div>
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
};

const meta = {
  title: "Feedback/FeedbackInbox",
  decorators: [withProviders],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/ko/my-page/feedback" },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** 마이페이지 「나의 문의」. 답변 완료·확인 중·반영 안 함 */
export const MyFeedback_: Story = {
  name: "나의 문의",
  render: () => <MyFeedbackView />,
};

/** 운영자 목록. 기본 필터는 접수됨 */
export const AdminList: Story = {
  name: "운영자 · 문의 목록",
  render: () => <AdminFeedbackList />,
};

/** 운영자 처리 창. 답변을 쓰면 알림이 간다고 알려 준다 */
export const AdminEdit: Story = {
  name: "운영자 · 처리 창",
  render: () => (
    <AdminFeedbackEditDialog feedback={ADMIN_ITEMS[0]} onClose={() => {}} />
  ),
};

/** 알림 목록에 뜨는 답변 알림. 행위자 대신 북적 로고·이름 */
export const ReplyNotification: Story = {
  name: "답변 알림",
  render: () => (
    <div className="w-[360px] rounded-xl border bg-white">
      <NotificationItem
        notification={
          {
            id: 1,
            recipientId: 3,
            actorId: null,
            type: NotificationType.FEEDBACK_REPLIED,
            metadata: { feedbackId: 12, feedbackType: FeedbackType.OTHER },
            isRead: false,
            createdAt: daysAgo(0),
          } satisfies Notification
        }
      />
    </div>
  ),
};
