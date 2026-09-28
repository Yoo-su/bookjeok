import {
  AdminFeedback,
  FeedbackStatus,
  FeedbackType,
  MyFeedback,
  Notification,
  NotificationType,
} from "@bookjeok/core";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getNotificationLink,
  getNotificationMessageParams,
  isSystemNotification,
} from "@/features/notification/utils";
import ko from "@/shared/i18n/messages/ko.json";
import { AdminFeedbackView } from "@/views/admin-feedback-view";

import { AdminFeedbackEditDialog } from "../components/admin-feedback-edit-dialog";
import { MyFeedbackList } from "../components/my-feedback-list";

const mockUpdate = vi.fn();
const mockAdminQuery = vi.fn();
let mockMyItems: MyFeedback[] = [];
let mockRole: "USER" | "ADMIN" = "USER";

vi.mock("@bookjeok/react-query", () => ({
  useMyFeedbackInfiniteQuery: () => ({
    data: { pages: [{ items: mockMyItems, nextCursor: null }] },
    isLoading: false,
    isError: false,
    hasNextPage: false,
  }),
  useAdminFeedbackInfiniteQuery: (...args: unknown[]) => {
    mockAdminQuery(...args);
    return {
      data: { pages: [{ items: [], nextCursor: null }] },
      isLoading: false,
      isError: false,
      hasNextPage: false,
    };
  },
  useUpdateFeedbackMutation: () => ({ mutate: mockUpdate, isPending: false }),
}));

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: (
    selector: (s: { user: { id: number; role: string } }) => unknown,
  ) => selector({ user: { id: 1, role: mockRole } }),
}));

vi.mock("@/features/auth/components/guards/auth-guard", () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/feedback-button", () => ({
  FeedbackButton: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations:
    (namespace: string) => (key: string, params?: Record<string, unknown>) => {
      const value = `${namespace}.${key}`
        .split(".")
        .reduce<unknown>(
          (node, part) => (node as Record<string, unknown>)?.[part],
          ko,
        );
      return typeof value === "string"
        ? value.replace(/\{(\w+)\}/g, (_, name) => String(params?.[name]))
        : key;
    },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const myFeedback = (overrides: Partial<MyFeedback> = {}): MyFeedback => ({
  id: 5,
  type: FeedbackType.BOOK_REQUEST,
  status: FeedbackStatus.RECEIVED,
  content: "신간이에요",
  book: { title: "급류", author: "정대건", publisher: null },
  reply: null,
  repliedAt: null,
  createdAt: "2026-09-28T01:00:00.000Z",
  ...overrides,
});

const adminFeedback = (
  overrides: Partial<AdminFeedback> = {},
): AdminFeedback => ({
  ...myFeedback(),
  user: { id: 1, nickname: "독자", handle: "reader" },
  pagePath: "/ko/book/search?q=급류",
  userAgent: "Mozilla/5.0",
  adminNote: null,
  updatedAt: "2026-09-28T01:00:00.000Z",
  ...overrides,
});

describe("나의 문의", () => {
  beforeEach(() => vi.clearAllMocks());

  it("답변이 있으면 답변을, 없으면 답변 대기 안내를 보인다", () => {
    mockMyItems = [
      myFeedback({
        id: 1,
        status: FeedbackStatus.DONE,
        reply: "넣어 두었어요.",
        repliedAt: "2026-09-29T01:00:00.000Z",
      }),
      myFeedback({
        id: 2,
        book: null,
        type: FeedbackType.BUG,
        content: "버그",
      }),
    ];

    render(<MyFeedbackList />);

    expect(screen.getByText("넣어 두었어요.")).toBeInTheDocument();
    expect(screen.getByText("반영 완료")).toBeInTheDocument();
    expect(screen.getByText(ko.feedback.my.reply_waiting)).toBeInTheDocument();
    expect(screen.getByText("급류")).toBeInTheDocument();
  });

  it("보낸 문의가 없으면 빈 화면과 문의 버튼을 보인다", () => {
    mockMyItems = [];

    render(<MyFeedbackList />);

    expect(screen.getByText(ko.feedback.my.empty_title)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: ko.feedback.open }),
    ).toBeInTheDocument();
  });
});

describe("운영자 문의 관리", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ADMIN이 아니면 목록을 부르지 않고 안내만 보인다", () => {
    mockRole = "USER";

    render(<AdminFeedbackView />);

    expect(screen.getByText(ko.feedback.admin.forbidden)).toBeInTheDocument();
    expect(mockAdminQuery).not.toHaveBeenCalled();
  });

  it("ADMIN은 접수됨 문의부터 본다", () => {
    mockRole = "ADMIN";

    render(<AdminFeedbackView />);

    expect(mockAdminQuery).toHaveBeenCalledWith({
      status: FeedbackStatus.RECEIVED,
    });
  });

  it("처리 창은 상태·답변·메모를 함께 저장하고 알림이 간다고 알려 준다", () => {
    render(
      <AdminFeedbackEditDialog feedback={adminFeedback()} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "반영 완료" }));
    fireEvent.change(screen.getByLabelText("답변 (작성자에게 보임)"), {
      target: { value: "넣어 두었어요." },
    });
    expect(
      screen.getByText(ko.feedback.admin.reply_will_notify),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(mockUpdate).toHaveBeenCalledWith({
      id: 5,
      status: FeedbackStatus.DONE,
      reply: "넣어 두었어요.",
      adminNote: "",
    });
  });

  it("탈퇴한 작성자면 답변을 볼 사람이 없다고 알려 준다", () => {
    render(
      <AdminFeedbackEditDialog
        feedback={adminFeedback({ user: null })}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText(ko.feedback.admin.reply_no_user),
    ).toBeInTheDocument();
  });
});

describe("답변 알림", () => {
  const notification = {
    id: 1,
    recipientId: 1,
    actorId: null,
    type: NotificationType.FEEDBACK_REPLIED,
    metadata: { feedbackId: 5 },
    isRead: false,
    createdAt: "2026-09-28T01:00:00.000Z",
  } as Notification;

  it("북적이 보낸 알림이고 나의 문의로 이동한다", () => {
    expect(isSystemNotification(notification)).toBe(true);
    expect(getNotificationLink(notification)).toBe("/my-page/feedback");
    expect(
      getNotificationMessageParams(notification, {
        actor: "",
        cancelReason: "",
      }).key,
    ).toBe("feedback_replied");
  });

  it("사람이 보낸 알림은 시스템 알림이 아니다", () => {
    expect(
      isSystemNotification({
        ...notification,
        type: NotificationType.COMMENT_LIKE,
      }),
    ).toBe(false);
  });
});
