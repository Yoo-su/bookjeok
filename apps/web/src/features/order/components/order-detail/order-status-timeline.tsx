"use client";

import { Order, OrderStatus } from "@bookjeok/core";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { BoxIcon, ClockIcon, TruckFastIcon } from "@/shared/components/icons";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  XCircle,
} from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { formatDate } from "@/shared/utils/format-date";

interface OrderStatusTimelineProps {
  order: Order;
}

interface StepInfo {
  status: OrderStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  timestamp?: string | null;
}

export const OrderStatusTimeline = ({ order }: OrderStatusTimelineProps) => {
  const locale = useLocale();
  const t = useTranslations("order.detail");

  const normalSteps: StepInfo[] = [
    {
      status: OrderStatus.AWAITING_PAYMENT,
      label: t("timeline.awaiting_payment"),
      icon: ClockIcon,
      timestamp: order.createdAt,
    },
    {
      status: OrderStatus.PAID,
      label: t("timeline.paid"),
      icon: BoxIcon,
      timestamp: order.paidAt,
    },
    {
      status: OrderStatus.SHIPPED,
      label: t("timeline.shipped"),
      icon: TruckFastIcon,
      timestamp: order.shippedAt,
    },
    {
      status: OrderStatus.DELIVERED,
      label: t("timeline.delivered"),
      icon: BoxIcon,
      timestamp: order.deliveredAt,
    },
    {
      status: OrderStatus.CONFIRMED,
      label: t("timeline.confirmed"),
      icon: CheckCircle2,
      timestamp: order.confirmedAt,
    },
  ];

  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case OrderStatus.AWAITING_PAYMENT:
        return 0;
      case OrderStatus.PAID:
        return 1;
      case OrderStatus.SHIPPED:
        return 2;
      case OrderStatus.DELIVERED:
        return 3;
      case OrderStatus.CONFIRMED:
        return 4;
      default:
        return -1;
    }
  };

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isDisputed = order.status === OrderStatus.DISPUTED;

  return (
    <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs bg-white dark:bg-stone-900/80">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
            {t("status_timeline")}
          </span>
          {isCancelled && (
            <Badge
              variant="outline"
              className="border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 gap-1 text-xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              {t("timeline.cancelled")}
            </Badge>
          )}
          {isDisputed && (
            <Badge
              variant="outline"
              className="border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 gap-1 text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-stone-600" />
              {t("timeline.disputed")}
            </Badge>
          )}
        </div>

        {/* 5단계 타임라인 */}
        <div className="relative pt-1">
          {/* 가로 진행 바 (데스크톱) */}
          <div className="hidden sm:block absolute top-5.5 left-6 right-6 h-0.5 bg-stone-200 dark:bg-stone-800 -z-0">
            <div
              className="h-full bg-stone-900 dark:bg-stone-100 transition-all duration-500"
              style={{
                width:
                  currentStepIndex >= 0
                    ? `${(currentStepIndex / (normalSteps.length - 1)) * 100}%`
                    : "0%",
              }}
            />
          </div>

          <div className="grid grid-cols-5 gap-1 relative z-10 text-center">
            {normalSteps.map((step, idx) => {
              const isPast = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;
              const isFuture =
                currentStepIndex < idx || currentStepIndex === -1;
              const Icon = step.icon;

              let iconBg =
                "bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500 border-stone-200 dark:border-stone-700";
              let textColor = "text-stone-400 dark:text-stone-500";

              if (isPast) {
                iconBg =
                  "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100";
                textColor = "text-stone-900 dark:text-stone-100 font-semibold";
              } else if (isCurrent) {
                if (isCancelled) {
                  iconBg = "bg-stone-800 text-white border-stone-800";
                  textColor = "text-stone-800 dark:text-stone-200 font-bold";
                } else {
                  iconBg =
                    "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 ring-4 ring-stone-200 dark:ring-stone-800";
                  textColor = "text-stone-900 dark:text-stone-100 font-bold";
                }
              }

              return (
                <div
                  key={step.status}
                  className="flex flex-col items-center gap-1.5 px-0.5"
                >
                  <div
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${iconBg}`}
                  >
                    {isPast ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs leading-tight ${textColor}`}
                  >
                    {step.label}
                  </span>
                  {step.timestamp && !isFuture && (
                    <span className="text-[10px] text-stone-400 hidden md:inline-block font-mono">
                      {formatDate(step.timestamp, locale, "monthDay")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 사유 배너 (취소/분쟁 시) */}
        {isCancelled && (order.cancelReason || order.cancelledAt) && (
          <div className="mt-2 rounded-xl bg-stone-50 dark:bg-stone-800/40 p-3.5 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-stone-500" />
            <div className="space-y-0.5">
              <div className="font-semibold text-stone-900 dark:text-stone-100">
                {t("cancel_reason_title")}
              </div>
              <p className="text-stone-500">
                {order.cancelReason || t("timeline.cancel_reason_fallback")}
              </p>
            </div>
          </div>
        )}

        {isDisputed && order.disputeReason && (
          <div className="mt-2 rounded-xl bg-stone-50 dark:bg-stone-800/40 p-3.5 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-stone-500" />
            <div className="space-y-0.5">
              <div className="font-semibold text-stone-900 dark:text-stone-100">
                {t("dispute_reason_title")}
              </div>
              <p className="text-stone-600 dark:text-stone-300">
                {order.disputeReason}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
