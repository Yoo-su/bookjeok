"use client";

import { getErrorMessage } from "@bookjeok/api-client";
import { Order } from "@bookjeok/core";
import { useConfirmPaymentMutation } from "@bookjeok/react-query";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  clearPendingOrderShipping,
  getPendingOrderShipping,
} from "@/features/order";
import {
  BoxIcon,
  ShieldSecurityIcon,
  TruckFastIcon,
} from "@/shared/components/icons";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Home,
  Loader2,
  Lock,
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

export const OrderPaymentSuccessView = () => {
  const t = useTranslations("order.payment.success");
  const locale = useLocale();
  const tCurrency = useTranslations("common");
  const tCommon = useTranslations("order.payment");
  const searchParams = useSearchParams();

  const paymentKey = searchParams.get("paymentKey");
  const rawOrderId = searchParams.get("orderId");
  const amountStr = searchParams.get("amount");

  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasTriggeredRef = useRef(false);

  const confirmPaymentMutation = useConfirmPaymentMutation({
    onSuccess: (data) => {
      setConfirmedOrder(data);
      if (rawOrderId) {
        clearPendingOrderShipping(rawOrderId);
      }
      toast.success(t("title"));
    },
    onError: (error) => {
      console.error("Payment confirmation failed:", error);
      const msg = getErrorMessage(error, t("confirm_error"));
      setErrorMessage(msg);
    },
  });

  const handleConfirm = () => {
    if (!paymentKey || !rawOrderId || !amountStr) {
      setErrorMessage(t("invalid_params"));
      return;
    }

    const shipping = getPendingOrderShipping(rawOrderId);
    const targetOrderId = shipping?.orderId || rawOrderId;

    confirmPaymentMutation.mutate({
      orderId: targetOrderId,
      payload: {
        paymentKey,
        amount: parseInt(amountStr, 10),
        recipientName: shipping?.recipientName || t("fallback_buyer"),
        recipientPhone: shipping?.recipientPhone || "010-0000-0000",
        zipCode: shipping?.zipCode || "00000",
        address: shipping?.address || t("fallback_address"),
        addressDetail: shipping?.addressDetail || undefined,
      },
    });
  };

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    if (paymentKey && rawOrderId && amountStr) {
      hasTriggeredRef.current = true;
      handleConfirm();
    }
  }, [paymentKey, rawOrderId, amountStr]);

  // 1. 파라미터 누락 에러
  if (!paymentKey || !rawOrderId || !amountStr) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {t("invalid_access_title")}
        </h2>
        <p className="text-sm text-stone-500">{t("invalid_access_desc")}</p>
        <div className="pt-2">
          <Button
            asChild
            variant="outline"
            className="border-stone-200 dark:border-stone-700"
          >
            <Link href={PATHS.HOME}>{t("btn_go_home")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 2. 승인 처리 중 로딩
  if (confirmPaymentMutation.isPending && !confirmedOrder) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {t("confirming_title")}
          </h2>
          <p className="text-sm text-stone-500">{t("confirming_desc")}</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-stone-500 bg-stone-50 dark:bg-stone-800/60 py-2.5 px-4 rounded-full w-fit mx-auto border border-stone-200 dark:border-stone-700">
          <Lock className="h-3.5 w-3.5 text-stone-700 dark:text-stone-300" />
          <span>{t("verifying")}</span>
        </div>
      </div>
    );
  }

  // 3. 승인 실패 에러
  if (errorMessage && !confirmedOrder) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {t("fail_title")}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            {errorMessage}
          </p>
        </div>
        <p className="text-xs text-stone-400">{t("fail_desc")}</p>
        <div className="pt-2 flex justify-center gap-3">
          <Button
            onClick={handleConfirm}
            className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900"
          >
            {t("btn_retry")}
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-stone-200 dark:border-stone-700"
          >
            <Link href={PATHS.HOME}>{t("btn_go_home")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 4. 승인 성공 완료 화면
  const displayOrder = confirmedOrder;
  const targetOrderId = displayOrder?.id || rawOrderId;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-0 space-y-6">
      {/* 성공 헤더 */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">{t("subtitle")}</p>
        </div>
      </div>

      {/* 4단계 거래 상태 타임라인 */}
      <Card className="border border-stone-200 dark:border-stone-800 shadow-2xs rounded-2xl bg-stone-50/60 dark:bg-stone-900/60">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold shadow-2xs">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {t("steps.step1")}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                <BoxIcon className="h-4 w-4" />
              </div>
              <span className="text-stone-500">{t("steps.step2")}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                <TruckFastIcon className="h-4 w-4" />
              </div>
              <span className="text-stone-500">{t("steps.step3")}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                <BoxIcon className="h-4 w-4" />
              </div>
              <span className="text-stone-500">{t("steps.step4")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 주문 및 배송 상세 카드 */}
      <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs bg-white dark:bg-stone-900/80">
        <CardHeader className="bg-stone-50/60 dark:bg-stone-800/40 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {t("order_summary")}
            </CardTitle>
            {displayOrder?.id && (
              <Badge
                variant="outline"
                className="font-mono text-[11px] border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400"
              >
                {displayOrder.id}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3.5 text-xs">
          {displayOrder?.sale && (
            <div className="flex justify-between items-start">
              <span className="text-stone-500">{tCommon("product_info")}</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100 text-right max-w-[260px] truncate">
                {displayOrder.sale.title}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone-500">{t("paid_amount")}</span>
            <span className="font-bold font-mono text-sm text-stone-900 dark:text-stone-100">
              {formatCurrency(
                parseInt(amountStr, 10),
                locale,
                tCurrency("won"),
              )}
            </span>
          </div>

          <Separator className="bg-stone-100 dark:bg-stone-800" />

          {/* 배송지 스냅샷 */}
          <div className="space-y-1">
            <span className="text-stone-400 block text-[11px] font-medium">
              {t("shipping_to")}
            </span>
            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/40 p-3 text-xs space-y-1 border border-stone-200/60 dark:border-stone-800">
              <div className="font-semibold text-stone-900 dark:text-stone-100">
                {displayOrder?.recipientName || t("fallback_recipient")} (
                {displayOrder?.recipientPhone || t("fallback_phone")})
              </div>
              <div className="text-stone-500 dark:text-stone-400">
                [{displayOrder?.zipCode || ""}] {displayOrder?.address || ""}{" "}
                {displayOrder?.addressDetail || ""}
              </div>
            </div>
          </div>

          {/* 에스크로 안내 */}
          <div className="flex items-start gap-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 p-3 text-xs text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800">
            <ShieldSecurityIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px] text-stone-500 dark:text-stone-400">
              {t("escrow_guide")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button
          asChild
          size="lg"
          className="flex-1 font-bold h-12 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 shadow-xs cursor-pointer"
        >
          <Link href={PATHS.ORDER_DETAIL(targetOrderId)}>
            {t("btn_order_detail")}
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="sm:w-36 h-12 rounded-xl border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
        >
          <Link href={PATHS.HOME}>
            <Home className="h-4 w-4 mr-1.5" />
            {t("btn_go_home")}
          </Link>
        </Button>
      </div>
    </div>
  );
};
