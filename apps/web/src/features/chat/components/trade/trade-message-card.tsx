"use client";

import { ChatMessage, OrderStatus } from "@bookjeok/core";
import { useOrderDetailQuery } from "@bookjeok/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { EmailVerificationModal } from "@/features/auth/components/email-verification-alert";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useChatStore } from "@/features/chat/stores/use-chat-store";
import {
  BoxIcon,
  CardPosIcon,
  ClockIcon,
  TruckFastIcon,
} from "@/shared/components/icons";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Handshake,
  RotateCcw,
  XCircle,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { PATHS } from "@/shared/constants/paths";

interface TradeMessageCardProps {
  message: ChatMessage;
  currentUserId?: number;
}

export const TradeMessageCard = ({
  message,
  currentUserId,
}: TradeMessageCardProps) => {
  const t = useTranslations("chat.trade.message_card");
  const tCommon = useTranslations("common");
  const authUser = useAuthStore((state) => state.user);

  const effectiveUserId = currentUserId ?? authUser?.id;

  const metadata = message.metadata || {};
  const status = metadata.status as OrderStatus | undefined;
  // 직거래·판매글 상태 안내는 주문이 없다. 주문 카드로 렌더링하면
  // 매칭되는 OrderStatus가 없어 "주문 취소"로 떨어진다.
  const tradeStatus = metadata.tradeStatus as
    | "RESERVED"
    | "COMPLETED"
    | "SOLD"
    | "OTHER_TRADING"
    | "BACK_ON_MARKET"
    | undefined;
  const orderId = (metadata.orderId || metadata.orderNumber) as
    | string
    | undefined;
  const amount = metadata.amount as number | undefined;
  const carrier = metadata.carrier as string | undefined;
  const trackingNumber = metadata.trackingNumber as string | undefined;
  const reason = (metadata.disputeReason || metadata.reason) as
    | string
    | undefined;

  const isPaymentFeatureEnabled =
    process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED === "true";

  // 위젯은 닫혀도 언마운트되지 않으므로, 노출되지 않는 동안에는 조회 중단
  // (폴링은 꺼져 있지만 창 포커스 시 재조회까지 차단)
  const isChatOpen = useChatStore((state) => state.isChatOpen);

  const { data: orderDetail } = useOrderDetailQuery(orderId, {
    enabled: Boolean(orderId) && isPaymentFeatureEnabled && isChatOpen,
    refetchInterval: false,
  });

  const isOrderExpired = Boolean(
    orderDetail?.expiresAt &&
      new Date(orderDetail.expiresAt).getTime() <= Date.now(),
  );

  const isOrderInactive = Boolean(
    orderDetail &&
      (orderDetail.status !== OrderStatus.AWAITING_PAYMENT || isOrderExpired),
  );

  // 판매자 여부 판별 (판매자는 결제 버튼 비노출, 주문 상세 버튼만 노출)
  const sellerId =
    orderDetail?.sellerId ??
    message.chatRoom?.usedBookSale?.user?.id ??
    (message.chatRoom?.usedBookSale as any)?.userId;
  const isSeller = Boolean(
    effectiveUserId && sellerId && effectiveUserId === sellerId,
  );

  const handlePayClick = (e: React.MouseEvent) => {
    if (isOrderInactive) {
      e.preventDefault();
      toast.error(t("order_closed_toast"));
    }
  };

  const getTradeStatusDisplay = () => {
    switch (tradeStatus) {
      case "COMPLETED":
        return {
          icon: (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ),
          title: t("trade_title.COMPLETED"),
          titleColor: "text-emerald-600 dark:text-emerald-400",
        };
      case "RESERVED":
        return {
          icon: (
            <Handshake className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          ),
          title: t("trade_title.RESERVED"),
          titleColor: "text-stone-900 dark:text-stone-100",
        };
      case "SOLD":
        return {
          icon: (
            <CheckCircle2 className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          ),
          title: t("trade_title.SOLD"),
          titleColor: "text-stone-700 dark:text-stone-300",
        };
      case "OTHER_TRADING":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-stone-500" />,
          title: t("trade_title.OTHER_TRADING"),
          titleColor: "text-stone-700 dark:text-stone-300",
        };
      case "BACK_ON_MARKET":
      default:
        return {
          icon: (
            <RotateCcw className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          ),
          title: t("trade_title.BACK_ON_MARKET"),
          titleColor: "text-stone-900 dark:text-stone-100",
        };
    }
  };

  const getStatusDisplay = () => {
    if (tradeStatus) return getTradeStatusDisplay();

    switch (status) {
      case OrderStatus.AWAITING_PAYMENT:
        return {
          icon: (
            <ClockIcon className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          ),
          title: t("title.AWAITING_PAYMENT"),
          titleColor: "text-stone-900 dark:text-stone-100",
        };
      case OrderStatus.PAID:
        return {
          icon: (
            <BoxIcon className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          ),
          title: t("title.PAID"),
          titleColor: "text-stone-900 dark:text-stone-100",
        };
      case OrderStatus.SHIPPED:
        return {
          icon: (
            <TruckFastIcon className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          ),
          title: t("title.SHIPPED"),
          titleColor: "text-stone-900 dark:text-stone-100",
        };
      case OrderStatus.DELIVERED:
        return {
          icon: (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ),
          title: t("title.DELIVERED"),
          titleColor: "text-emerald-600 dark:text-emerald-400",
        };
      case OrderStatus.CONFIRMED:
        return {
          icon: (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ),
          title: t("title.CONFIRMED"),
          titleColor: "text-emerald-600 dark:text-emerald-400",
        };
      case OrderStatus.DISPUTED:
        return {
          icon: (
            <AlertTriangle className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          ),
          title: t("title.DISPUTED"),
          titleColor: "text-stone-800 dark:text-stone-200",
        };
      case OrderStatus.CANCELLED:
      default:
        return {
          icon: <XCircle className="w-4 h-4 text-stone-400" />,
          title: t("title.CANCELLED"),
          titleColor: "text-stone-500 dark:text-stone-400",
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className="flex justify-center my-3 w-full px-2">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 p-4 shadow-2xs transition-all">
        {/* 상단: 아이콘 + 상태 텍스트 (배경 박스 완전 제거 & 완벽한 수직 중앙 정렬) */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex items-center justify-center shrink-0">
              {display.icon}
            </div>
            <span
              className={`text-xs font-bold leading-none ${display.titleColor}`}
            >
              {display.title}
            </span>
          </div>
        </div>

        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mt-2.5 leading-snug">
          {message.content}
        </p>

        {/* 상세 메타 정보 (가격 폰트 통일 및 폰트 왜곡 해결) */}
        {(amount || (carrier && trackingNumber) || reason) && (
          <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 space-y-1.5 text-xs text-stone-500 dark:text-stone-400">
            {amount && (
              <div className="flex justify-between items-center">
                <span>{t("amount_label")}</span>
                <PriceDisplay
                  value={amount}
                  className="font-bold text-stone-900 dark:text-stone-100 text-sm tabular-nums"
                  unitClassName="font-medium text-xs"
                />
              </div>
            )}
            {carrier && trackingNumber && (
              <div className="flex justify-between items-center">
                <span>{t("tracking_label")}</span>
                <span className="font-mono font-medium text-stone-900 dark:text-stone-100">
                  {carrier} {trackingNumber}
                </span>
              </div>
            )}
            {reason && (
              <div className="flex justify-between items-start gap-2">
                <span className="shrink-0">{t("reason_label")}</span>
                <span className="text-right text-stone-700 dark:text-stone-300">
                  {reason}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 버튼 액션 */}
        {isPaymentFeatureEnabled && orderId && (
          <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
            {status === OrderStatus.AWAITING_PAYMENT &&
              !isSeller &&
              (isOrderInactive ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePayClick}
                  className="flex-1 h-8 text-xs font-medium gap-1 shadow-2xs rounded-lg opacity-60 cursor-not-allowed text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-transparent"
                  title={t("order_closed_toast")}
                >
                  <CardPosIcon className="w-3.5 h-3.5 text-stone-400" />
                  {t("btn_pay_now")}
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="flex-1 h-8 text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 font-medium gap-1 shadow-2xs rounded-lg cursor-pointer"
                >
                  <Link href={PATHS.ORDER_PAYMENT(orderId!)}>
                    <CardPosIcon className="w-3.5 h-3.5" />
                    {t("btn_pay_now")}
                  </Link>
                </Button>
              ))}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 bg-background rounded-lg cursor-pointer"
            >
              <Link href={PATHS.ORDER_DETAIL(orderId!)}>
                {t("btn_view_detail")}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
