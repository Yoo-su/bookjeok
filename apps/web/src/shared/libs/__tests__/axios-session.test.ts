import "@/shared/libs/axios";

import {
  getUserProfile,
  privateApiClient,
  publicApiClient,
} from "@bookjeok/api-client";
import {
  AxiosAdapter,
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { redirectToLogin } from "@/shared/utils/session";

vi.mock("@/shared/utils/session", () => ({
  redirectToLogin: vi.fn(),
}));

const fail = (config: InternalAxiosRequestConfig, status?: number) =>
  new AxiosError(
    status ? `HTTP ${status}` : "Network Error",
    status ? "ERR_BAD_RESPONSE" : "ERR_NETWORK",
    config,
    undefined,
    status
      ? {
          data: {},
          status,
          statusText: "",
          headers: new AxiosHeaders(),
          config,
        }
      : undefined,
  );

describe("privateApiClient 세션 종료 판단", () => {
  const originalPrivateAdapter = privateApiClient.defaults.adapter;
  const originalPublicAdapter = publicApiClient.defaults.adapter;
  const refreshAdapter = vi.fn<AxiosAdapter>();

  beforeEach(() => {
    useAuthStore.getState().setTokens({
      accessToken: "expired-access",
      refreshToken: "refresh-1",
    });
    privateApiClient.defaults.adapter = async (config) => {
      throw fail(config, 401);
    };
    publicApiClient.defaults.adapter = refreshAdapter;
  });

  afterEach(() => {
    privateApiClient.defaults.adapter = originalPrivateAdapter;
    publicApiClient.defaults.adapter = originalPublicAdapter;
    refreshAdapter.mockReset();
    vi.mocked(redirectToLogin).mockClear();
    useAuthStore.getState().clearAuth();
  });

  it("리프레시 토큰이 거부(401)되면 세션을 끝내고 로그인으로 보낸다", async () => {
    refreshAdapter.mockImplementation(async (config) => {
      throw fail(config, 401);
    });

    await expect(getUserProfile()).rejects.toBeInstanceOf(AxiosError);
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["서버 오류(503)", 503],
    ["요청 제한(429)", 429],
    ["네트워크 오류", undefined],
  ])("갱신이 %s로 실패하면 로그인 상태를 유지한다", async (_, status) => {
    refreshAdapter.mockImplementation(async (config) => {
      throw fail(config, status);
    });

    await expect(getUserProfile()).rejects.toBeInstanceOf(AxiosError);
    expect(useAuthStore.getState().refreshToken).toBe("refresh-1");
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it("응답을 기다리는 사이 이 탭에서 로그아웃했다면 갱신도 이동도 하지 않는다", async () => {
    privateApiClient.defaults.adapter = async (config) => {
      // 요청은 토큰을 싣고 나갔고, 응답 전에 로그아웃이 스토어를 비웠다
      useAuthStore.getState().clearAuth();
      throw fail(config, 401);
    };

    await expect(getUserProfile()).rejects.toBeInstanceOf(AxiosError);
    expect(refreshAdapter).not.toHaveBeenCalled();
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it("토큰 없이 보낸 요청의 401은 기존대로 로그인으로 보낸다", async () => {
    useAuthStore.getState().clearAuth();

    await expect(getUserProfile()).rejects.toBeInstanceOf(AxiosError);
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });
});
