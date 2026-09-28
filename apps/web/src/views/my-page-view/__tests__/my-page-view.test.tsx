import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MyPageView } from "../index";

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: () => ({
    id: 1,
    nickname: "테스트유저",
    handle: "testuser",
    email: "test@example.com",
    isEmailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    profileImageUrl: null,
  }),
}));

vi.mock("@bookjeok/react-query", () => ({
  useSendVerificationEmailMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/features/user/components/dashboard/user-stats-dashboard", () => ({
  UserStatsDashboard: () => <div data-testid="user-stats-dashboard" />,
}));

vi.mock("@/features/user/components/profile/profile-edit-modal", () => ({
  ProfileEditModal: ({ trigger }: any) => trigger,
}));

vi.mock("@/features/user/components/profile/withdrawal-modal", () => ({
  WithdrawalModal: () => <div data-testid="withdrawal-modal" />,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      title: "마이페이지",
      activity_manage: "활동 관리",
      "menu.reading_log.label": "독서 기록",
      "menu.reading_log.desc": "캘린더로 보는 나의 독서 여정",
      "menu.purchases.label": "나의 구매 내역",
      "menu.purchases.desc": "에스크로 안전결제 구매 주문 및 배송 조회",
      "menu.sales_orders.label": "판매 주문 관리",
      "menu.sales_orders.desc": "주문 접수, 운송장 등록 및 정산 관리",
      "menu.sales.label": "내 중고책 판매글",
      "menu.sales.desc": "등록한 판매글 관리 및 판매 상태 변경",
      "menu.reviews.label": "내가 쓴 리뷰",
      "menu.reviews.desc": "작성한 서평 및 별점 목록",
      "menu.wishlist.label": "위시리스트",
      "menu.wishlist.desc": "찜한 도서 및 중고책 목록",
      "menu.comments.label": "내가 쓴 댓글",
      "menu.comments.desc": "커뮤니티 및 리뷰에 남긴 댓글",
      "danger_zone.withdraw_title": "회원 탈퇴",
      "danger_zone.withdraw_desc": "계정 삭제 시 모든 활동 기록이 삭제됩니다.",
    };
    return map[key] || key;
  },
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({ href, children, ...props }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

describe("MyPageView", () => {
  const originalEnv = process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED = originalEnv;
  });

  it("hides purchases and sales-orders menu when payment feature is disabled", () => {
    process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED = "false";

    render(<MyPageView />);

    expect(screen.getByText("독서 기록")).toBeInTheDocument();
    expect(screen.getByText("내 중고책 판매글")).toBeInTheDocument();
    expect(screen.getByText("내가 쓴 리뷰")).toBeInTheDocument();
    expect(screen.getByText("위시리스트")).toBeInTheDocument();
    expect(screen.getByText("내가 쓴 댓글")).toBeInTheDocument();

    expect(screen.queryByText("나의 구매 내역")).not.toBeInTheDocument();
    expect(screen.queryByText("판매 주문 관리")).not.toBeInTheDocument();
  });

  it("shows purchases and sales-orders menu when payment feature is enabled", () => {
    process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED = "true";

    render(<MyPageView />);

    expect(screen.getByText("나의 구매 내역")).toBeInTheDocument();
    expect(screen.getByText("판매 주문 관리")).toBeInTheDocument();
  });
});
