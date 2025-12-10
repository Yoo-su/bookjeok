import { SaleStatus } from "./types";

export const getSaleStatusLabel = (status: SaleStatus): string => {
  switch (status) {
    case "FOR_SALE":
      return "판매중";
    case "RESERVED":
      return "예약중";
    case "SOLD":
      return "판매완료";
    default:
      return "";
  }
};

export const getStatusBadgeVariant = (
  status: SaleStatus
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "FOR_SALE":
      return "default"; // 기본 (보라색 계열)
    case "RESERVED":
      return "secondary"; // 2차 (회색 계열)
    case "SOLD":
      return "destructive"; // 파괴적인 (빨간색 계열)
    default:
      return "outline";
  }
};
