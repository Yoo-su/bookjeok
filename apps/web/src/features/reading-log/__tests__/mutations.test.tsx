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
  useDeleteReadingLogMutation,
  useUpdateReadingLogMutation,
} from "@/features/reading-log/mutations";
import { useStackMilestoneStore } from "@/features/reading-log/stores/use-stack-milestone-store";

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@bookjeok/api-client")>()),
  createReadingLog: vi.fn(),
  updateReadingLog: vi.fn(),
  deleteReadingLog: vi.fn(),
  getReadingStack: vi.fn(),
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
    image: "",
  },
});

const y2026 = readingLogKeys.list({ year: 2026 }).queryKey;
const y2025 = readingLogKeys.list({ year: 2025 }).queryKey;
const y2024 = readingLogKeys.list({ year: 2024 }).queryKey;

describe("독서 기록 뮤테이션의 연 목록 캐시 반영", () => {
  let queryClient: QueryClient;
  const ids = (key: readonly unknown[]) =>
    queryClient.getQueryData<ReadingLog[]>(key)?.map((log) => log.id);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    // 생성 뒤 키재기 알림은 여기서 보지 않는다
    vi.mocked(apis.getReadingStack).mockRejectedValue(new Error("skip"));
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const update = async (params: { id: string; memo: string; date: string }) => {
    const { result } = renderHook(() => useUpdateReadingLogMutation(), {
      wrapper,
    });
    await act(() => result.current.mutateAsync(params));
  };

  it("같은 해 다른 달로 옮기면 그해 목록 안에서 날짜순 자리로 간다", async () => {
    const moving = makeLog("a", "2026-08-30");
    queryClient.setQueryData(y2026, [
      makeLog("b", "2026-08-01"),
      moving,
      makeLog("c", "2026-09-10"),
    ]);
    vi.mocked(apis.updateReadingLog).mockResolvedValue({
      ...moving,
      date: "2026-09-20",
    });

    await update({ id: "a", memo: "", date: "2026-09-20" });

    expect(ids(y2026)).toEqual(["b", "c", "a"]);
  });

  it("다른 해로 옮기면 원래 해에서 빠지고, 받아 둔 새 해에 날짜순으로 들어간다", async () => {
    const moving = makeLog("a", "2026-01-02");
    queryClient.setQueryData(y2026, [moving, makeLog("b", "2026-03-01")]);
    queryClient.setQueryData(y2025, [
      makeLog("c", "2025-11-01"),
      makeLog("d", "2025-12-31"),
    ]);
    vi.mocked(apis.updateReadingLog).mockResolvedValue({
      ...moving,
      date: "2025-12-20",
    });

    await update({ id: "a", memo: "", date: "2025-12-20" });

    expect(ids(y2026)).toEqual(["b"]);
    expect(ids(y2025)).toEqual(["c", "a", "d"]);
  });

  it("같은 날 여러 권 중 맨 앞 기록의 메모만 고치면 순서가 그대로다", async () => {
    const first = makeLog("a", "2026-08-30");
    queryClient.setQueryData(y2026, [first, makeLog("b", "2026-08-30")]);
    vi.mocked(apis.updateReadingLog).mockResolvedValue({
      ...first,
      memo: "새",
    });

    await update({ id: "a", memo: "새", date: first.date });

    const logs = queryClient.getQueryData<ReadingLog[]>(y2026)!;
    expect(logs.map((log) => log.id)).toEqual(["a", "b"]);
    expect(logs[0].memo).toBe("새");
  });

  it("같은 날 이미 기록이 있으면 새 기록은 그 뒤에 붙어 그날 맨 앞 표지가 그대로다", async () => {
    queryClient.setQueryData(y2026, [
      makeLog("a", "2026-09-10"),
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

    expect(ids(y2026)).toEqual(["a", "b", "c"]);
  });

  it("캐시가 없는 해로 옮기거나 생성해도 그해를 한 권짜리로 심지 않는다", async () => {
    const log = makeLog("a", "2026-08-30");
    queryClient.setQueryData(y2026, [log]);
    vi.mocked(apis.updateReadingLog).mockResolvedValue({
      ...log,
      date: "2024-07-05",
    });
    vi.mocked(apis.createReadingLog).mockResolvedValue(
      makeLog("new", "2024-07-06"),
    );

    await update({ id: "a", memo: "", date: "2024-07-05" });
    const create = renderHook(() => useCreateReadingLogMutation(), { wrapper });
    await act(() =>
      create.result.current.mutateAsync({ isbn: "x", date: "2024-07-06" }),
    );

    expect(queryClient.getQueryData(y2024)).toBeUndefined();
    expect(ids(y2026)).toEqual([]);
  });

  it("지우면 그해 목록에서 빠져 그날 칸이 빈다", async () => {
    queryClient.setQueryData(y2026, [
      makeLog("a", "2026-08-30"),
      makeLog("b", "2026-09-01"),
    ]);
    vi.mocked(apis.deleteReadingLog).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteReadingLogMutation(), {
      wrapper,
    });
    await act(() =>
      result.current.mutateAsync({ id: "a", date: "2026-08-30" }),
    );

    expect(ids(y2026)).toEqual(["b"]);
  });

  it("실패하면 연 목록을 건드리지 않는다", async () => {
    const before = [makeLog("a", "2026-08-30"), makeLog("b", "2026-09-01")];
    queryClient.setQueryData(y2026, before);
    const fail = new Error("offline");
    vi.mocked(apis.createReadingLog).mockRejectedValue(fail);
    vi.mocked(apis.updateReadingLog).mockRejectedValue(fail);
    vi.mocked(apis.deleteReadingLog).mockRejectedValue(fail);

    const create = renderHook(() => useCreateReadingLogMutation(), { wrapper });
    const edit = renderHook(() => useUpdateReadingLogMutation(), { wrapper });
    const remove = renderHook(() => useDeleteReadingLogMutation(), {
      wrapper,
    });
    await act(async () => {
      await create.result.current
        .mutateAsync({ isbn: "x", date: "2026-09-02" })
        .catch(() => {});
      await edit.result.current
        .mutateAsync({ id: "a", memo: "", date: "2025-01-01" })
        .catch(() => {});
      await remove.result.current
        .mutateAsync({ id: "b", date: "2026-09-01" })
        .catch(() => {});
    });

    expect(queryClient.getQueryData(y2026)).toBe(before);
  });

  it("성공하면 연 목록을 바로 고친 뒤 독서 기록 캐시 전체를 무효화해 서버와 맞춘다", async () => {
    queryClient.setQueryData(y2026, [makeLog("a", "2026-08-30")]);
    vi.mocked(apis.deleteReadingLog).mockResolvedValue(undefined);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteReadingLogMutation(), {
      wrapper,
    });
    await act(() =>
      result.current.mutateAsync({ id: "a", date: "2026-08-30" }),
    );

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: readingLogKeys._def,
    });
    expect(queryClient.getQueryState(y2026)?.isInvalidated).toBe(true);
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
    useStackMilestoneStore.setState({ scene: null, open: false });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const stackOf = (depths: number[]) => ({
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

  it("쌓인 두께와 다음 사물까지 남은 높이를 알리고, 독서 키재기 보기로 보낸다", async () => {
    // 100mm → 105mm: 발목은 이미 넘었고 넘은 사물도 없어 다음 사물(햄스터 110mm)을 말한다
    vi.mocked(apis.getReadingStack).mockResolvedValue(stackOf([100, 5]));

    await create("log-1");

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const [title, options] = vi.mocked(toast.success).mock.calls[0];
    expect(title).toBe("create_stack");
    expect(options).toMatchObject({ description: "stack_object_to_next" });

    const action = options?.action as Action;
    act(() => action.onClick({} as React.MouseEvent<HTMLButtonElement>));
    expect(push).toHaveBeenCalledWith("/my-page/reading-log");
    expect(
      JSON.parse(localStorage.getItem("reading-log-view") ?? "{}").state
        ?.viewMode,
    ).toBe("stack");
  });

  it("이번 책으로 부위를 넘으면 토스트 대신 장면을 띄운다", async () => {
    // 173cm의 무릎(28%) = 484.4mm. 480 → 497
    vi.mocked(apis.getReadingStack).mockResolvedValue(stackOf([480, 17]));

    await create("log-1");

    await waitFor(() =>
      expect(useStackMilestoneStore.getState().open).toBe(true),
    );
    expect(useStackMilestoneStore.getState().scene).toMatchObject({
      year,
      logId: "log-1",
      milestone: { kind: "part", part: "knee" },
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("이번 책으로 사물을 넘으면 부위보다 먼저 장면에 세운다", async () => {
    // 290 → 307: 닥스훈트(300mm)를 넘는다
    vi.mocked(apis.getReadingStack).mockResolvedValue(stackOf([290, 17]));

    await create("log-1");

    await waitFor(() =>
      expect(useStackMilestoneStore.getState().open).toBe(true),
    );
    expect(useStackMilestoneStore.getState().scene?.milestone).toMatchObject({
      kind: "object",
      object: { id: "dachshund" },
    });
  });

  it("쌓은 책을 못 받으면 평범한 완료 알림", async () => {
    vi.mocked(apis.getReadingStack).mockRejectedValue(new Error("offline"));

    await create("log-1");

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("create_success"),
    );
  });
});
