"use client";

import { Order, OrderStatus } from "@bookjeok/core";
import { useCancelSelectionMutation } from "@bookjeok/react-query";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { toast } from "sonner";

import { useOpenChatRoom } from "@/features/chat/hooks/use-open-chat-room";
import { useConfirm } from "@/features/confirm";
import {
  BookIcon,
  BoxIcon,
  ClockIcon,
  TruckFastIcon,
} from "@/shared/components/icons";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  MapPin,
  MessageSquare,
  RotateCcw,
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

import { ShippingFormModal } from "../modals/shipping-form-modal";

interface SalesOrderCardProps {
  order: Order;
}

export const SalesOrderCard = ({ order }: SalesOrderCardProps) => {
  const t = useTranslations("order.sales_orders.card");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const confirm = useConfirm();
  const openChatRoom = useOpenChatRoom();

  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);

  const cancelSelectionMutation = useCancelSelectionMutation({
    onSuccess: () => {
      toast.success("구매자 지정이 취소되었습니다.");
    },
    onError: (err) => {
      toast.error(err.message || "지정 취소에 실패했습니다.");
    },
  });

  const handleCancelSelection = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isConfirmed = await confirm({
      title: "구매자 지정 취소",
      description:
        "구매자 지정을 취소하시겠습니까? 판매글이 다시 판매중 상태로 변경됩니다.",
      confirmText: "지정 취소",
      variant: "destructive",
    });

    if (isConfirmed) {
      cancelSelectionMutation.mutate(order.id);
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
            발송 요청
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
            거래 완료
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
            취소됨
          </Badge>
        );
    }
  };

  const buyerProfileImg = getProfileImageUrl(order.buyer?.profileImageUrl);
  const bookCover =
    (order.sale?.imageUrls && order.sale.imageUrls[0]) ||
    order.sale?.book?.image;

  return (
    <>
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
                {order.sale?.title || "판매 도서"}
              </Link>

              {order.sale?.book && (
                <p className="text-xs text-stone-500 line-clamp-1">
                  {order.sale.book.title} · {order.sale.book.author}
                </p>
              )}

              {/* 구매자 정보 */}
              <div className="flex items-center gap-1.5 pt-0.5 text-xs text-stone-500">
                <div className="relative h-4 w-4 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 shrink-0">
                  {buyerProfileImg ? (
                    <Image
                      src={buyerProfileImg}
                      alt="구매자"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="h-3 w-3 text-stone-400 m-auto" />
                  )}
                </div>
                <span className="truncate">
                  {t("buyer")}: {order.buyer?.nickname || "구매자"}
                </span>
              </div>

              {/* 배송지 스냅샷 요약 */}
              {order.recipientName && order.address && (
                <div className="flex items-center gap-1 text-[11px] text-stone-500 pt-0.5 line-clamp-1">
                  <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                  <span className="truncate">
                    {order.recipientName} · {order.address}{" "}
                    {order.addressDetail || ""}
                  </span>
                </div>
              )}

              {/* 운송장 번호 */}
              {order.carrier && order.trackingNumber && (
                <div className="text-[11px] text-stone-600 dark:text-stone-400 font-mono pt-0.5">
                  {order.carrier} {order.trackingNumber}
                </div>
              )}
            </div>
          </div>

          {/* 하단 바: 정산 예정 금액 + 액션 버튼 */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-stone-400">정산금액:</span>
              <span className="text-base font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                {formatCurrency(order.amount, locale, tCommon("won"))}
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* 결제완료 -> 운송장 등록 버튼 */}
              {order.status === OrderStatus.PAID && (
                <Button
                  size="sm"
                  className="h-8 text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 gap-1 shadow-2xs rounded-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsShippingModalOpen(true);
                  }}
                >
                  <TruckFastIcon className="h-3.5 w-3.5" />
                  {t("btn_ship")}
                </Button>
              )}

              {/* 결제대기 -> 지정 취소 버튼 */}
              {order.status === OrderStatus.AWAITING_PAYMENT && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                  onClick={handleCancelSelection}
                  disabled={cancelSelectionMutation.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  {t("btn_cancel_selection")}
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
      </Card>

      {/* 운송장 등록 모달 */}
      <ShippingFormModal
        orderId={order.id}
        open={isShippingModalOpen}
        onOpenChange={setIsShippingModalOpen}
      />
    </>
  );
};
