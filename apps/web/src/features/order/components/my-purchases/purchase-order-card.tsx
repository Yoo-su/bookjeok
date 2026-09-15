"use client";

import { Order, OrderStatus, TradeCompletionMethod } from "@bookjeok/core";
import { useConfirmPurchaseMutation } from "@bookjeok/react-query";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { toast } from "sonner";

import { useOpenChatRoom } from "@/features/chat/hooks/use-open-chat-room";
import { useConfirm } from "@/features/confirm";
import { TradeReviewModal } from "@/features/trade/components/review/trade-review-modal";
import {
  BookIcon,
  BoxIcon,
  CardPosIcon,
  ClockIcon,
  QuoteUpCircleIcon,
  TruckFastIcon,
} from "@/shared/components/icons";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  User,
  XCircle,
} from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatCurrency } from "@/shared/utils/format-currency";
import { formatDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface PurchaseOrderCardProps {
  order: Order;
}

export const PurchaseOrderCard = ({ order }: PurchaseOrderCardProps) => {
  const t = useTranslations("order.purchases.card");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const confirm = useConfirm();
  const openChatRoom = useOpenChatRoom();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const confirmPurchaseMutation = useConfirmPurchaseMutation({
    onSuccess: () => {
      toast.success("구매가 정상적으로 확정되었습니다.");
      setIsReviewModalOpen(true);
    },
    onError: (err) => {
      toast.error(err.message || "구매확정 처리에 실패했습니다.");
    },
  });

  const handleConfirmPurchase = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isConfirmed = await confirm({
      title: "구매확정",
      description:
        "물품을 정상적으로 수령하셨다면 구매를 확정해주세요. 구매확정 후에는 취소가 불가합니다.",
      confirmText: "구매확정",
    });

    if (isConfirmed) {
      confirmPurchaseMutation.mutate(order.id);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.AWAITING_PAYMENT:
        return (
          <Badge className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 gap-1 text-[11px] font-medium">
            <ClockIcon className="h-3 w-3" />
            결제 대기
          </Badge>
        );
      case OrderStatus.PAID:
        return (
          <Badge className="bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 gap-1 text-[11px] font-medium">
            <BoxIcon className="h-3 w-3" />
            발송 대기
          </Badge>
        );
      case OrderStatus.SHIPPED:
        return (
          <Badge className="bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 gap-1 text-[11px] font-medium">
            <TruckFastIcon className="h-3 w-3" />
            배송 중
          </Badge>
        );
      case OrderStatus.DELIVERED:
        return (
          <Badge className="bg-emerald-600 text-white gap-1 text-[11px] font-medium">
            <CheckCircle2 className="h-3 w-3" />
            배송 완료
          </Badge>
        );
      case OrderStatus.CONFIRMED:
        return (
          <Badge
            variant="outline"
            className="border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 gap-1 text-[11px] font-medium"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            구매 확정
          </Badge>
        );
      case OrderStatus.DISPUTED:
        return (
          <Badge
            variant="outline"
            className="border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 gap-1 text-[11px] font-medium"
          >
            <AlertCircle className="h-3 w-3 text-stone-500" />
            분쟁 중
          </Badge>
        );
      case OrderStatus.CANCELLED:
      default:
        return (
          <Badge
            variant="secondary"
            className="gap-1 text-[11px] text-stone-400 bg-stone-100 dark:bg-stone-800 font-medium"
          >
            <XCircle className="h-3 w-3" />
            주문 취소
          </Badge>
        );
    }
  };

  const sellerProfileImg = getProfileImageUrl(order.seller?.profileImageUrl);
  const bookCover =
    (order.sale?.imageUrls && order.sale.imageUrls[0]) ||
    order.sale?.book?.image;

  return (
    <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-xs transition-all duration-200 bg-white dark:bg-stone-900/80 overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* 상단 메타: 주문일시, 주문번호, 상태 배지 */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
          <div className="flex items-center gap-1.5 text-stone-400">
            <span>{formatDate(order.createdAt, locale, "date")}</span>
            <span>·</span>
            <span className="font-mono">{order.id}</span>
          </div>
          <div>{getStatusBadge(order.status)}</div>
        </div>

        {/* 메인: 도서 썸네일 & 판매 정보 */}
        <div className="flex gap-3.5 items-start">
          {/* 도서 썸네일 */}
          <Link
            href={PATHS.ORDER_DETAIL(order.id)}
            className="relative h-22 w-16 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 group shadow-2xs"
          >
            {bookCover ? (
              <Image
                src={bookCover}
                alt={order.sale?.title || "도서"}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-400">
                <BookIcon className="h-5 w-5" />
              </div>
            )}
          </Link>

          {/* 도서 텍스트 */}
          <div className="flex-1 min-w-0 space-y-1">
            <Link
              href={PATHS.ORDER_DETAIL(order.id)}
              className="block font-bold text-stone-900 dark:text-stone-100 hover:text-stone-700 transition-colors text-sm line-clamp-1"
            >
              {order.sale?.title || "중고 도서"}
            </Link>

            {order.sale?.book && (
              <p className="text-xs text-stone-500 line-clamp-1">
                {order.sale.book.title} · {order.sale.book.author}
              </p>
            )}

            {/* 판매자 정보 */}
            <div className="flex items-center gap-1.5 pt-0.5 text-xs text-stone-500">
              <div className="relative h-4 w-4 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 shrink-0">
                {sellerProfileImg ? (
                  <Image
                    src={sellerProfileImg}
                    alt="판매자"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="h-3 w-3 text-stone-400 m-auto" />
                )}
              </div>
              <span className="truncate">
                {t("seller")}: {order.seller?.nickname || "판매자"}
              </span>
            </div>

            {/* 배송 정보 한 줄 */}
            {order.carrier && order.trackingNumber && (
              <div className="text-[11px] text-stone-600 dark:text-stone-400 font-mono pt-0.5">
                {order.carrier} {order.trackingNumber}
              </div>
            )}
          </div>
        </div>

        {/* 하단 바: 금액 + 액션 버튼 */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-stone-400">결제금액:</span>
            <span className="text-base font-bold text-stone-900 dark:text-stone-100 tabular-nums">
              {formatCurrency(order.amount, locale, tCommon("won"))}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* 결제하기 액션 */}
            {order.status === OrderStatus.AWAITING_PAYMENT && (
              <Button
                asChild
                size="sm"
                className="h-8 text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 gap-1 shadow-2xs rounded-lg"
              >
                <Link href={PATHS.ORDER_PAYMENT(order.id)}>
                  <CardPosIcon className="h-3.5 w-3.5" />
                  {t("btn_pay")}
                </Link>
              </Button>
            )}

            {/* 구매확정 액션 */}
            {order.status === OrderStatus.DELIVERED && (
              <Button
                size="sm"
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs rounded-lg font-medium"
                onClick={handleConfirmPurchase}
                disabled={confirmPurchaseMutation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("btn_confirm")}
              </Button>
            )}

            {/* 거래 후기 작성 액션 */}
            {order.status === OrderStatus.CONFIRMED && (
              <Button
                size="sm"
                className="h-8 text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 gap-1 shadow-2xs rounded-lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsReviewModalOpen(true);
                }}
              >
                <QuoteUpCircleIcon className="h-3.5 w-3.5" />
                {t("btn_review", { fallback: "후기 작성" })}
              </Button>
            )}

            {/* 채팅 버튼 (플로팅 채팅창 열기) */}
            {order.chatRoomId && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2.5 rounded-lg border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openChatRoom(order.chatRoomId!);
                }}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1 text-stone-500" />
                {t("btn_chat")}
              </Button>
            )}

            {/* 주문 상세 이동 */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-2.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
            >
              <Link href={PATHS.ORDER_DETAIL(order.id)}>
                {t("view_detail")}
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>

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
    </Card>
  );
};
