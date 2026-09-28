import * as apis from "@bookjeok/api-client";
import { readingLogKeys, User, userKeys } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateReadingLogSettingsMutation } from "@/features/reading-log/mutations";

vi.mock("@bookjeok/api-client", () => ({
  updateReadingLogSettings: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: () => (key: string) => key,
}));

const mockProfile: User = {
  id: 1,
  provider: "KAKAO",
  providerId: "123",
  nickname: "UserA",
  profileImageUrl: "",
  email: "test@test.com",
  isReadingLogPublic: false,
  handle: "userA",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  role: "USER",
};

describe("useUpdateReadingLogSettingsMutation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // 두 개의 캐시 스토어 초기화 (설정 캐시, 로그인 사용자 프로필 캐시)
    queryClient.setQueryData(readingLogKeys.settings.queryKey, {
      isReadingLogPublic: false,
    });
    queryClient.setQueryData(userKeys.me.queryKey, mockProfile);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("mutate 호출 시, settings 정보와 userProfile 정보가 모두 낙관적으로 업데이트 되어야 한다", async () => {
    // API 응답 임의 지연
    let resolveApi!: (value: unknown) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });

    vi.mocked(apis.updateReadingLogSettings).mockReturnValue(apiPromise as any);

    const { result } = renderHook(() => useUpdateReadingLogSettingsMutation(), {
      wrapper,
    });

    result.current.mutate(true); // 공개 모드로 변경

    await waitFor(() => {
      const settingsCache = queryClient.getQueryData<{
        isReadingLogPublic: boolean;
      }>(readingLogKeys.settings.queryKey);
      expect(settingsCache?.isReadingLogPublic).toBe(true);

      const profileCache = queryClient.getQueryData<User>(userKeys.me.queryKey);
      expect(profileCache?.isReadingLogPublic).toBe(true);
    });

    await act(async () => {
      resolveApi({ isReadingLogPublic: true });
      await apiPromise;
    });
  });

  it("API 호출 실패 시, settings 정보와 userProfile 캐시가 모두 이전(false) 상태로 롤백되어야 한다", async () => {
    vi.mocked(apis.updateReadingLogSettings).mockRejectedValueOnce(
      new Error("Server Error"),
    );

    const { result } = renderHook(() => useUpdateReadingLogSettingsMutation(), {
      wrapper,
    });

    await act(async () => {
      // 강제로 true 로 변경 시도 (에러 발생 예정)
      result.current.mutate(true);
    });

    const settingsCache = queryClient.getQueryData<{
      isReadingLogPublic: boolean;
    }>(readingLogKeys.settings.queryKey);
    const profileCache = queryClient.getQueryData<User>(userKeys.me.queryKey);

    // 둘 다 false 상태로 롤백되어 있어야 함
    expect(settingsCache?.isReadingLogPublic).toBe(false);
    expect(profileCache?.isReadingLogPublic).toBe(false);
  });
});
