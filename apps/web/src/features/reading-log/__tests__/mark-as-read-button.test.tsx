import * as apis from "@bookjeok/api-client";
import { ReadingLog, readingLogKeys, User } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { format } from "date-fns";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { MarkAsReadButton } from "@/features/reading-log/components/common/mark-as-read-button";

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@bookjeok/api-client")>()),
  getReadingLogBookStatus: vi.fn(),
  createReadingLog: vi.fn(),
  getReadingStack: vi.fn(),
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/book/9788937460449",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: () => (key: string) => key,
}));

const book = {
  isbn: "9788937460449",
  title: "급류",
  author: "정대건",
  image: "https://cdn.bookjeok.com/covers/9788937460449.jpg",
};
const statusKey = readingLogKeys.bookStatus(book.isbn).queryKey;
const today = format(new Date(), "yyyy-MM-dd");

describe("MarkAsReadButton 기록 이력 안내", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    useAuthStore.setState({ user: { id: 1 } as User });
  });

  const renderButton = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MarkAsReadButton book={book} />
      </QueryClientProvider>,
    );

  const openForm = () =>
    fireEvent.click(screen.getByRole("button", { name: "button" }));

  it("폼을 열기 전에는 조회하지 않는다", () => {
    renderButton();

    expect(apis.getReadingLogBookStatus).not.toHaveBeenCalled();
  });

  it("기록한 적 있는 책이면 알린다", async () => {
    vi.mocked(apis.getReadingLogBookStatus).mockResolvedValue({
      count: 2,
      lastDate: "2026-03-12",
    });
    renderButton();
    openForm();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "logged_before",
    );
    expect(apis.getReadingLogBookStatus).toHaveBeenCalledWith(book.isbn);
  });

  it("고른 날짜가 마지막 기록일이면 같은 날 안내를 띄운다", async () => {
    vi.mocked(apis.getReadingLogBookStatus).mockResolvedValue({
      count: 1,
      lastDate: today,
    });
    renderButton();
    openForm();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "logged_same_day",
    );
  });

  it("기록이 없으면 알리지 않는다", async () => {
    vi.mocked(apis.getReadingLogBookStatus).mockResolvedValue({
      count: 0,
      lastDate: null,
    });
    renderButton();
    openForm();

    await waitFor(() =>
      expect(queryClient.getQueryState(statusKey)?.status).toBe("success"),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("저장 직후 무효화로는 다시 조회하지 않고, 다시 열 때 조회한다", async () => {
    vi.mocked(apis.getReadingLogBookStatus).mockResolvedValue({
      count: 1,
      lastDate: "2026-03-12",
    });
    vi.mocked(apis.getReadingStack).mockRejectedValue(new Error("offline"));
    let resolveCreate!: (log: ReadingLog) => void;
    vi.mocked(apis.createReadingLog).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    renderButton();
    openForm();
    await screen.findByRole("status");

    fireEvent.click(screen.getByRole("button", { name: "submit_create" }));
    await screen.findByRole("button", { name: "processing" });
    resolveCreate({ id: "log-1", isbn: book.isbn, date: today } as ReadingLog);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(queryClient.getQueryState(statusKey)?.isInvalidated).toBe(true);
    expect(apis.getReadingLogBookStatus).toHaveBeenCalledTimes(1);

    openForm();
    await waitFor(() =>
      expect(apis.getReadingLogBookStatus).toHaveBeenCalledTimes(2),
    );
  });
});
