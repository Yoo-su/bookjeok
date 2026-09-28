import * as apis from "@bookjeok/api-client";
import { PublicUserProfile, userKeys } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useUpdateUserMutation } from "@/features/user/mutations";
import { revalidateUserProfile } from "@/shared/actions/revalidate";

vi.mock("@bookjeok/api-client", () => ({
  updateProfile: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
const refresh = vi.fn();
vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));
// ISR 재검증 서버 액션은 테스트 환경에서 실행할 수 없으므로 모킹
vi.mock("@/shared/actions/revalidate", () => ({
  revalidateUserProfile: vi.fn().mockResolvedValue(undefined),
}));

const HANDLE = "reader42";

const updatedProfile = {
  id: 1,
  handle: HANDLE,
  nickname: "바뀐 닉네임",
  profileImageUrl: "https://example.com/new.png",
  email: "reader@example.com",
  isReadingLogPublic: true,
} as unknown as PublicUserProfile & {
  email: string;
  isReadingLogPublic: boolean;
};

describe("프로필 수정 후 캐시 정리", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(apis.updateProfile).mockResolvedValue(updatedProfile);

    // 공개 프로필 페이지를 이미 본 상태 (ISR 하이드레이션 재현)
    queryClient.setQueryData(userKeys.publicProfile(HANDLE).queryKey, {
      handle: HANDLE,
      nickname: "옛 닉네임",
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("공개 프로필 쿼리를 무효화한다", async () => {
    const { result } = renderHook(() => useUpdateUserMutation(), { wrapper });

    result.current.mutate({ nickname: "바뀐 닉네임" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const state = queryClient
      .getQueryCache()
      .find({ queryKey: userKeys.publicProfile(HANDLE).queryKey })?.state;

    expect(state?.isInvalidated).toBe(true);
  });

  it("공개 프로필 페이지의 ISR 캐시를 재검증한다", async () => {
    const { result } = renderHook(() => useUpdateUserMutation(), { wrapper });

    result.current.mutate({ nickname: "바뀐 닉네임" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(revalidateUserProfile).toHaveBeenCalledWith({
        handle: HANDLE,
        // 서버 액션이 본인 호출인지 확인하도록 현재 토큰을 함께 넘긴다
        accessToken: useAuthStore.getState().accessToken,
      }),
    );
  });

  it("재검증이 끝난 뒤에 Router Cache를 비운다", async () => {
    const { result } = renderHook(() => useUpdateUserMutation(), { wrapper });

    result.current.mutate({ nickname: "바뀐 닉네임" });

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(revalidateUserProfile).toHaveBeenCalled();
  });
});
