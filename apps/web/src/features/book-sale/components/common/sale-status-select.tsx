"use client";

import { SaleStatus, UsedBookSale } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useCancelSaleReservationMutation } from "@/features/trade/mutations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { cn } from "@/shared/utils/cn";

import { useUpdateBookSaleStatusMutation } from "../../mutations";
import {
  TradeCounterpartyModal,
  TradeCounterpartyMode,
} from "./trade-counterparty-modal";

interface SaleStatusSelectProps {
  sale: UsedBookSale;
  className?: string;
}

/**
 * 판매자가 판매글 상태(판매중·예약중·판매완료)를 바꾸는 셀렉트.
 *
 * 잠금 판단은 `sale.hasActiveOrder`로만 한다. 예약중 상태를 잠금 근거로
 * 삼으면, 다른 구매희망자의 혼동을 줄이려고 예약중으로 바꾼 직거래 판매자가
 * 판매완료로 넘어갈 수 없게 된다.
 */
export const SaleStatusSelect = ({
  sale,
  className,
}: SaleStatusSelectProps) => {
  const t = useTranslations("market.history");
  const tStatus = useTranslations("market.sale_status");
  const tActions = useTranslations("market.detail.actions");

  // 예약중·판매완료 모두 "누구와 거래하는지"를 물어야 다른 채팅방 안내가
  // 정확해지고 후기 상대가 정해진다.
  const [counterpartyMode, setCounterpartyMode] =
    useState<TradeCounterpartyMode | null>(null);

  const { mutate: updateSaleStatus, isPending } =
    useUpdateBookSaleStatusMutation();
  const { mutate: cancelReservation, isPending: isCancelling } =
    useCancelSaleReservationMutation();

  // 거래 기록이 남은 판매완료는 종료 상태다. 되돌리면 후기와 신뢰 지표가
  // 성사되지 않은 거래 위에 남는다.
  const isCompleted =
    sale.status === SaleStatus.SOLD && sale.hasTradeCompletion === true;
  const isLocked = sale.hasActiveOrder === true || isCompleted;

  const handleChange = (next: string) => {
    const status = next as SaleStatus;

    if (status === SaleStatus.SOLD) {
      setCounterpartyMode("complete");
      return;
    }

    if (status === SaleStatus.RESERVED) {
      setCounterpartyMode("reserve");
      return;
    }

    // 예약을 푸는 경우 거래 상대 지정도 함께 해제해야 다른 채팅방의
    // "거래 진행 중" 안내가 사라진다.
    if (
      status === SaleStatus.FOR_SALE &&
      sale.status === SaleStatus.RESERVED &&
      sale.reservedForUserId
    ) {
      cancelReservation(sale.id);
      return;
    }

    updateSaleStatus({ saleId: sale.id, status });
  };

  return (
    <>
      <Select
        value={sale.status}
        onValueChange={handleChange}
        disabled={isLocked || isPending || isCancelling}
      >
        <SelectTrigger
          className={cn(
            "w-[105px] h-8 text-xs bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 rounded-lg shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed",
            className,
          )}
          title={
            isCompleted
              ? tActions("completed_status_locked")
              : isLocked
                ? tActions("in_trade_status_auto")
                : undefined
          }
        >
          <SelectValue placeholder={t("change_status")} />
        </SelectTrigger>
        <SelectContent>
          {Object.values(SaleStatus).map((status) => (
            <SelectItem key={status} value={status} className="text-xs">
              {tStatus(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {counterpartyMode && (
        <TradeCounterpartyModal
          sale={sale}
          mode={counterpartyMode}
          open
          onOpenChange={(next) => {
            if (!next) setCounterpartyMode(null);
          }}
        />
      )}
    </>
  );
};
