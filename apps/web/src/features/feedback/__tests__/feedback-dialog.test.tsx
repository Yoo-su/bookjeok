import { FEEDBACK_DAILY_LIMIT, FeedbackType } from "@bookjeok/core";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import React from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ko from "@/shared/i18n/messages/ko.json";

import { FeedbackDialog } from "../components/feedback-dialog";
import { useOpenFeedback } from "../hooks/use-open-feedback";
import { useFeedbackDialogStore } from "../stores/use-feedback-dialog-store";

const mockMutate = vi.fn();
let mutationOptions: { onError?: (error: unknown) => void } = {};
const mockPush = vi.fn();
let mockUser: { id: number } | null = { id: 1 };

vi.mock("@bookjeok/react-query", () => ({
  useCreateFeedbackMutation: (options: typeof mutationOptions) => {
    mutationOptions = options;
    return { mutate: mockMutate, isPending: false };
  },
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: { user: typeof mockUser }) => unknown) =>
    selector({ user: mockUser }),
}));

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace: string) => (key: string, params?: Record<string, unknown>) => {
      const root = (ko as Record<string, unknown>)[namespace];
      const value = key
        .split(".")
        .reduce<unknown>(
          (node, part) => (node as Record<string, unknown>)?.[part],
          root,
        );
      return typeof value === "string"
        ? value.replace(/\{(\w+)\}/g, (_, name) => String(params?.[name]))
        : key;
    },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const openDialog = (
  preset?: Parameters<
    ReturnType<typeof useFeedbackDialogStore.getState>["open"]
  >[0],
) => act(() => useFeedbackDialogStore.getState().open(preset));

describe("FeedbackDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 1 };
    act(() => useFeedbackDialogStore.getState().close());
  });

  it("검색어로 연 책 요청은 제목이 채워진 채로 보낸다", () => {
    render(<FeedbackDialog />);
    openDialog({ type: FeedbackType.BOOK_REQUEST, bookTitle: "급류" });

    expect(screen.getByLabelText("책 제목")).toHaveValue("급류");
    fireEvent.change(screen.getByLabelText("저자"), {
      target: { value: " 정대건 " },
    });
    fireEvent.click(screen.getByRole("button", { name: "보내기" }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: FeedbackType.BOOK_REQUEST,
        bookTitle: "급류",
        bookAuthor: "정대건",
        bookPublisher: undefined,
        content: undefined,
      }),
    );
  });

  it("버그 제보는 내용이 없으면 보낼 수 없고 책 정보는 보내지 않는다", () => {
    render(<FeedbackDialog />);
    openDialog({ bookTitle: "급류" });

    fireEvent.click(screen.getByRole("radio", { name: "버그 제보" }));
    const submit = screen.getByRole("button", { name: "보내기" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("내용"), {
      target: { value: "검색 버튼이 안 눌려요" },
    });
    fireEvent.click(submit);

    const params = mockMutate.mock.calls[0][0];
    expect(params.type).toBe(FeedbackType.BUG);
    expect(params.content).toBe("검색 버튼이 안 눌려요");
    expect(params).not.toHaveProperty("bookTitle");
  });

  it("다시 열면 이전에 쓰던 내용이 남지 않는다", () => {
    render(<FeedbackDialog />);
    openDialog({ type: FeedbackType.OTHER });
    fireEvent.change(screen.getByLabelText("내용"), {
      target: { value: "쓰다 만 글" },
    });
    act(() => useFeedbackDialogStore.getState().close());

    openDialog({ type: FeedbackType.OTHER });

    expect(screen.getByLabelText("내용")).toHaveValue("");
  });
});

const apiError = (status: number, code: string) =>
  new AxiosError("fail", "ERR", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { code, message: "" },
  });

describe("FeedbackDialog 실패 안내", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 1 };
  });

  it("하루 한도를 넘기면 한도를 알려 준다", () => {
    render(<FeedbackDialog />);

    act(() => mutationOptions.onError?.(apiError(429, "FEEDBACK_003")));

    expect(toast.error).toHaveBeenCalledWith(
      `오늘은 문의를 ${FEEDBACK_DAILY_LIMIT}건까지 보낼 수 있어요. 내일 다시 보내 주세요.`,
    );
  });

  it("그 밖의 실패는 일반 안내를 띄운다", () => {
    render(<FeedbackDialog />);

    act(() => mutationOptions.onError?.(apiError(500, "INTERNAL_001")));

    expect(toast.error).toHaveBeenCalledWith(
      "보내지 못했어요. 잠시 후 다시 시도해 주세요.",
    );
  });
});

describe("useOpenFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => useFeedbackDialogStore.getState().close());
  });

  it("비로그인이면 창을 열지 않고 로그인으로 보낸다", () => {
    mockUser = null;
    const { result } = renderHook(() => useOpenFeedback());

    act(() => result.current());

    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(useFeedbackDialogStore.getState().isOpen).toBe(false);
  });

  it("로그인했으면 창을 연다", () => {
    mockUser = { id: 1 };
    const { result } = renderHook(() => useOpenFeedback());

    act(() => result.current({ type: FeedbackType.BUG }));

    expect(useFeedbackDialogStore.getState()).toMatchObject({
      isOpen: true,
      preset: { type: FeedbackType.BUG },
    });
  });
});
