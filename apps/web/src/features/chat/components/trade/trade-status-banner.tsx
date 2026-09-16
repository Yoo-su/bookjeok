"use client";

import {
  ChatRoom,
  OrderStatus,
  SaleAuthor,
  SaleStatus,
  TradeMethod,
} from "@bookjeok/core";
import {
  useActiveOrderByRoomQuery,
  useCancelSelectionMutation,
  useConfirmPurchaseMutation,
} from "@bookjeok/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { EmailVerificationModal } from "@/features/auth/components/email-verification-alert";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useChatStore } from "@/features/chat/stores/use-chat-store";
import { useConfirm } from "@/features/confirm";
import {
  BoxIcon,
  CardPosIcon,
  ClockIcon,
  ShoppingBagIcon,
  TruckFastIcon,
} from "@/shared/components/icons";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  XCircle,
} from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { PATHS } from "@/shared/constants/paths";

import { DirectTradeBanner } from "./direct-trade-banner";
import { SelectBuyerModal } from "./select-buyer-modal";

interface TradeStatusBannerProps {
  room: ChatRoom;
  currentUser: SaleAuthor;
  opponent: SaleAuthor;
}

export const TradeStatusBanner = ({
  room,
  currentUser,
  opponent,
}: TradeStatusBannerProps) => {
  const t = useTranslations("chat.trade.status_banner");
  const tCancelDialog = useTranslations("chat.trade.cancel_selection_dialog");
  const tVerify = useTranslations("auth.verification.alert.actions");
  const tOrder = useTranslations("order.detail");
  const confirm = useConfirm();
  const authUser = useAuthStore((state) => state.user);

  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const isPaymentFeatureEnabled =
    process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED === "true";

  const sellerId =
    room?.usedBookSale?.user?.id ?? (room?.usedBookSale as any)?.userId;
  const isSeller = Boolean(
    currentUser?.id && sellerId && currentUser.id === sellerId,
  );
  const isBuyer = Boolean(
    currentUser?.id && sellerId && currentUser.id !== sellerId,
  );

  // 위젯은 닫혀도 언마운트되지 않으므로, 5초 주기 주문 폴링을 막기 위해
  // 노출 여부를 조회 조건에 포함
  const isChatOpen = useChatStore((state) => state.isChatOpen);

  const { data: order, isLoading: isOrderLoading } = useActiveOrderByRoomQuery(
    room?.id,
    {
      enabled: Boolean(room?.id) && isPaymentFeatureEnabled && isChatOpen,
    },
  );

  const cancelSelectionMutation = useCancelSelectionMutation({
    onSuccess: () => {
      toast.success(tCancelDialog("success"));
    },
    onError: (error) => {
      toast.error(tCancelDialog("error", { error: error.message || "" }));
    },
  });

  const confirmPurchaseMutation = useConfirmPurchaseMutation({
    onSuccess: () => {
      toast.success(t("buyer_desc.CONFIRMED"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCancelSelection = async () => {
    if (!order) return;
    const isConfirmed = await confirm({
      title: tCancelDialog("title"),
      description: tCancelDialog("description"),
      confirmText: tCancelDialog("confirm"),
      variant: "destructive",
    });

    if (isConfirmed) {
      cancelSelectionMutation.mutate(order.id);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!order) return;
    const isConfirmed = await confirm({
      title: tOrder("confirm_purchase_title"),
      description: tOrder("confirm_purchase_desc"),
      confirmText: tOrder("action_confirm"),
    });

    if (isConfirmed) {
      confirmPurchaseMutation.mutate(order.id);
    }
  };

  const handleOpenSelectModal = () => {
    if (authUser && !authUser.isEmailVerified) {
      setIsVerificationModalOpen(true);
      return;
    }
    setIsSelectModalOpen(true);
  };

  if (!room || !room.usedBookSale) {
    return null;
  }

  // 1. 직거래 전용인 경우
  // 결제 봉인 여부와 무관하게 노출한다. 직거래는 결제 없이 진행되는
  // 거래이므로, 결제 플래그로 함께 가리면 채팅방에서 거래 안내가 통째로
  // 사라진다.
  if (room.usedBookSale.tradeMethod === TradeMethod.DIRECT_ONLY) {
    return (
      <DirectTradeBanner
        room={room}
        currentUser={currentUser}
        opponent={opponent}
      />
    );
  }

  // 여기부터는 주문(결제) 기반 화면이므로 결제 기능이 꺼져 있으면 노출하지 않는다.
  if (!isPaymentFeatureEnabled) {
    return null;
  }

  // 2. 다른 구매자와 거래 진행 중인 경우 (주문 정보 로딩 완료 후에만 안전하게 판단)
  const isOtherBuyerTrading =
    !isOrderLoading &&
    room.usedBookSale.status === SaleStatus.RESERVED &&
    (!order ||
      order.status === OrderStatus.CANCELLED ||
      (order.buyerId !== currentUser?.id &&
        order.sellerId !== currentUser?.id));

  if (isOtherBuyerTrading) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
        <span className="flex items-center gap-1.5 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          {t("other_trading_hint")}
        </span>
      </div>
    );
  }

  // 3. 아직 주문이 생성되지 않은 경우 (판매중)
  if (!order || order.status === OrderStatus.CANCELLED) {
    const opponentParticipant = room.participants?.find(
      (p) => p.user?.id === opponent?.id,
    );
    const isOpponentLeft = opponentParticipant?.isActive === false;
    const isOpponentWithdrawn = Boolean(opponent?.deletedAt);
    const isOpponentInactive = isOpponentLeft || isOpponentWithdrawn;

    if (isOpponentInactive) {
      return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            {t("opponent_left_hint")}
          </span>
        </div>
      );
    }

    if (
      isSeller &&
      room.usedBookSale.status === SaleStatus.FOR_SALE &&
      opponent
    ) {
      return (
        <>
          <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50/95 dark:bg-stone-900/95 border-b border-stone-200 dark:border-stone-800">
            <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">
              {t("seller_start_prompt")}
            </span>
            <Button
              size="sm"
              className="h-7 text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 gap-1 shadow-2xs rounded-lg cursor-pointer"
              onClick={handleOpenSelectModal}
            >
              <ShoppingBagIcon className="w-3.5 h-3.5" />
              {t("btn_select_buyer")}
            </Button>
          </div>
          <SelectBuyerModal
            open={isSelectModalOpen}
            onOpenChange={setIsSelectModalOpen}
            room={room}
            buyer={opponent}
          />
          <EmailVerificationModal
            open={isVerificationModalOpen}
            onOpenChange={setIsVerificationModalOpen}
            actionName={tVerify("select_buyer")}
          />
        </>
      );
    }
    return null;
  }

  // 4. 주문이 존재하는 경우
  const getStatusConfig = () => {
    switch (order.status) {
      case OrderStatus.AWAITING_PAYMENT:
        return {
          icon: (
            <ClockIcon className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
          ),
          titleColor: "text-stone-900 dark:text-stone-100",
        };
      case OrderStatus.PAID:
        return {
          icon: (
            <BoxIcon className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
          ),
          titleColor: "text-stone-900 dark:text-stone-100",
        };
      case OrderStatus.SHIPPED:
        return {
          icon: (
            <TruckFastIcon className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
          ),
          titleColor: "text-stone-900 dark:text-stone-100",
        };
      case OrderStatus.DELIVERED:
        return {
          icon: (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ),
          titleColor: "text-emerald-600 dark:text-emerald-400",
        };
      case OrderStatus.CONFIRMED:
        return {
          icon: (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ),
          titleColor: "text-emerald-600 dark:text-emerald-400",
        };
      case OrderStatus.DISPUTED:
        return {
          icon: (
            <AlertCircle className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
          ),
          titleColor: "text-stone-800 dark:text-stone-200",
        };
      case OrderStatus.CANCELLED:
      default:
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-stone-400" />,
          titleColor: "text-stone-500 dark:text-stone-400",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="px-3.5 py-2.5 bg-stone-50/95 dark:bg-stone-900/95 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 transition-colors shrink-0"
      >
        {/* 좌측: 아이콘 + 상태 텍스트 (뒷배경 제거 & 완벽한 수직 중앙 정렬) + 금액 or 운송장 번호 */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex items-center justify-center shrink-0">
              {config.icon}
            </div>
            <span
              className={`text-xs font-bold leading-none shrink-0 ${config.titleColor}`}
            >
              {t(`status_title.${order.status}`)}
            </span>
          </div>

          {order.status === OrderStatus.SHIPPED &&
          order.carrier &&
          order.trackingNumber ? (
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 truncate">
              · {order.carrier}{" "}
              <span className="font-mono">{order.trackingNumber}</span>
            </span>
          ) : order.amount ? (
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300 shrink-0">
              ·{" "}
              <PriceDisplay
                value={order.amount}
                className="text-xs font-bold text-stone-900 dark:text-stone-100 tabular-nums"
                unitClassName="font-bold"
              />
            </span>
          ) : null}
        </div>

        {/* 우측: 액션 버튼 영역 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {order.status === OrderStatus.AWAITING_PAYMENT && isBuyer && (
            <Button
              asChild
              size="sm"
              className="h-7 text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 font-medium gap-1 shadow-2xs rounded-lg cursor-pointer"
            >
              <Link href={PATHS.ORDER_PAYMENT(order.id)}>
                <CardPosIcon className="w-3.5 h-3.5" />
                {t("btn_pay")}
              </Link>
            </Button>
          )}

          {order.status === OrderStatus.AWAITING_PAYMENT && isSeller && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer"
              onClick={handleCancelSelection}
              disabled={cancelSelectionMutation.isPending}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {t("btn_cancel_selection")}
            </Button>
          )}

          {order.status === OrderStatus.DELIVERED && isBuyer && (
            <Button
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs font-medium rounded-lg cursor-pointer"
              onClick={handleConfirmPurchase}
              disabled={confirmPurchaseMutation.isPending}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("btn_confirm_purchase")}
            </Button>
          )}

          {/* 주문 상세 링크 */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 px-1.5 gap-0.5 rounded-lg cursor-pointer"
          >
            <Link href={PATHS.ORDER_DETAIL(order.id)}>
              {t("btn_view_order")}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
