"use client";

import { Order, OrderStatus, TradeCompletionMethod } from "@bookjeok/core";
import {
  useCancelOrderMutation,
  useCancelSelectionMutation,
  useConfirmPurchaseMutation,
  useMyTradeReviewEligibilityQuery,
} from "@bookjeok/react-query";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useOpenChatRoom } from "@/features/chat/hooks/use-open-chat-room";
import { useConfirm } from "@/features/confirm";
import { TradeReviewModal } from "@/features/trade/components/review/trade-review-modal";
import {
  BookIcon,
  BoxIcon,
  CardPosIcon,
  ClockIcon,
  CopySuccessIcon,
  DocumentCopyIcon,
  QuoteUpCircleIcon,
  ShieldSecurityIcon,
  TruckFastIcon,
} from "@/shared/components/icons";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  RotateCcw,
  User,
  XCircle,
} from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import { Separator } from "@/shared/components/shadcn/separator";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatCurrency } from "@/shared/utils/format-currency";
import { formatDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { DisputeModal } from "../modals/dispute-modal";
import { ShippingFormModal } from "../modals/shipping-form-modal";
import { OrderStatusTimeline } from "./order-status-timeline";

interface OrderDetailCardProps {
  order: Order;
}

export const OrderDetailCard = ({ order }: OrderDetailCardProps) => {
  const t = useTranslations("order.detail");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const confirm = useConfirm();
  const currentUser = useAuthStore((state) => state.user);
  const openChatRoom = useOpenChatRoom();

  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // 후기는 주문이 아니라 거래 완료 기록에 붙으므로, 작성 여부도 거기서 읽는다.
  const { data: reviewEligibility } = useMyTradeReviewEligibilityQuery(
    order.completionId ?? undefined,
    { enabled: Boolean(order.completionId) },
  );
  const hasWrittenReview = Boolean(reviewEligibility?.myReview);
  const [hasCopiedTracking, setHasCopiedTracking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const isBuyer = currentUser?.id === order.buyerId;
  const isSeller = currentUser?.id === order.sellerId;

  // 결제 만료 타이머 (AWAITING_PAYMENT 일 때)
  useEffect(() => {
    if (order.status !== OrderStatus.AWAITING_PAYMENT || !order.expiresAt)
      return;

    const calculateTimeLeft = () => {
      const difference = new Date(order.expiresAt!).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft("00:00:00");
        return;
      }
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [order.status, order.expiresAt]);

  // 뮤테이션들
  const cancelSelectionMutation = useCancelSelectionMutation({
    onSuccess: () => {
      toast.success(t("cancel_selection_desc"));
    },
    onError: (err) => {
      toast.error(err.message || t("toast_cancel_selection_error"));
    },
  });

  const confirmPurchaseMutation = useConfirmPurchaseMutation({
    onSuccess: () => {
      toast.success(t("toast_confirm_success"));
      setIsReviewModalOpen(true);
    },
    onError: (err) => {
      toast.error(err.message || t("toast_confirm_error"));
    },
  });

  const cancelOrderMutation = useCancelOrderMutation({
    onSuccess: () => {
      toast.success(t("toast_cancel_success"));
    },
    onError: (err) => {
      toast.error(err.message || t("toast_cancel_error"));
    },
  });

  const handleCancelSelection = async () => {
    const isConfirmed = await confirm({
      title: t("cancel_selection_title"),
      description: t("cancel_selection_desc"),
      confirmText: t("btn_cancel_selection_short"),
      variant: "destructive",
    });
    if (isConfirmed) {
      cancelSelectionMutation.mutate(order.id);
    }
  };

  const handleConfirmPurchase = async () => {
    const isConfirmed = await confirm({
      title: t("confirm_purchase_title"),
      description: t("confirm_purchase_desc"),
      confirmText: t("action_confirm"),
    });
    if (isConfirmed) {
      confirmPurchaseMutation.mutate(order.id);
    }
  };

  const handleCancelOrder = async () => {
    const isConfirmed = await confirm({
      title: t("cancel_order_title"),
      description: t("cancel_order_desc"),
      confirmText: t("action_cancel"),
      variant: "destructive",
    });
    if (isConfirmed) {
      cancelOrderMutation.mutate({ orderId: order.id });
    }
  };

  const handleCopyTracking = () => {
    if (!order.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber);
    setHasCopiedTracking(true);
    toast.success(t("copied_tracking"));
    setTimeout(() => setHasCopiedTracking(false), 2000);
  };

  const buyerProfileImg = getProfileImageUrl(order.buyer?.profileImageUrl);
  const sellerProfileImg = getProfileImageUrl(order.seller?.profileImageUrl);

  return (
    <div className="space-y-6">
      {/* 1. 상단 헤더 & 주문 메타 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <span>{t("order_number")}:</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
              {order.id}
            </span>
            <span>·</span>
            <span>{formatDate(order.createdAt, locale, "dateTime")}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {t("page_title")}
          </h1>
        </div>

        {/* 결제 타이머 배지 (결제 대기 중일 때) */}
        {order.status === OrderStatus.AWAITING_PAYMENT && timeLeft && (
          <div className="flex items-center gap-2 rounded-xl bg-stone-100 dark:bg-stone-800 px-3 py-1.5 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-semibold self-start sm:self-auto">
            <ClockIcon className="h-3.5 w-3.5 text-stone-600 dark:text-stone-400" />
            <span>{t("expiry_countdown")}:</span>
            <span className="font-mono text-sm font-bold">{timeLeft}</span>
          </div>
        )}
      </div>

      {/* 2. 상태 타임라인 */}
      <OrderStatusTimeline order={order} />

      {/* 3. 본문 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* 좌측 메인 정보: 도서 + 배송지/배송현황 */}
        <div className="md:col-span-7 space-y-6">
          {/* 도서 정보 카드 */}
          <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs bg-white dark:bg-stone-900/80">
            <CardHeader className="bg-stone-50/60 dark:bg-stone-800/40 pb-3 border-b border-stone-100 dark:border-stone-800">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <BookIcon className="h-4 w-4 text-stone-700 dark:text-stone-300" />
                {t("book_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="flex gap-4">
                {/* 도서 커버 */}
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shadow-2xs">
                  {order.sale?.book?.image ||
                  (order.sale?.imageUrls && order.sale.imageUrls[0]) ? (
                    <Image
                      src={
                        (order.sale?.imageUrls && order.sale.imageUrls[0]) ||
                        order.sale?.book?.image ||
                        ""
                      }
                      alt={order.sale?.title || t("alt_book")}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-400">
                      <BookIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* 도서 텍스트 정보 */}
                <div className="flex flex-col justify-between min-w-0 flex-1">
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 line-clamp-2 text-sm sm:text-base leading-snug">
                      {order.sale?.title || t("fallback_book_title")}
                    </h3>
                    {order.sale?.book && (
                      <p className="text-xs text-stone-500 mt-1">
                        {order.sale.book.title} · {order.sale.book.author}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-dashed border-stone-200 dark:border-stone-800">
                    <span className="text-xs text-stone-500">
                      {t("sale_price")}
                    </span>
                    <span className="font-bold text-base text-stone-900 dark:text-stone-100 tabular-nums">
                      {formatCurrency(order.amount, locale, tCommon("won"))}
                    </span>
                  </div>
                </div>
              </div>

              {order.saleId && (
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-right">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 gap-1 text-stone-600 dark:text-stone-400 hover:text-stone-900"
                  >
                    <Link href={PATHS.BOOK_SALES_DETAIL(String(order.saleId))}>
                      {t("view_sale")}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 배송지 및 배송 정보 카드 */}
          <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs bg-white dark:bg-stone-900/80">
            <CardHeader className="bg-stone-50/60 dark:bg-stone-800/40 pb-3 border-b border-stone-100 dark:border-stone-800">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <TruckFastIcon className="h-4 w-4 text-stone-700 dark:text-stone-300" />
                {t("shipping_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* 운송장 번호 영역 */}
              {order.carrier && order.trackingNumber ? (
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                      {order.carrier}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-[10px]"
                    >
                      {t("shipping_in_progress")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                      {order.trackingNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                        onClick={handleCopyTracking}
                      >
                        {hasCopiedTracking ? (
                          <>
                            <CopySuccessIcon className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{t("copied")}</span>
                          </>
                        ) : (
                          <>
                            <DocumentCopyIcon className="h-3.5 w-3.5" />
                            <span>{t("copy_tracking")}</span>
                          </>
                        )}
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
                      >
                        <a
                          href={`https://search.naver.com/search.naver?query=${encodeURIComponent(
                            `${order.carrier} ${order.trackingNumber}`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>{t("tracking_track_btn")}</span>
                          <ExternalLink className="h-3 w-3 text-stone-400" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-stone-200 dark:border-stone-800 p-4 text-center text-xs text-stone-400">
                  <BoxIcon className="h-6 w-6 mx-auto mb-1.5 text-stone-300 dark:text-stone-600" />
                  {t("no_tracking_yet")}
                </div>
              )}

              {/* 배송지 스냅샷 */}
              {order.recipientName ? (
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>{order.recipientName}</span>
                    <span className="text-stone-500 font-mono">
                      {order.recipientPhone}
                    </span>
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                    [{order.zipCode}] {order.address}{" "}
                    {order.addressDetail || ""}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-stone-400">
                  {t("shipping_pending_desc")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 우측 사이드바: 결제 명세 + 거래 당사자 + 액션 바 */}
        <div className="md:col-span-5 space-y-6">
          {/* 결제 정보 카드 */}
          <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs bg-white dark:bg-stone-900/80">
            <CardHeader className="bg-stone-50/60 dark:bg-stone-800/40 pb-3 border-b border-stone-100 dark:border-stone-800">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <CardPosIcon className="h-4 w-4 text-stone-700 dark:text-stone-300" />
                {t("payment_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">{t("book_price")}</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                  {formatCurrency(order.amount, locale, tCommon("won"))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t("shipping_fee")}</span>
                <span className="text-stone-900 dark:text-stone-100 font-medium">
                  {t("shipping_free")}
                </span>
              </div>

              <Separator className="bg-stone-100 dark:bg-stone-800" />

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {t("total_amount")}
                </span>
                <span className="text-lg font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                  {formatCurrency(order.amount, locale, tCommon("won"))}
                </span>
              </div>

              {order.paidAt && (
                <div className="flex justify-between text-[11px] text-stone-400 pt-1">
                  <span>{t("paid_at")}</span>
                  <span>{formatDate(order.paidAt, locale, "dateTime")}</span>
                </div>
              )}

              {/* 에스크로 보호 뱃지 */}
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-stone-50 dark:bg-stone-800/40 p-2.5 border border-stone-200/80 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300">
                <ShieldSecurityIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t("escrow_protecting")}</span>
              </div>
            </CardContent>
          </Card>

          {/* 거래 당사자 정보 카드 */}
          <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs bg-white dark:bg-stone-900/80">
            <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
              {/* 판매자 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 shrink-0">
                    {sellerProfileImg ? (
                      <Image
                        src={sellerProfileImg}
                        alt={t("fallback_seller")}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="h-4 w-4 text-stone-400 m-auto" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">
                      {t("seller_info")}
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {order.seller?.nickname || t("fallback_seller")}
                    </span>
                  </div>
                </div>
                {order.seller?.handle && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2 text-stone-600 hover:text-stone-900"
                  >
                    <Link href={PATHS.USER_PROFILE(order.seller.handle)}>
                      {t("profile")}
                    </Link>
                  </Button>
                )}
              </div>

              <Separator className="bg-stone-100 dark:bg-stone-800" />

              {/* 구매자 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 shrink-0">
                    {buyerProfileImg ? (
                      <Image
                        src={buyerProfileImg}
                        alt={t("fallback_buyer")}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="h-4 w-4 text-stone-400 m-auto" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">
                      {t("buyer_info")}
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {order.buyer?.nickname || t("fallback_buyer")}
                    </span>
                  </div>
                </div>
                {order.buyer?.handle && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2 text-stone-600 hover:text-stone-900"
                  >
                    <Link href={PATHS.USER_PROFILE(order.buyer.handle)}>
                      {t("profile")}
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 액션 버튼 바 */}
          <div className="space-y-2 pt-1">
            {/* 구매자: 결제 대기 중 -> 결제하기 */}
            {isBuyer && order.status === OrderStatus.AWAITING_PAYMENT && (
              <Button
                asChild
                size="lg"
                className="w-full font-bold h-11 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs"
              >
                <Link href={PATHS.ORDER_PAYMENT(order.id)}>
                  <CardPosIcon className="h-4 w-4 mr-2" />
                  {t("action_pay")} (
                  {formatCurrency(order.amount, locale, tCommon("won"))})
                </Link>
              </Button>
            )}

            {/* 판매자: 결제 대기 중 -> 구매자 지정 취소 */}
            {isSeller && order.status === OrderStatus.AWAITING_PAYMENT && (
              <Button
                variant="outline"
                size="lg"
                className="w-full border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 h-11 rounded-xl"
                onClick={handleCancelSelection}
                disabled={cancelSelectionMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("action_cancel_selection")}
              </Button>
            )}

            {/* 판매자: 결제 완료 -> 운송장 등록 모달 */}
            {isSeller && order.status === OrderStatus.PAID && (
              <Button
                size="lg"
                className="w-full font-bold h-11 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                onClick={() => setIsShippingModalOpen(true)}
              >
                <TruckFastIcon className="h-4 w-4 mr-2" />
                {t("action_ship")}
              </Button>
            )}

            {/* 구매자: 배송 완료 -> 구매확정 / 분쟁 제기 */}
            {isBuyer && order.status === OrderStatus.DELIVERED && (
              <div className="space-y-2">
                <Button
                  size="lg"
                  className="w-full font-bold h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium"
                  onClick={handleConfirmPurchase}
                  disabled={confirmPurchaseMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t("action_confirm")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl"
                  onClick={() => setIsDisputeModalOpen(true)}
                >
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-stone-500" />
                  {t("action_dispute")}
                </Button>
              </div>
            )}

            {/* 구매자: 구매확정 완료 -> 거래 후기 작성 / 작성 완료 표시 */}
            {isBuyer &&
              order.status === OrderStatus.CONFIRMED &&
              (!hasWrittenReview ? (
                <Button
                  size="lg"
                  className="w-full font-bold h-11 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs cursor-pointer"
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  <QuoteUpCircleIcon className="h-4 w-4 mr-2" />
                  {t("action_review")}
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("review_done")}</span>
                </div>
              ))}

            {/* 채팅방 바로가기 (플로팅 채팅창 열기) */}
            {order.chatRoomId && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-9 rounded-xl border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                onClick={() => {
                  openChatRoom(order.chatRoomId!);
                }}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-stone-500" />
                {t("action_chat")}
              </Button>
            )}

            {/* 배송 전 단계 양측 취소 (하단에 차분한 위험 액션으로 배치) */}
            {(isBuyer || isSeller) && order.status === OrderStatus.PAID && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-8 text-stone-400 hover:text-rose-600 dark:text-stone-500 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                onClick={handleCancelOrder}
                disabled={cancelOrderMutation.isPending}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5 text-stone-400 group-hover:text-rose-600" />
                {t("action_cancel")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 운송장 등록 모달 */}
      <ShippingFormModal
        orderId={order.id}
        open={isShippingModalOpen}
        onOpenChange={setIsShippingModalOpen}
      />

      {/* 분쟁 제기 모달 */}
      <DisputeModal
        orderId={order.id}
        open={isDisputeModalOpen}
        onOpenChange={setIsDisputeModalOpen}
      />

      {/* 거래 후기 작성 모달 */}
      {order.completionId && (
        <TradeReviewModal
          completionId={order.completionId}
          targetRole="SELLER"
          method={TradeCompletionMethod.DELIVERY}
          targetUserNickname={order.seller?.nickname}
          open={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
        />
      )}
    </div>
  );
};
