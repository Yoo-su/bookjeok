import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReadingStackIntro } from "@/features/announcement/components/reading-stack-intro";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";
import { useReadingLogViewStore } from "@/features/reading-log/stores/use-reading-log-view-store";
import messages from "@/shared/i18n/messages/ko.json";

const push = vi.fn();
vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push }),
}));

const saveReturnUrl = vi.fn();
vi.mock("@/features/auth/utils/return-url", () => ({
  saveReturnUrl: (url: string) => saveReturnUrl(url),
}));

let stackItems: typeof SAMPLE_BOOKS = [];
vi.mock("@bookjeok/react-query", () => ({
  useReadingStackQuery: () => ({ data: { year: 2026, items: stackItems } }),
}));

// 무대는 ResizeObserver와 SVG 측정이 필요해 누가 서는지만 남긴다
vi.mock("@/features/reading-log/components/stack-view/stack-stage", () => ({
  StackStage: (p: {
    books: unknown[];
    person?: { character: string };
    object?: { spec: { id: string } };
  }) => (
    <div
      data-testid="stage"
      data-books={p.books.length}
      data-character={p.person?.character ?? "none"}
      data-object={p.object?.spec.id ?? "none"}
    />
  ),
}));

function renderIntro() {
  const onOpenChange = vi.fn();
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <ReadingStackIntro open onOpenChange={onOpenChange} />
    </NextIntlClientProvider>,
  );
  return onOpenChange;
}

const toLast = async () => {
  fireEvent.click(
    await screen.findByRole("button", { name: "5번째 소개 보기" }),
  );
  return screen.findByText("기록할 때마다 쌓이고, 이미지로 자랑해요");
};

describe("ReadingStackIntro", () => {
  beforeEach(() => {
    push.mockClear();
    saveReturnUrl.mockClear();
    stackItems = [];
    useAuthStore.setState({ accessToken: null, user: null });
    useReadingLogViewStore.setState({ viewMode: "calendar" });
  });

  it("비로그인은 예시로 소개하고, 가입하면 독서 키재기로 돌아오게 한다", async () => {
    const onOpenChange = renderIntro();
    expect(
      await screen.findByText("올해 읽은 책, 쌓으면 내 키만 할까요?"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("stage")).toHaveAttribute(
      "data-books",
      String(SAMPLE_BOOKS.length),
    );

    await toLast();
    fireEvent.click(
      screen.getByRole("button", { name: "가입하고 독서 키재기 시작하기" }),
    );
    expect(saveReturnUrl).toHaveBeenCalledWith("/my-page/reading-log");
    expect(push).toHaveBeenCalledWith("/login");
    expect(useReadingLogViewStore.getState().viewMode).toBe("stack");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("로그인했고 올해 기록이 있으면 내가 쌓은 높이로 소개하고 내 독서 키재기로 보낸다", async () => {
    useAuthStore.setState({ accessToken: "token" });
    stackItems = SAMPLE_BOOKS.slice(0, 3);
    const mm = stackItems.reduce((a, b) => a + b.depth, 0);
    renderIntro();
    expect(
      await screen.findByText(
        `올해 읽은 책이 벌써 ${(mm / 10).toFixed(1)}cm 쌓였어요`,
      ),
    ).toBeInTheDocument();

    await toLast();
    fireEvent.click(
      screen.getByRole("button", { name: "내 독서 키재기 보러 가기" }),
    );
    expect(saveReturnUrl).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/my-page/reading-log");
  });

  it("둘째 장은 사물과 나란히 세우고, 쌓은 책이 자라며 다음 사물이 바뀐다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderIntro();
      const dialog = await screen.findByRole("dialog");
      fireEvent.keyDown(dialog, { key: "ArrowRight" });
      expect(
        await screen.findByText("지우개부터 기린까지, 무엇을 넘었을까요?"),
      ).toBeInTheDocument();
      const stage = screen.getByTestId("stage");
      const first = stage.getAttribute("data-object");
      expect(first).not.toBe("none");
      // 예시 46권을 몇 장면에 나눠 키운다
      expect(Number(stage.getAttribute("data-books"))).toBeLessThan(
        SAMPLE_BOOKS.length,
      );
      await act(() => vi.advanceTimersByTimeAsync(2700));
      expect(screen.getByTestId("stage").getAttribute("data-object")).not.toBe(
        first,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("넷째 장에서 작가와 비교하고, 말풍선과 겹치는 이름 칩은 두지 않는다", async () => {
    renderIntro();
    const dialog = await screen.findByRole("dialog");
    for (let k = 0; k < 3; k++)
      fireEvent.keyDown(dialog, { key: "ArrowRight" });
    await waitFor(() =>
      expect(screen.getByTestId("stage")).toHaveAttribute(
        "data-character",
        "kafka",
      ),
    );
    expect(screen.queryByRole("button", { name: "울프" })).toBeNull();
  });
});
