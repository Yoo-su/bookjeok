import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DisputeModal } from "../components/modals/dispute-modal";
import { ShippingFormModal } from "../components/modals/shipping-form-modal";

const mockRegisterShippingMutate = vi.fn();
const mockDisputeOrderMutate = vi.fn();

vi.mock("@bookjeok/react-query", () => ({
  useRegisterShippingMutation: (options?: any) => ({
    mutate: (args: any) => {
      mockRegisterShippingMutate(args);
      options?.onSuccess?.();
    },
    isPending: false,
  }),
  useDisputeOrderMutation: (options?: any) => ({
    mutate: (args: any) => {
      mockDisputeOrderMutate(args);
      options?.onSuccess?.();
    },
    isPending: false,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (namespace: string) => (key: string) => {
    const map: Record<string, string> = {
      title:
        namespace === "order.shipping_modal"
          ? "운송장 번호 등록"
          : "구매확정 거부 및 문제 신고",
      desc: "설명 텍스트",
      carrier_label: "택배사",
      carrier_placeholder: "택배사를 선택하세요",
      tracking_label: "운송장 번호",
      tracking_placeholder: "숫자만 입력하세요",
      submit: "등록하기",
      submitting: "처리 중...",
      reason_label: "신고 사유",
      reason_placeholder: "사유를 입력하세요",
      escrow_warning: "에스크로 대금 지급이 보류됩니다.",
      "errors.carrier_required": "택배사를 선택해주세요.",
      "errors.tracking_required": "운송장 번호를 입력해주세요.",
      "errors.invalid_tracking": "유효한 운송장 번호를 입력해주세요.",
      "errors.reason_required": "거부 사유를 입력해주세요.",
      "errors.reason_min_length": "사유를 5자 이상 작성해주세요.",
    };
    return map[key] || key;
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ShippingFormModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders carrier selector and tracking input", () => {
    render(
      <ShippingFormModal
        orderId={"ORD-123"}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("운송장 번호 등록")).toBeInTheDocument();
    expect(screen.getByText("택배사")).toBeInTheDocument();
    expect(screen.getByText("운송장 번호")).toBeInTheDocument();
  });

  it("shows error when submitting empty form", () => {
    render(
      <ShippingFormModal
        orderId={"ORD-123"}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "등록하기" });
    fireEvent.click(submitBtn);

    expect(screen.getByText("택배사를 선택해주세요.")).toBeInTheDocument();
    expect(screen.getByText("운송장 번호를 입력해주세요.")).toBeInTheDocument();
    expect(mockRegisterShippingMutate).not.toHaveBeenCalled();
  });
});

describe("DisputeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dispute dialog and escrow warning", () => {
    render(
      <DisputeModal orderId={"ORD-123"} open={true} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByText("구매확정 거부 및 문제 신고")).toBeInTheDocument();
    expect(
      screen.getByText("에스크로 대금 지급이 보류됩니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("사유를 입력하세요"),
    ).toBeInTheDocument();
  });

  it("shows error when reason length is less than 5 characters", () => {
    render(
      <DisputeModal orderId={"ORD-123"} open={true} onOpenChange={vi.fn()} />,
    );

    const textarea = screen.getByPlaceholderText("사유를 입력하세요");
    fireEvent.change(textarea, { target: { value: "파손" } });

    const submitBtn = screen.getByRole("button", { name: "등록하기" });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText("사유를 5자 이상 작성해주세요."),
    ).toBeInTheDocument();
    expect(mockDisputeOrderMutate).not.toHaveBeenCalled();
  });

  it("submits dispute reason when valid", async () => {
    const onSuccess = vi.fn();
    render(
      <DisputeModal
        orderId={"ORD-123"}
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    const textarea = screen.getByPlaceholderText("사유를 입력하세요");
    fireEvent.change(textarea, {
      target: { value: "도서 표지가 찢어져서 배송되었습니다." },
    });

    const submitBtn = screen.getByRole("button", { name: "등록하기" });
    fireEvent.click(submitBtn);

    expect(mockDisputeOrderMutate).toHaveBeenCalledWith({
      orderId: "ORD-123",
      payload: {
        disputeReason: "도서 표지가 찢어져서 배송되었습니다.",
      },
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
