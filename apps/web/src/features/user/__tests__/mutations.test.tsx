import * as apis from "@bookjeok/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWithdrawMutation } from "@/features/user/mutations";
import { revalidateUserProfile } from "@/shared/actions/revalidate";

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof apis>()),
  withdraw: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
// ISR 재검증 서버 액션은 테스트 환경에서 실행할 수 없으므로 모킹
vi.mock("@/shared/actions/revalidate", () => ({
  revalidateUserProfile: vi.fn().mockResolvedValue(undefined),
}));

const clearAuth = vi.fn();

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      clearAuth: () => clearAuth(),
      user: { id: 1, handle: "user_abc12345" },
    }),
  ),
}));

describe("useWithdrawMutation", () => {
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

  it("탈퇴에 성공하면 본인 프로필 경로의 ISR 캐시를 비운다", async () => {
    vi.mocked(apis.withdraw).mockResolvedValueOnce(undefined as never);

    const { result } = renderHook(() => useWithdrawMutation(), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    // 탈퇴는 소프트 삭제라 프로필이 곧바로 404가 되지만, 비우지 않으면 ISR에
    // 남은 200 HTML이 만료 시각까지 그대로 나간다
    expect(revalidateUserProfile).toHaveBeenCalledWith({
      handle: "user_abc12345",
    });
  });

  it("재검증이 실패해도 인증 정보는 비운다", async () => {
    vi.mocked(apis.withdraw).mockResolvedValueOnce(undefined as never);
    vi.mocked(revalidateUserProfile).mockRejectedValueOnce(
      new Error("revalidate failed"),
    );

    const { result } = renderHook(() => useWithdrawMutation(), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    expect(clearAuth).toHaveBeenCalled();
  });
});
