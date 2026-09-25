import * as apis from "@bookjeok/api-client";
import { ReadingLog, readingLogKeys } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DayDetailsDialog } from "@/features/reading-log/components/common/day-details-dialog";

vi.mock("@bookjeok/api-client", () => ({
  createReadingLog: vi.fn(),
  deleteReadingLog: vi.fn(),
  updateReadingLog: vi.fn(),
  getReadingLogs: vi.fn(),
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: () => (key: string) => key,
}));

const mockDate = new Date(2026, 7, 21); // 2026-08-21
const mockLog1: ReadingLog = {
  id: "log-1",
  isbn: "9788932917245",
  date: "2026-08-21",
  memo: "첫 번째 책 메모",
  createdAt: "2026-08-21T00:00:00.000Z",
  updatedAt: "2026-08-21T00:00:00.000Z",
  book: {
    isbn: "9788932917245",
    title: "데미안",
    author: "헤르만 헤세",
    publisher: "민음사",
    description: "데미안 설명",
    image: "https://example.com/demian.jpg",
    link: "https://example.com/demian",
    discount: "10000",
    pubdate: "2000-01-01",
  },
  userId: 1,
};

const mockLog2: ReadingLog = {
  id: "log-2",
  isbn: "9788937460005",
  date: "2026-08-21",
  memo: "두 번째 책 메모",
  createdAt: "2026-08-21T00:00:00.000Z",
  updatedAt: "2026-08-21T00:00:00.000Z",
  book: {
    isbn: "9788937460005",
    title: "이방인",
    author: "알베르 카뮈",
    publisher: "민음사",
    description: "이방인 설명",
    image: "https://example.com/stranger.jpg",
    link: "https://example.com/stranger",
    discount: "10000",
    pubdate: "2000-01-01",
  },
  userId: 1,
};

describe("DayDetailsDialog", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    });
    vi.clearAllMocks();
    vi.mocked(apis.getReadingLogs).mockResolvedValue([mockLog1]);
  });

  const renderDialog = (initialLogs: ReadingLog[] = [mockLog1]) => {
    // 캘린더 월별 쿼리 캐시 초기화 (2026년 8월)
    queryClient.setQueryData(
      readingLogKeys.list({ year: 2026, month: 8 }).queryKey,
      initialLogs,
    );

    return render(
      <QueryClientProvider client={queryClient}>
        <DayDetailsDialog
          date={mockDate}
          logs={initialLogs}
          open={true}
          onOpenChange={vi.fn()}
        />
      </QueryClientProvider>,
    );
  };

  it("초기 캐시된 독서기록 목록을 정상적으로 렌더링해야 합니다", async () => {
    renderDialog([mockLog1]);

    await waitFor(() => {
      expect(screen.getByText("데미안")).toBeInTheDocument();
      expect(screen.getByText("첫 번째 책 메모")).toBeInTheDocument();
    });
  });

  it("캐시에 새로운 독서기록이 추가되면 모달이 다시 열리지 않아도 즉각 반영되어야 합니다", async () => {
    renderDialog([mockLog1]);

    expect(screen.getByText("데미안")).toBeInTheDocument();
    expect(screen.queryByText("이방인")).not.toBeInTheDocument();

    // 쿼리 캐시에 새로운 책(이방인) 추가 시뮬레이션
    act(() => {
      queryClient.setQueryData(
        readingLogKeys.list({ year: 2026, month: 8 }).queryKey,
        [mockLog1, mockLog2],
      );
    });

    await waitFor(() => {
      expect(screen.getByText("이방인")).toBeInTheDocument();
      expect(screen.getByText("두 번째 책 메모")).toBeInTheDocument();
    });
  });

  it("캐시에서 독서기록이 삭제되면 모달 내 목록에서도 즉각 제거되어야 합니다", async () => {
    renderDialog([mockLog1, mockLog2]);

    expect(screen.getByText("데미안")).toBeInTheDocument();
    expect(screen.getByText("이방인")).toBeInTheDocument();

    // 쿼리 캐시에서 mockLog1 제거 시뮬레이션
    act(() => {
      queryClient.setQueryData(
        readingLogKeys.list({ year: 2026, month: 8 }).queryKey,
        [mockLog2],
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("데미안")).not.toBeInTheDocument();
      expect(screen.getByText("이방인")).toBeInTheDocument();
    });
  });
});
