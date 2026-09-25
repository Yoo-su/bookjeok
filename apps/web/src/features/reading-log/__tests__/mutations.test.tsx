import * as apis from "@bookjeok/api-client";
import { ReadingLog, readingLogKeys } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import React from "react";
import { type Action, toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateReadingLogMutation,
  useUpdateReadingLogMutation,
} from "@/features/reading-log/mutations";

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@bookjeok/api-client")>()),
  createReadingLog: vi.fn(),
  updateReadingLog: vi.fn(),
  getReadingTower: vi.fn(),
}));

const push = vi.fn();
vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  book: {
    isbn: `isbn-${id}`,
    title: id,
    author: "",
    publisher: "",
    description: "",
    image: "",
    link: "",
    discount: "",
    pubdate: "",
  },
});

const august = readingLogKeys.list({ year: 2026, month: 8 }).queryKey;
const september = readingLogKeys.list({ year: 2026, month: 9 }).queryKey;
const july = readingLogKeys.list({ year: 2026, month: 7 }).queryKey;

describe("독서 기록 뮤테이션의 월별 캐시 반영", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("수정으로 날짜가 다른 달로 바뀌면 원래 달에서 빠지고 새 달에 들어간다", async () => {
    const moving = makeLog("a", "2026-08-30");
    queryClient.setQueryData(august, [makeLog("b", "2026-08-01"), moving]);
    queryClient.setQueryData(september, [makeLog("c", "2026-09-10")]);
    vi.mocked(apis.updateReadingLog).mockResolvedValue({
      ...moving,
      date: "2026-09-02",
    });

    const { result } = renderHook(() => useUpdateReadingLogMutation(), {
      wrapper,
    });
    await act(() =>
      result.current.mutateAsync({ id: "a", memo: "", date: "2026-09-02" }),
    );

    const aug = queryClient.getQueryData<ReadingLog[]>(august)!;
    const sep = queryClient.getQueryData<ReadingLog[]>(september)!;
    expect(aug.map((log) => log.id)).toEqual(["b"]);
    expect(sep.map((log) => log.id)).toEqual(["a", "c"]);
  });

  it("같은 달 안에서 메모만 고치면 그 달에 한 번만 남는다", async () => {
    const log = makeLog("a", "2026-08-30");
    queryClient.setQueryData(august, [log]);
    vi.mocked(apis.updateReadingLog).mockResolvedValue({ ...log, memo: "새" });

    const { result } = renderHook(() => useUpdateReadingLogMutation(), {
      wrapper,
    });
    await act(() =>
      result.current.mutateAsync({ id: "a", memo: "새", date: log.date }),
    );

    expect(queryClient.getQueryData<ReadingLog[]>(august)).toEqual([
      { ...log, memo: "새" },
    ]);
  });

  it("캐시가 없는 달로 옮기거나 생성해도 그 달을 한 권짜리로 심지 않는다", async () => {
    const log = makeLog("a", "2026-08-30");
    queryClient.setQueryData(august, [log]);
    vi.mocked(apis.updateReadingLog).mockResolvedValue({
      ...log,
      date: "2026-07-05",
    });
    vi.mocked(apis.createReadingLog).mockResolvedValue(
      makeLog("new", "2026-07-06"),
    );

    const update = renderHook(() => useUpdateReadingLogMutation(), { wrapper });
    await act(() =>
      update.result.current.mutateAsync({
        id: "a",
        memo: "",
        date: "2026-07-05",
      }),
    );
    const create = renderHook(() => useCreateReadingLogMutation(), { wrapper });
    await act(() =>
      create.result.current.mutateAsync({ isbn: "x", date: "2026-07-06" }),
    );

    expect(queryClient.getQueryData(july)).toBeUndefined();
    expect(queryClient.getQueryData<ReadingLog[]>(august)).toEqual([]);
  });

  it("생성은 캐시가 있는 달에 날짜순으로 끼워 넣는다", async () => {
    queryClient.setQueryData(september, [
      makeLog("a", "2026-09-01"),
      makeLog("c", "2026-09-20"),
    ]);
    vi.mocked(apis.createReadingLog).mockResolvedValue(
      makeLog("b", "2026-09-10"),
    );

    const { result } = renderHook(() => useCreateReadingLogMutation(), {
      wrapper,
    });
    await act(() =>
      result.current.mutateAsync({ isbn: "x", date: "2026-09-10" }),
    );

    expect(
      queryClient.getQueryData<ReadingLog[]>(september)!.map((log) => log.id),
    ).toEqual(["a", "b", "c"]);
  });
});

describe("중복 기록 안내", () => {
  const conflict = (code: string) =>
    new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 409,
      statusText: "Conflict",
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { code },
    });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => vi.clearAllMocks());

  it("서버가 중복으로 거절하면 생성·수정 모두 '이미 기록한 책' 안내를 띄운다", async () => {
    vi.mocked(apis.createReadingLog).mockRejectedValue(
      conflict("READING_LOG_002"),
    );
    vi.mocked(apis.updateReadingLog).mockRejectedValue(
      conflict("READING_LOG_002"),
    );

    const create = renderHook(() => useCreateReadingLogMutation(), { wrapper });
    const update = renderHook(() => useUpdateReadingLogMutation(), { wrapper });
    await act(async () => {
      await create.result.current
        .mutateAsync({ isbn: "x", date: "2026-09-10" })
        .catch(() => {});
      await update.result.current
        .mutateAsync({ id: "a", memo: "", date: "2026-09-10" })
        .catch(() => {});
    });

    expect(vi.mocked(toast.error).mock.calls).toEqual([
      ["already_added"],
      ["already_added"],
    ]);
  });

  it("다른 에러는 기존 실패 안내를 띄운다", async () => {
    vi.mocked(apis.createReadingLog).mockRejectedValue(conflict("OTHER_001"));

    const { result } = renderHook(() => useCreateReadingLogMutation(), {
      wrapper,
    });
    await act(async () => {
      await result.current
        .mutateAsync({ isbn: "x", date: "2026-09-10" })
        .catch(() => {});
    });

    expect(toast.error).toHaveBeenCalledWith("create_error");
  });
});

describe("기록 생성 알림", () => {
  const year = new Date().getFullYear();
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const towerOf = (depths: number[]) => ({
    year,
    items: depths.map((depth, i) => ({
      logId: `log-${i}`,
      isbn: `isbn-${i}`,
      date: `${year}-01-0${i + 1}`,
      title: `책 ${i}`,
      author: "",
      publisher: "",
      image: "",
      width: 145,
      height: 210,
      depth,
      pages: null,
      weight: 300,
      binding: null,
      coverColor: null,
      sizeSource: "measured" as const,
    })),
  });

  const create = async (logId: string) => {
    vi.mocked(apis.createReadingLog).mockResolvedValue(
      makeLog(logId, `${year}-01-02`),
    );
    const { result } = renderHook(() => useCreateReadingLogMutation(), {
      wrapper,
    });
    await act(() =>
      result.current.mutateAsync({ isbn: "x", date: `${year}-01-02` }),
    );
  };

  it("쌓인 두께와 다음 부위까지 남은 높이를 알리고, 책탑 보기로 보낸다", async () => {
    // 기본 키 173cm: 100mm → 117mm는 발목을 이미 넘은 상태라 다음 부위(무릎)를 말한다
    vi.mocked(apis.getReadingTower).mockResolvedValue(towerOf([100, 17]));

    await create("log-1");

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const [title, options] = vi.mocked(toast.success).mock.calls[0];
    expect(title).toBe("create_tower");
    expect(options).toMatchObject({ description: "tower_to_next" });

    const action = options?.action as Action;
    act(() => action.onClick({} as React.MouseEvent<HTMLButtonElement>));
    expect(push).toHaveBeenCalledWith("/my-page/reading-log");
    expect(
      JSON.parse(localStorage.getItem("reading-log-view") ?? "{}").state
        ?.viewMode,
    ).toBe("tower");
  });

  it("이번 책으로 부위를 넘으면 넘었다고 알린다", async () => {
    // 173cm의 무릎(28%) = 484.4mm. 480 → 497
    vi.mocked(apis.getReadingTower).mockResolvedValue(towerOf([480, 17]));

    await create("log-1");

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(vi.mocked(toast.success).mock.calls[0][1]).toMatchObject({
      description: "tower_passed",
    });
  });

  it("책탑을 못 받으면 평범한 완료 알림", async () => {
    vi.mocked(apis.getReadingTower).mockRejectedValue(new Error("offline"));

    await create("log-1");

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("create_success"),
    );
  });
});
