"use client";

import { useOrderDetailQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import React from "react";

import { OrderDetailCard } from "@/features/order";
import { AlertCircle, ArrowLeft } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface OrderDetailViewProps {
  orderId: string;
}

export const OrderDetailView = ({ orderId }: OrderDetailViewProps) => {
  const t = useTranslations("order.detail");
  const tPayment = useTranslations("order.payment");
  const router = useRouter();

  const { data: order, isLoading, error } = useOrderDetailQuery(orderId);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="md:col-span-5 space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {t("errors.not_found")}
        </h2>
        <p className="text-xs text-stone-500">{t("errors.not_authorized")}</p>
        <div className="pt-2 flex justify-center gap-3">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="border-stone-200 dark:border-stone-700"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            {tPayment("btn_back")}
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900"
          >
            <Link href={PATHS.HOME}>{tPayment("btn_go_home")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <OrderDetailCard order={order} />
    </div>
  );
};
