"use client";

import { useRegisterShippingMutation } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { toast } from "sonner";

import { TruckFastIcon } from "@/shared/components/icons";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/shadcn/dialog";
import { Input } from "@/shared/components/shadcn/input";
import { Label } from "@/shared/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";

// id는 서버에 그대로 저장되는 값이라 로케일과 무관하게 고정한다. 표시 이름만 번역한다
export const CARRIERS = [
  { id: "CJ대한통운", key: "cj" },
  { id: "우체국택배", key: "post" },
  { id: "롯데택배", key: "lotte" },
  { id: "한진택배", key: "hanjin" },
  { id: "로젠택배", key: "logen" },
  { id: "CU 편의점택배", key: "cu" },
  { id: "GS Postbox", key: "gs" },
] as const;

interface ShippingFormModalProps {
  orderId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const ShippingFormModal = ({
  orderId,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: ShippingFormModalProps) => {
  const t = useTranslations("order.shipping_modal");
  const tCommon = useTranslations("common.actions");

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = (val: boolean) => {
    if (isControlled) {
      setControlledOpen?.(val);
    } else {
      setUncontrolledOpen(val);
    }
  };

  const [carrier, setCarrier] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [errors, setErrors] = useState<{ carrier?: string; tracking?: string }>(
    {},
  );

  const registerShippingMutation = useRegisterShippingMutation({
    onSuccess: () => {
      toast.success(t("success"));
      setIsOpen(false);
      setCarrier("");
      setTrackingNumber("");
      setErrors({});
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || t("errors.submit_failed"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { carrier?: string; tracking?: string } = {};

    if (!carrier) {
      newErrors.carrier = t("errors.carrier_required");
    }

    const cleanTracking = trackingNumber.replace(/[^a-zA-Z0-9]/g, "");
    if (!cleanTracking) {
      newErrors.tracking = t("errors.tracking_required");
    } else if (cleanTracking.length < 8 || cleanTracking.length > 20) {
      newErrors.tracking = t("errors.invalid_tracking");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    registerShippingMutation.mutate({
      orderId,
      payload: {
        carrier,
        trackingNumber: cleanTracking,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
            <TruckFastIcon className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-stone-900 dark:text-stone-100">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-stone-500">
            {t("desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* 택배사 선택 */}
          <div className="space-y-1.5">
            <Label
              htmlFor="carrier-select"
              className="text-xs font-semibold text-stone-700 dark:text-stone-300"
            >
              {t("carrier_label")}
            </Label>
            <Select
              value={carrier}
              onValueChange={(val) => {
                setCarrier(val);
                if (errors.carrier)
                  setErrors((prev) => ({ ...prev, carrier: undefined }));
              }}
            >
              <SelectTrigger
                id="carrier-select"
                className="w-full border-stone-200 dark:border-stone-700"
              >
                <SelectValue placeholder={t("carrier_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {t(`carriers.${c.key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.carrier && (
              <p className="text-[11px] text-destructive">{errors.carrier}</p>
            )}
          </div>

          {/* 운송장 번호 */}
          <div className="space-y-1.5">
            <Label
              htmlFor="tracking-number"
              className="text-xs font-semibold text-stone-700 dark:text-stone-300"
            >
              {t("tracking_label")}
            </Label>
            <Input
              id="tracking-number"
              placeholder={t("tracking_placeholder")}
              value={trackingNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setTrackingNumber(val);
                if (errors.tracking)
                  setErrors((prev) => ({ ...prev, tracking: undefined }));
              }}
              maxLength={20}
              className="font-mono text-base md:text-sm border-stone-200 dark:border-stone-700"
              disabled={registerShippingMutation.isPending}
            />
            {errors.tracking && (
              <p className="text-[11px] text-destructive">{errors.tracking}</p>
            )}
          </div>

          <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={registerShippingMutation.isPending}
              className="sm:flex-1 border-stone-200 dark:border-stone-700"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={registerShippingMutation.isPending}
              className="sm:flex-1 font-semibold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900"
            >
              {registerShippingMutation.isPending
                ? t("submitting")
                : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
