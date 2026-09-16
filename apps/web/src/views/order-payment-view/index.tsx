"use client";

import { OrderStatus } from "@bookjeok/core";
import { useOrderDetailQuery } from "@bookjeok/react-query";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmailVerificationAlert } from "@/features/auth/components/email-verification-alert";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  AddressInput,
  EscrowInfoCard,
  PaymentSummary,
  savePendingOrderShipping,
  ShippingAddressFormValues,
} from "@/features/order";
import { CardPosIcon, ClockIcon } from "@/shared/components/icons";
import {
  AlertCircle,
  ArrowLeft,
  Lock,
  RefreshCw,
  Wallet,
} from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface OrderPaymentViewProps {
  orderId: string;
}

type PaymentMethodType = "CARD" | "TRANSFER" | "VIRTUAL_ACCOUNT";

export const OrderPaymentView = ({ orderId }: OrderPaymentViewProps) => {
  const t = useTranslations("order.payment");
  const tVerify = useTranslations("auth.verification.alert");
  const locale = useLocale();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const { data: order, isLoading, error } = useOrderDetailQuery(orderId);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("CARD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const [addressValues, setAddressValues] = useState<ShippingAddressFormValues>(
    {
      recipientName: "",
      recipientPhone: "",
      zipCode: "",
      address: "",
      addressDetail: "",
      deliveryMemo: "",
    },
  );

  const [errors, setErrors] = useState<
    Partial<Record<keyof ShippingAddressFormValues, string>>
  >({});

  // 로그인 사용자 정보가 있으면 이름 초기값 세팅
  useEffect(() => {
    if (currentUser) {
      setAddressValues((prev) => ({
        ...prev,
        recipientName: prev.recipientName || currentUser.nickname || "",
      }));
    }
  }, [currentUser]);

  // 만료 시간 카운트다운
  useEffect(() => {
    if (!order?.expiresAt) return;

    const calculateTimeLeft = () => {
      const difference = new Date(order.expiresAt!).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft("00:00:00");
        setIsExpired(true);
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
  }, [order?.expiresAt]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddressFormValues, string>> =
      {};

    if (!addressValues.recipientName.trim()) {
      newErrors.recipientName = t("errors.required_recipient_name");
    }

    const phoneDigits = addressValues.recipientPhone.replace(/[^0-9]/g, "");
    if (!phoneDigits) {
      newErrors.recipientPhone = t("errors.required_recipient_phone");
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      newErrors.recipientPhone = t("errors.invalid_phone");
    }

    if (!addressValues.zipCode || !addressValues.address.trim()) {
      newErrors.address = t("errors.required_address");
    }

    if (!addressValues.addressDetail.trim()) {
      newErrors.addressDetail = t("errors.required_address_detail");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isEmailUnverified = !!currentUser && !currentUser.isEmailVerified;

  const handlePayment = async () => {
    if (!order) return;

    if (isEmailUnverified) {
      toast.error(t("email_unverified"));
      return;
    }

    if (!validateForm()) {
      toast.error(t("errors.required_address"));
      return;
    }

    setIsProcessing(true);

    try {
      // 1. 배송지 정보를 세션 스토리지에 저장
      savePendingOrderShipping({
        orderId: order.id,
        recipientName: addressValues.recipientName.trim(),
        recipientPhone: addressValues.recipientPhone.trim(),
        zipCode: addressValues.zipCode.trim(),
        address: addressValues.address.trim(),
        addressDetail: addressValues.addressDetail.trim(),
        deliveryMemo: addressValues.deliveryMemo?.trim(),
        savedAt: Date.now(),
      });

      // 2. 토스페이먼츠 SDK 로드
      const clientKey =
        process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY ||
        "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";

      const tossPayments = await loadTossPayments(clientKey);
      const customerKey = `buyer_${order.buyerId}`;
      const payment = tossPayments.payment({ customerKey });

      const origin = window.location.origin;
      const successUrl = `${origin}/${locale}${PATHS.ORDER_PAYMENT_SUCCESS}`;
      const failUrl = `${origin}/${locale}${PATHS.ORDER_PAYMENT_FAIL}`;

      // 3. 결제창 호출
      if (paymentMethod === "CARD") {
        await payment.requestPayment({
          method: "CARD",
          amount: {
            currency: "KRW",
            value: order.amount,
          },
          orderId: order.id,
          orderName:
            order.sale?.title || t("fallback_order_name", { id: order.id }),
          successUrl,
          failUrl,
          customerName: addressValues.recipientName.trim(),
          customerMobilePhone: addressValues.recipientPhone.replace(
            /[^0-9]/g,
            "",
          ),
          card: {
            useEscrow: false,
          },
        });
      } else if (paymentMethod === "TRANSFER") {
        await payment.requestPayment({
          method: "TRANSFER",
          amount: {
            currency: "KRW",
            value: order.amount,
          },
          orderId: order.id,
          orderName:
            order.sale?.title || t("fallback_order_name", { id: order.id }),
          successUrl,
          failUrl,
          customerName: addressValues.recipientName.trim(),
          customerMobilePhone: addressValues.recipientPhone.replace(
            /[^0-9]/g,
            "",
          ),
          transfer: {
            useEscrow: true,
          },
        });
      } else if (paymentMethod === "VIRTUAL_ACCOUNT") {
        await payment.requestPayment({
          method: "VIRTUAL_ACCOUNT",
          amount: {
            currency: "KRW",
            value: order.amount,
          },
          orderId: order.id,
          orderName:
            order.sale?.title || t("fallback_order_name", { id: order.id }),
          successUrl,
          failUrl,
          customerName: addressValues.recipientName.trim(),
          customerMobilePhone: addressValues.recipientPhone.replace(
            /[^0-9]/g,
            "",
          ),
          virtualAccount: {
            useEscrow: true,
            validHours: 24,
          },
        });
      }
    } catch (err: any) {
      console.error("Toss Payments request error:", err);
      if (err?.code === "USER_CANCEL" || err?.name === "UserCancelError") {
        toast.info(t("cancelled_toast"));
      } else {
        toast.error(err?.message || t("errors.toss_load_failed"));
      }
      setIsProcessing(false);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-8 w-48 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="md:col-span-5 space-y-4">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 에러 또는 주문 없음
  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {t("errors.order_not_found")}
        </h2>
        <p className="text-sm text-stone-500">{t("not_found_desc")}</p>
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

  // 구매자 본인 확인
  const isBuyer = currentUser?.id === order.buyerId;
  if (!isBuyer) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {t("not_buyer_notice")}
        </h2>
        <p className="text-sm text-stone-500">{t("not_buyer_desc")}</p>
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

  // 주문 상태가 결제 대기 중이 아님
  if (order.status !== OrderStatus.AWAITING_PAYMENT) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {t("invalid_status_notice")}
        </h2>
        <p className="text-sm text-stone-500">
          {t("current_status")}{" "}
          <Badge variant="secondary" className="bg-stone-200 dark:bg-stone-800">
            {order.status}
          </Badge>
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button
            asChild
            variant="outline"
            className="border-stone-200 dark:border-stone-700"
          >
            <Link href={PATHS.ORDER_DETAIL(order.id)}>
              {t("btn_order_detail")}
            </Link>
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

  // 시간 만료
  if (isExpired) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          <ClockIcon className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {t("expired_notice")}
        </h2>
        <p className="text-sm text-stone-500">{t("expired_desc")}</p>
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

  return (
    <div className="w-full space-y-6">
      {/* 헤더 & 상단 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 mb-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("btn_back")}
          </button>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            {t("checkout_title")}
          </h1>
        </div>

        {/* 타이머 배지 */}
        {timeLeft && (
          <div className="flex items-center gap-2 rounded-xl bg-stone-100 dark:bg-stone-800 px-3 py-1.5 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-semibold">
            <ClockIcon className="h-3.5 w-3.5 text-stone-600 dark:text-stone-400" />
            <span>{t("expires_in")}:</span>
            <span className="font-mono text-sm font-bold">{timeLeft}</span>
          </div>
        )}
      </div>

      {/* 이메일 미인증 안내 배너 */}
      {isEmailUnverified && (
        <EmailVerificationAlert
          title={tVerify("payment_title")}
          description={tVerify("payment_desc")}
          className="mb-2"
        />
      )}

      {/* 메인 2단 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* 좌측: 배송지 폼 + 결제수단 + 에스크로 안내 */}
        <div className="md:col-span-7 space-y-6">
          {/* 배송지 입력 카드 */}
          <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 shadow-2xs">
            <CardHeader className="bg-stone-50/60 dark:bg-stone-800/40 pb-3 border-b border-stone-100 dark:border-stone-800">
              <CardTitle className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {t("shipping_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <AddressInput
                values={addressValues}
                onChange={setAddressValues}
                errors={errors}
                disabled={isProcessing}
              />
            </CardContent>
          </Card>

          {/* 결제 수단 선택 카드 */}
          <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 shadow-2xs">
            <CardHeader className="bg-stone-50/60 dark:bg-stone-800/40 pb-3 border-b border-stone-100 dark:border-stone-800">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <CardPosIcon className="h-4 w-4 text-stone-700 dark:text-stone-300" />
                {t("method_title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === "CARD"
                      ? "border-stone-900 bg-stone-50 dark:bg-stone-800 dark:border-stone-100 text-stone-900 dark:text-stone-100 ring-1 ring-stone-900 dark:ring-stone-100 shadow-2xs font-semibold"
                      : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-500 dark:text-stone-400"
                  }`}
                >
                  <CardPosIcon className="h-5 w-5" />
                  <span>{t("method_card")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TRANSFER")}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === "TRANSFER"
                      ? "border-stone-900 bg-stone-50 dark:bg-stone-800 dark:border-stone-100 text-stone-900 dark:text-stone-100 ring-1 ring-stone-900 dark:ring-stone-100 shadow-2xs font-semibold"
                      : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-500 dark:text-stone-400"
                  }`}
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>{t("method_transfer")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("VIRTUAL_ACCOUNT")}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === "VIRTUAL_ACCOUNT"
                      ? "border-stone-900 bg-stone-50 dark:bg-stone-800 dark:border-stone-100 text-stone-900 dark:text-stone-100 ring-1 ring-stone-900 dark:ring-stone-100 shadow-2xs font-semibold"
                      : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-500 dark:text-stone-400"
                  }`}
                >
                  <Wallet className="h-5 w-5" />
                  <span>{t("method_virtual_account")}</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 에스크로 보호 안내 카드 */}
          <EscrowInfoCard />
        </div>

        {/* 우측: 결제 요약 & 결제 버튼 사이드바 */}
        <div className="md:col-span-5 space-y-4 md:sticky md:top-20">
          <PaymentSummary order={order} />

          {/* 결제하기 버튼 */}
          <Button
            size="lg"
            className="w-full text-sm font-bold h-12 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 shadow-xs transition-all cursor-pointer"
            onClick={handlePayment}
            disabled={isProcessing || isEmailUnverified}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
                {t("processing_payment")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t("btn_pay", { amount: order.amount.toLocaleString() })}
              </span>
            )}
          </Button>

          <p className="text-[11px] text-center text-stone-400 leading-relaxed px-2">
            {t("agreement")}
          </p>
        </div>
      </div>
    </div>
  );
};
