"use client";

import {
  ChatRoom,
  SaleAuthor,
  SaleStatus,
  TradeCompletionMethod,
} from "@bookjeok/core";
import {
  useCancelSaleReservationMutation,
  useCompleteDirectTradeMutation,
  useMyTradeReviewEligibilityQuery,
  useReserveSaleMutation,
  useTradeCompletionByRoomQuery,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { EmailVerificationModal } from "@/features/auth/components/email-verification-alert";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useChatStore } from "@/features/chat/stores/use-chat-store";
import { useConfirm } from "@/features/confirm";
import { TradeReviewModal } from "@/features/trade/components/review/trade-review-modal";
import { ShoppingBagIcon } from "@/shared/components/icons";
import {
  AlertTriangle,
  CheckCircle2,
  Handshake,
  RotateCcw,
} from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";

interface DirectTradeBannerProps {
  room: ChatRoom;
  currentUser: SaleAuthor;
  opponent: SaleAuthor;
}

/**
 * 결제 없이 진행되는 직거래의 채팅방 배너.
 *
 * 판매자는 여기서 거래 상대를 지정(예약중)하고 거래를 완료 처리한다.
 * 예약중은 다른 구매희망자에게 보내는 신호이기도 하므로, 상대가 지정되면
 * 다른 채팅방에는 "다른 구매자와 거래 진행 중" 안내가 뜬다.
 *
 * 결제(에스크로) 흐름은 `TradeStatusBanner`가 담당한다.
 */
export const DirectTradeBanner = ({
  room,
  currentUser,
  opponent,
}: DirectTradeBannerProps) => {
  const t = useTranslations("chat.trade.status_banner");
  const tDialog = useTranslations("chat.trade.direct_trade_dialog");
  const tVerify = useTranslations("auth.verification.alert.actions");
  const confirm = useConfirm();
  const authUser = useAuthStore((state) => state.user);
  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const isRoomInactive = useChatStore((state) =>
    room?.id ? state.isRoomInactive[room.id] || false : false,
  );

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const sale = room.usedBookSale;
  const sellerId = sale?.user?.id;
  const isSeller = Boolean(
    currentUser?.id && sellerId && currentUser.id === sellerId,
  );

  const { data: completion } = useTradeCompletionByRoomQuery(room?.id, {
    enabled: Boolean(room?.id) && isChatOpen,
  });

  const { data: reviewEligibility } = useMyTradeReviewEligibilityQuery(
    completion?.id,
    { enabled: Boolean(completion?.id) && isChatOpen },
  );

  const onError = (error: Error) => toast.error(error.message);

  const reserveMutation = useReserveSaleMutation({
    onSuccess: () => toast.success(tDialog("reserve_success")),
    onError,
  });
  const cancelMutation = useCancelSaleReservationMutation({
    onSuccess: () => toast.success(tDialog("cancel_success")),
    onError,
  });
  const completeMutation = useCompleteDirectTradeMutation({
    onSuccess: () => toast.success(tDialog("complete_success")),
    onError,
  });

  const isPending =
    reserveMutation.isPending ||
    cancelMutation.isPending ||
    completeMutation.isPending;

  const requireVerifiedEmail = () => {
    if (authUser && !authUser.isEmailVerified) {
      setIsVerificationModalOpen(true);
      return false;
    }
    return true;
  };

  const handleReserve = async () => {
    if (!requireVerifiedEmail()) return;

    const isConfirmed = await confirm({
      title: tDialog("reserve_title"),
      description: tDialog("reserve_desc"),
      confirmText: tDialog("reserve_confirm"),
    });
    if (!isConfirmed) return;

    reserveMutation.mutate({
      saleId: sale.id,
      buyerId: opponent.id,
      chatRoomId: room.id,
    });
  };

  const handleCancelReservation = async () => {
    const isConfirmed = await confirm({
      title: tDialog("cancel_title"),
      description: tDialog("cancel_desc"),
      confirmText: tDialog("cancel_confirm"),
      variant: "destructive",
    });
    if (!isConfirmed) return;

    cancelMutation.mutate(sale.id);
  };

  const handleComplete = async () => {
    if (!requireVerifiedEmail()) return;

    const isConfirmed = await confirm({
      title: tDialog("complete_title"),
      description: tDialog("complete_desc"),
      confirmText: tDialog("complete_confirm"),
    });
    if (!isConfirmed) return;

    completeMutation.mutate({
      saleId: sale.id,
      buyerId: opponent.id,
      chatRoomId: room.id,
    });
  };

  if (!sale) return null;

  const shell = (children: React.ReactNode) => (
    <div className="flex items-center justify-between gap-2 px-4 py-2 bg-stone-50/90 dark:bg-stone-900/90 border-b border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400">
      {children}
    </div>
  );

  const directBadge = (
    <Badge
      variant="outline"
      className="text-[10px] px-1.5 py-0 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 shrink-0"
    >
      {t("direct_badge")}
    </Badge>
  );

  // 1. 이미 이 방에서 거래가 완료된 경우 — 여기가 후기 진입점이다
  if (completion) {
    return (
      <>
        {shell(
          <>
            <span className="flex items-center gap-1.5 font-medium min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">{t("direct_completed")}</span>
            </span>
            {reviewEligibility?.canWrite && (
              <Button
                size="sm"
                className="h-7 text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-lg cursor-pointer shrink-0"
                onClick={() => setIsReviewModalOpen(true)}
              >
                {t("btn_write_review")}
              </Button>
            )}
          </>,
        )}
        <TradeReviewModal
          completionId={completion.id}
          targetRole={isSeller ? "BUYER" : "SELLER"}
          method={completion.method ?? TradeCompletionMethod.DIRECT}
          targetUserNickname={opponent?.nickname}
          open={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
        />
      </>
    );
  }

  const reservedForOpponent = sale.reservedForUserId === opponent?.id;
  const reservedForMe = sale.reservedForUserId === currentUser?.id;
  const isReserved = sale.status === SaleStatus.RESERVED;

  // 2. 판매완료된 판매글 (이 방 상대와의 거래는 아님)
  if (sale.status === SaleStatus.SOLD) {
    return shell(
      <span className="flex items-center gap-1.5 font-medium">
        {directBadge}
        {t("sold_hint")}
      </span>,
    );
  }

  // 3. 구매자 시점에서 이 판매글이 다른 데서 예약된 경우
  //    판매자에게는 띄우지 않는다. 판매자가 자기 판매글의 거래 완료 버튼에
  //    도달하지 못하게 막는 분기가 되기 때문이다.
  if (!isSeller && isReserved && !reservedForMe) {
    return shell(
      <span className="flex items-center gap-1.5 font-medium">
        <AlertTriangle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
        {/*
          상대가 지정된 예약이면 "다른 구매자와 거래 중"이 사실이지만,
          상대 없이 예약중으로만 바꾼 경우엔 특정인을 암시하면 안 된다.
        */}
        {sale.reservedForUserId
          ? t("other_trading_hint")
          : t("reserved_no_counterparty_hint")}
      </span>,
    );
  }

  // 4. 판매자 화면
  if (isSeller) {
    const opponentParticipant = room.participants?.find(
      (participant) => participant.user?.id === opponent?.id,
    );
    const isOpponentInactive =
      isRoomInactive ||
      opponentParticipant?.isActive === false ||
      Boolean(opponent?.deletedAt);

    if (isOpponentInactive) {
      if (isReserved && reservedForOpponent) {
        return shell(
          <>
            <span className="flex items-center gap-1.5 font-medium min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span className="truncate">{t("opponent_left_hint")}</span>
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs rounded-lg cursor-pointer shrink-0"
              onClick={handleCancelReservation}
              disabled={isPending}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {t("btn_cancel_reservation")}
            </Button>
          </>,
        );
      }

      return shell(
        <span className="flex items-center gap-1.5 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          {t("opponent_left_hint")}
        </span>,
      );
    }

    if (isReserved && reservedForOpponent) {
      return (
        <>
          {shell(
            <>
              <span className="flex items-center gap-1.5 font-medium min-w-0">
                {directBadge}
                <span className="truncate">{t("direct_reserved_seller")}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs rounded-lg cursor-pointer"
                  onClick={handleCancelReservation}
                  disabled={isPending}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  {t("btn_cancel_reservation")}
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs rounded-lg cursor-pointer"
                  onClick={handleComplete}
                  disabled={isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t("btn_complete_trade")}
                </Button>
              </span>
            </>,
          )}
          <EmailVerificationModal
            open={isVerificationModalOpen}
            onOpenChange={setIsVerificationModalOpen}
            actionName={tVerify("direct_trade_complete")}
          />
        </>
      );
    }

    // 다른 분과 예약이 잡혀 있으면 여기서 또 지정할 수 없다.
    // (서버도 SALE_ALREADY_RESERVED_FOR_OTHER로 막는다)
    if (isReserved && sale.reservedForUserId && !reservedForOpponent) {
      return shell(
        <span className="flex items-center gap-1.5 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          {t("seller_reserved_elsewhere")}
        </span>,
      );
    }

    // 예약 상대가 없는 예약중이라면 여기서 이 분으로 지정할 수 있다.
    return (
      <>
        {shell(
          <>
            <span className="flex items-center gap-1.5 font-medium min-w-0">
              {directBadge}
              <span className="truncate">{t("direct_seller_prompt")}</span>
            </span>
            <Button
              size="sm"
              className="h-7 text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 gap-1 shadow-2xs rounded-lg cursor-pointer shrink-0"
              onClick={handleReserve}
              disabled={isPending}
            >
              <ShoppingBagIcon className="w-3.5 h-3.5" />
              {t("btn_reserve_buyer")}
            </Button>
          </>,
        )}
        <EmailVerificationModal
          open={isVerificationModalOpen}
          onOpenChange={setIsVerificationModalOpen}
          actionName={tVerify("select_counterparty")}
        />
      </>
    );
  }

  // 5. 구매자 화면
  if (isReserved && reservedForMe) {
    return shell(
      <span className="flex items-center gap-1.5 font-medium">
        <Handshake className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300 shrink-0" />
        {t("direct_reserved_buyer")}
      </span>,
    );
  }

  return shell(
    <span className="flex items-center gap-1.5 font-medium">
      {directBadge}
      {t("direct_only_hint")}
    </span>,
  );
};
