import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import enMessages from "@/shared/i18n/messages/en.json";
import koMessages from "@/shared/i18n/messages/ko.json";

import { EmailVerificationModal } from "../email-verification-alert";

vi.mock("@bookjeok/react-query", () => ({
  useSendVerificationEmailMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const renderModal = (locale: "ko" | "en", actionName: string) => {
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });

  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ko" ? koMessages : enMessages}
    >
      <EmailVerificationModal
        open
        onOpenChange={vi.fn()}
        actionName={actionName}
      />
    </NextIntlClientProvider>,
  );
};

describe("EmailVerificationModal", () => {
  it("한글 로케일에서 기능 이름이 안내 문구 안에 렌더링된다", () => {
    renderModal("ko", "중고거래 채팅");

    expect(screen.getByText("이메일 인증이 필요합니다")).toBeInTheDocument();
    expect(screen.getByText("중고거래 채팅")).toBeInTheDocument();
    expect(
      screen.getByText(/이용하시려면 먼저 이메일 인증을 완료해주세요/),
    ).toBeInTheDocument();
    expect(screen.getByText("등록된 이메일 없음")).toBeInTheDocument();
  });

  it("영문 로케일에서 한글이 남지 않는다", () => {
    renderModal("en", "used-book chat");

    expect(screen.getByText("Email verification required")).toBeInTheDocument();
    expect(screen.getByText("used-book chat")).toBeInTheDocument();
    expect(screen.getByText("No email on file")).toBeInTheDocument();
    // 다이얼로그는 포털로 붙으므로 body 전체를 본다
    expect(document.body.textContent ?? "").not.toMatch(/[가-힣]/);
  });
});
