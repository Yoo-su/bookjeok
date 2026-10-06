import * as apis from "@bookjeok/api-client";
import { ReadingLog } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ReadingLogCalendar } from "@/features/reading-log/components/calendar-view/reading-log-calendar";
import { ReadingLogStats } from "@/features/reading-log/components/stats-view/reading-log-stats";
import { SEASONAL_THEMES } from "@/features/reading-log/constants/ui";
import { OverlayProvider } from "@/shared/hooks/use-overlay";

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@bookjeok/api-client")>()),
  getReadingLogs: vi.fn(),
  getReadingLogSettings: vi.fn(),
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: () => (key: string) => key,
}));

const makeLog = (id: string, date: string): ReadingLog => ({
  id,
  userId: 1,
  isbn: `isbn-${id}`,
  date,
  memo: "",
  createdAt: `${date}T00:00:00.000Z`,
  updatedAt: `${date}T00:00:00.000Z`,
  book: {
    isbn: `isbn-${id}`,
    title: `책 ${id}`,
    author: "",
    publisher: "",
    image: `https://cdn.bookjeok.com/${id}.jpg`,
  },
});

beforeAll(() => {
  // 상단 연·월 SlidingNumber가 크기를 잰다
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

// 2026-07-01은 수요일이라 7월 달력 첫 줄에 6/28~30 칸이 함께 그려진다
const LOGS_2026 = [
  makeLog("jun", "2026-06-29"),
  makeLog("a", "2026-07-10"),
  makeLog("b", "2026-07-10"),
  makeLog("c", "2026-07-21"),
  makeLog("aug", "2026-08-03"),
];

describe("ReadingLogCalendar 연 단위 조회", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // 미래 달 판정이 오늘에 기대므로 날짜만 고정한다(타이머는 진짜)
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 6));
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    vi.mocked(apis.getReadingLogs).mockImplementation(async (params) =>
      params?.year === 2026 ? LOGS_2026 : [],
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const ui = (
    currentDate: Date,
    props?: Partial<React.ComponentProps<typeof ReadingLogCalendar>>,
  ) => (
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>
        <ReadingLogCalendar
          currentDate={currentDate}
          onDateChange={vi.fn()}
          viewMode="calendar"
          {...props}
        />
      </OverlayProvider>
    </QueryClientProvider>
  );

  const yearsRequested = () =>
    vi.mocked(apis.getReadingLogs).mock.calls.map(([params]) => params);

  it("그해 기록을 한 번 받아 그리는 달 칸에만 둔다", async () => {
    render(ui(new Date(2026, 6, 1)));

    expect(await screen.findByLabelText("2026-07-10 (2)")).toBeInTheDocument();
    expect(screen.getByLabelText("2026-07-21 (1)")).toBeInTheDocument();
    // 이웃 달 칸에는 그해 기록이 있어도 표지를 두지 않는다(월 단위 조회 때와 같음)
    expect(screen.getByLabelText("2026-06-29")).toBeInTheDocument();
    expect(yearsRequested()).toEqual([{ year: 2026 }]);
  });

  it("같은 해 안에서 달을 넘기면 요청하지 않는다", async () => {
    const { rerender } = render(ui(new Date(2026, 6, 1)));
    await screen.findByLabelText("2026-07-10 (2)");

    for (const month of [7, 8, 2, 5]) {
      rerender(ui(new Date(2026, month, 1)));
    }
    rerender(ui(new Date(2026, 7, 1)));

    expect(screen.getByLabelText("2026-08-03 (1)")).toBeInTheDocument();
    expect(yearsRequested()).toEqual([{ year: 2026 }]);
  });

  it("2월에 오면 지난해를 미리 받아 1월 → 12월이 기다리지 않는다", async () => {
    const { rerender } = render(ui(new Date(2026, 6, 1)));
    await screen.findByLabelText("2026-07-10 (2)");

    rerender(ui(new Date(2026, 2, 1)));
    expect(yearsRequested()).toEqual([{ year: 2026 }]);

    rerender(ui(new Date(2026, 1, 1)));
    await waitFor(() =>
      expect(yearsRequested()).toEqual([{ year: 2026 }, { year: 2025 }]),
    );

    rerender(ui(new Date(2026, 0, 1)));
    rerender(ui(new Date(2025, 11, 1)));
    // 이미 받아 둔 해라 흐려지지 않고 바로 넘어가며 다시 요청하지 않는다
    expect(
      screen.getByLabelText("2025-12-01").closest("[aria-busy]"),
    ).toHaveAttribute("aria-busy", "false");
    expect(yearsRequested()).toHaveLength(2);
  });

  it("11월이어도 다음 해가 미래면 받지 않는다", async () => {
    const { rerender } = render(ui(new Date(2026, 6, 1)));
    await screen.findByLabelText("2026-07-10 (2)");

    rerender(ui(new Date(2025, 10, 1)));
    await waitFor(() =>
      expect(yearsRequested()).toContainEqual({ year: 2025 }),
    );
    // 2025년 11월은 다음 해(2026)를 받지만, 2026년 11·12월은 다음 해가 미래라 받지 않는다
    rerender(ui(new Date(2026, 10, 1)));
    rerender(ui(new Date(2026, 11, 1)));

    expect(yearsRequested()).toEqual([{ year: 2026 }, { year: 2025 }]);
  });

  it("다른 해로 건너뛰면 받는 동안 이전 달을 흐리게 두고, 받은 뒤 넘어간다", async () => {
    let resolve!: (logs: ReadingLog[]) => void;
    const { rerender } = render(ui(new Date(2026, 6, 1)));
    await screen.findByLabelText("2026-07-10 (2)");
    vi.mocked(apis.getReadingLogs).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );

    rerender(ui(new Date(2024, 5, 1)));

    const grid = screen.getByLabelText("2026-07-10 (2)").closest("[aria-busy]");
    expect(grid).toHaveAttribute("aria-busy", "true");

    resolve([makeLog("old", "2024-06-15")]);

    expect(await screen.findByLabelText("2024-06-15 (1)")).toBeInTheDocument();
    expect(
      screen.getByLabelText("2024-06-15 (1)").closest("[aria-busy]"),
    ).toHaveAttribute("aria-busy", "false");
  });

  it("딥링크 날짜는 기록을 받은 뒤 한 번만 연다", async () => {
    const openDate = new Date(2026, 6, 10);
    const onOpenDateHandled = vi.fn();
    const { rerender } = render(
      ui(new Date(2026, 6, 10), { openDate, onOpenDateHandled }),
    );

    await waitFor(() => expect(onOpenDateHandled).toHaveBeenCalledTimes(1));
    // 부모가 openDate를 비우기 전에 다시 그려져도 또 열지 않는다
    rerender(ui(new Date(2026, 6, 10), { openDate, onOpenDateHandled }));
    rerender(ui(new Date(2026, 6, 10), { openDate, onOpenDateHandled }));

    expect(onOpenDateHandled).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText("desc_write")).toHaveLength(1);
  });
});

describe("ReadingLogStats", () => {
  const theme = SEASONAL_THEMES.summer;

  it("그해 기록에서 그 달과 그해 권수를 센다", () => {
    const { container } = render(
      <ReadingLogStats
        month={new Date(2026, 6, 1)}
        logs={LOGS_2026}
        isLoading={false}
        theme={theme}
      />,
    );

    const numbers = [...container.querySelectorAll("span.invisible")].map(
      (el) => el.textContent,
    );
    expect(numbers).toEqual(["3", "5"]);
  });

  it("기록을 못 받았으면 0권으로 그리지 않는다", () => {
    const { container } = render(
      <ReadingLogStats
        month={new Date(2026, 6, 1)}
        logs={undefined}
        isLoading={false}
        theme={theme}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
