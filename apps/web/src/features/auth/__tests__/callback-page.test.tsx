import { exchangeAuthTicket } from "@bookjeok/api-client";
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import CallbackPage from "@/app/[locale]/(auth)/callback/page";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { PATHS } from "@/shared/constants/paths";

const replace = vi.fn();
let params = new URLSearchParams();

vi.mock("@bookjeok/api-client", () => ({ exchangeAuthTicket: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => params }));
vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ replace }),
}));

describe("소셜 로그인 콜백", () => {
  afterEach(() => {
    replace.mockReset();
    vi.mocked(exchangeAuthTicket).mockReset();
    useAuthStore.getState().clearAuth();
    sessionStorage.clear();
  });

  it("티켓을 토큰과 사용자로 교환해 한 번에 저장하고 복귀 경로로 보낸다", async () => {
    params = new URLSearchParams({ ticket: "t-1" });
    sessionStorage.setItem("auth-return-url", "/my-page");
    vi.mocked(exchangeAuthTicket).mockResolvedValue({
      accessToken: "a",
      refreshToken: "r",
      user: { id: 7, nickname: "B" },
    } as Awaited<ReturnType<typeof exchangeAuthTicket>>);

    render(<CallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/my-page"));
    expect(exchangeAuthTicket).toHaveBeenCalledWith("t-1");
    const { user, accessToken, refreshToken } = useAuthStore.getState();
    expect({ id: user?.id, accessToken, refreshToken }).toEqual({
      id: 7,
      accessToken: "a",
      refreshToken: "r",
    });
  });

  it("URL로 직접 전달된 토큰은 받지 않고 로그인으로 보낸다", async () => {
    params = new URLSearchParams({
      accessToken: "attacker-a",
      refreshToken: "attacker-r",
      user: JSON.stringify({ id: 666 }),
    });

    render(<CallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith(PATHS.LOGIN));
    expect(exchangeAuthTicket).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("티켓 교환이 실패하면 로그인으로 보낸다", async () => {
    params = new URLSearchParams({ ticket: "expired" });
    vi.mocked(exchangeAuthTicket).mockRejectedValue(new Error("401"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<CallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith(PATHS.LOGIN));
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
