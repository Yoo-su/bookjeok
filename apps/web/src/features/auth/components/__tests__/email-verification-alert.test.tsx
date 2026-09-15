import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import koMessages from "@/shared/i18n/messages/ko.json";

import { EmailVerificationAlert } from "../email-verification-alert";

vi.mock("@bookjeok/react-query", () => ({
  useSendVerificationEmailMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// 실제 ko 메시지를 그대로 태워서 카피가 바뀌면 테스트도 같이 깨지게 둔다
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    [...namespace.split("."), ...key.split(".")].reduce<any>(
      (node, segment) => node?.[segment],
      koMessages,
    ) ?? key,
}));

describe("EmailVerificationAlert", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  });

  it("로그인하지 않은 경우 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<EmailVerificationAlert />);
    expect(container.firstChild).toBeNull();
  });

  it("이메일 인증이 완료된 사용자는 아무것도 렌더링하지 않는다", () => {
    useAuthStore.setState({
      user: {
        id: 1,
        email: "verified@example.com",
        nickname: "테스터",
        isEmailVerified: true,
        handle: "tester",
        role: "USER" as any,
        profileImageUrl: null,
        provider: "LOCAL" as any,
        providerId: "local_1",
        isReadingLogPublic: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      accessToken: "tok",
      refreshToken: "ref",
    });

    const { container } = render(<EmailVerificationAlert />);
    expect(container.firstChild).toBeNull();
  });

  it("이메일 미인증 사용자에게는 경고 배너 및 메일 발송 버튼을 렌더링한다", () => {
    useAuthStore.setState({
      user: {
        id: 2,
        email: "unverified@example.com",
        nickname: "미인증유저",
        isEmailVerified: false,
        handle: "unverified",
        role: "USER" as any,
        profileImageUrl: null,
        provider: "LOCAL" as any,
        providerId: "local_2",
        isReadingLogPublic: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      accessToken: "tok",
      refreshToken: "ref",
    });

    render(<EmailVerificationAlert />);
    expect(screen.getByText("이메일 인증이 필요합니다")).toBeInTheDocument();
    expect(screen.getByText(/unverified@example.com/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /인증 메일 발송/i }),
    ).toBeInTheDocument();
  });
});
