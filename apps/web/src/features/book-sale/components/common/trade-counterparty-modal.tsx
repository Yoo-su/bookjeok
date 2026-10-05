"use client";

import { SaleStatus, UsedBookSale } from "@bookjeok/core";
import { useTradeCandidatesQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  useCompleteDirectTradeMutation,
  useReserveSaleMutation,
} from "@/features/trade/mutations";
import { Check, Loader2 } from "@/shared/components/icons/iconsax";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { cn } from "@/shared/utils/cn";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { useUpdateBookSaleStatusMutation } from "../../mutations";

/** 예약중으로 바꿀 때인지, 판매완료로 바꿀 때인지 */
export type TradeCounterpartyMode = "reserve" | "complete";

interface TradeCounterpartyModalProps {
  sale: UsedBookSale;
  mode: TradeCounterpartyMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "누구와 거래하시나요?"를 묻는 모달.
 *
 * 예약중·판매완료 어느 쪽으로 바꾸든 거래 상대가 정해져야 다른 채팅방에
 * 정확한 안내가 나가고 후기 상대가 결정됩니다. 상대는 가능한 한 빨리,
 * 늦어도 완료 시점에 정해지도록 두 전환 모두에서 묻습니다.
 *
 * 서비스 밖에서 알게 된 사람과 거래한 경우를 막지 않기 위해 건너뛰기를
 * 남겨두지만, 건너뛰면 거래 기록이 남지 않아 후기도 열리지 않습니다.
 */
export const TradeCounterpartyModal = ({
  sale,
  mode,
  open,
  onOpenChange,
}: TradeCounterpartyModalProps) => {
  const t = useTranslations(
    mode === "reserve" ? "market.reserve_trade" : "market.complete_trade",
  );

  const [selectedBuyerId, setSelectedBuyerId] = useState<number | null>(
    sale.reservedForUserId ?? null,
  );

  const { data: candidates = [], isLoading } = useTradeCandidatesQuery(
    sale.id,
    { enabled: open },
  );

  const onError = (error: Error) => toast.error(error.message);

  const completeMutation = useCompleteDirectTradeMutation({
    onSuccess: ({ completion }) => {
      toast.success(completion ? t("success_with_review") : t("success"));
      onOpenChange(false);
    },
    onError,
  });

  const reserveMutation = useReserveSaleMutation({
    onSuccess: () => {
      toast.success(t("success"));
      onOpenChange(false);
    },
    onError,
  });

  const updateStatusMutation = useUpdateBookSaleStatusMutation();

  const isPending =
    completeMutation.isPending ||
    reserveMutation.isPending ||
    updateStatusMutation.isPending;

  const submit = (buyerId: number | null) => {
    const candidate = candidates.find((item) => item.user.id === buyerId);

    if (mode === "complete") {
      completeMutation.mutate({
        saleId: sale.id,
        buyerId: buyerId ?? undefined,
        chatRoomId: candidate?.chatRoomId,
        withoutCounterparty: buyerId === null,
      });
      return;
    }

    // 예약: 상대를 안 고르면 상태만 예약중으로 바꾼다.
    if (buyerId === null) {
      updateStatusMutation.mutate(
        { saleId: sale.id, status: SaleStatus.RESERVED },
        {
          onSuccess: () => {
            toast.success(t("success"));
            onOpenChange(false);
          },
        },
      );
      return;
    }

    reserveMutation.mutate({
      saleId: sale.id,
      buyerId,
      chatRoomId: candidate?.chatRoomId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-stone-900 dark:text-stone-100">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-stone-500 text-xs">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8 text-stone-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : candidates.length === 0 ? (
            <p className="py-8 text-center text-xs text-stone-400">
              {t("no_candidates")}
            </p>
          ) : (
            candidates.map((candidate) => {
              const isSelected = selectedBuyerId === candidate.user.id;
              return (
                <button
                  key={candidate.user.id}
                  type="button"
                  onClick={() => setSelectedBuyerId(candidate.user.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-stone-900 bg-stone-50 dark:bg-stone-800 dark:border-stone-100 ring-1 ring-stone-900 dark:ring-stone-100"
                      : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900",
                  )}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={getProfileImageUrl(candidate.user.profileImageUrl)}
                        alt={candidate.user.nickname}
                      />
                      <AvatarFallback className="text-xs">
                        {candidate.user.nickname?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                      {candidate.user.nickname}
                    </span>
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-stone-900 dark:text-stone-100 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => submit(null)}
            disabled={isPending}
          >
            {t("skip")}
          </Button>
          <Button
            onClick={() => submit(selectedBuyerId)}
            disabled={isPending || selectedBuyerId === null}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
