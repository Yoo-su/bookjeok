import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import UserPopover from "@/layouts/default-layout/user-popover";
import { PATHS } from "@/shared/constants/paths";
import { hardRedirect, markSessionToast } from "@/shared/utils/session";

const mockPush = vi.fn();
const mockClearAuth = vi.fn();

vi.mock("@bookjeok/api-client", () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  usePathname: () => "/my-page",
  useRouter: () => ({ push: mockPush, replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/shared/utils/session", () => ({
  hardRedirect: vi.fn(),
  markSessionToast: vi.fn(),
}));

vi.mock("@/features/reading-log/components/kong/kong-menu-count", () => ({
  KongMenuCount: () => null,
}));

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        id: 1,
        nickname: "사용자A",
        email: "a@example.com",
        profileImageUrl: null,
      },
      clearAuth: mockClearAuth,
    }),
}));

const clickLogout = async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <UserPopover />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button"));
  fireEvent.click(await screen.findByText("logout"));
};

/**
 * 로그아웃이 SPA 라우팅으로 돌아가면, 이전 사용자의 TanStack Query 캐시와
 * Next.js Router Cache가 브라우저 힙에 그대로 남는다. 같은 브라우저에서
 * 다음 사용자가 로그인하면 그 데이터가 노출되므로 하드 내비게이션을 강제한다.
 */
describe("로그아웃 세션 정리", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SPA 이동이 아니라 하드 내비게이션으로 세션을 끝낸다", async () => {
    await clickLogout();

    await waitFor(() => {
      expect(hardRedirect).toHaveBeenCalledWith(PATHS.HOME);
    });
    expect(mockClearAuth).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("하드 내비게이션 이후에 띄울 토스트를 예약한다", async () => {
    await clickLogout();

    await waitFor(() => {
      expect(markSessionToast).toHaveBeenCalledWith("logout_success");
    });
  });
});
