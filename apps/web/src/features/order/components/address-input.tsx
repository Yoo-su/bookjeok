"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { type Address, DaumPostcodeEmbed } from "react-daum-postcode";

import {
  MapPin,
  Phone,
  Search,
  Truck,
  User,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { Input } from "@/shared/components/shadcn/input";
import { Label } from "@/shared/components/shadcn/label";

export interface ShippingAddressFormValues {
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  deliveryMemo?: string;
}

interface AddressInputProps {
  values: ShippingAddressFormValues;
  onChange: (values: ShippingAddressFormValues) => void;
  errors?: Partial<Record<keyof ShippingAddressFormValues, string>>;
  disabled?: boolean;
}

export const AddressInput = ({
  values,
  onChange,
  errors = {},
  disabled = false,
}: AddressInputProps) => {
  const t = useTranslations("order.payment");
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  const formatPhoneNumber = (val: string) => {
    const raw = val.replace(/[^0-9]/g, "");
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    if (raw.length <= 11)
      return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange({ ...values, recipientPhone: formatted });
  };

  const handlePostcodeComplete = (data: Address) => {
    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname !== "") {
        extraAddress += data.bname;
      }
      if (data.buildingName !== "") {
        extraAddress +=
          extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      }
      if (extraAddress !== "") {
        fullAddress += ` (${extraAddress})`;
      }
    }

    onChange({
      ...values,
      zipCode: data.zonecode,
      address: fullAddress,
    });
    setIsPostcodeOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* 수령인 이름 */}
      <div className="space-y-1.5">
        <Label
          htmlFor="recipientName"
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300"
        >
          <User className="h-3.5 w-3.5 text-stone-400" />
          {t("recipient_name")}
          <span className="text-stone-400">*</span>
        </Label>
        <Input
          id="recipientName"
          name="recipientName"
          value={values.recipientName}
          onChange={(e) =>
            onChange({ ...values, recipientName: e.target.value })
          }
          placeholder={t("recipient_name_placeholder")}
          disabled={disabled}
          className={`border-stone-200 dark:border-stone-800 ${
            errors.recipientName
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }`}
        />
        {errors.recipientName && (
          <p className="text-[11px] font-medium text-destructive">
            {errors.recipientName}
          </p>
        )}
      </div>

      {/* 수령인 연락처 */}
      <div className="space-y-1.5">
        <Label
          htmlFor="recipientPhone"
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300"
        >
          <Phone className="h-3.5 w-3.5 text-stone-400" />
          {t("recipient_phone")}
          <span className="text-stone-400">*</span>
        </Label>
        <Input
          id="recipientPhone"
          name="recipientPhone"
          type="tel"
          value={values.recipientPhone}
          onChange={handlePhoneChange}
          placeholder={t("recipient_phone_placeholder")}
          maxLength={13}
          disabled={disabled}
          className={`border-stone-200 dark:border-stone-800 ${
            errors.recipientPhone
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }`}
        />
        {errors.recipientPhone && (
          <p className="text-[11px] font-medium text-destructive">
            {errors.recipientPhone}
          </p>
        )}
      </div>

      {/* 우편번호 & 기본 주소 */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
          <MapPin className="h-3.5 w-3.5 text-stone-400" />
          {t("shipping_info")}
          <span className="text-stone-400">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="zipCode"
            name="zipCode"
            value={values.zipCode}
            readOnly
            placeholder={t("zip_code")}
            className="w-32 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-base tabular-nums md:text-sm"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPostcodeOpen(true)}
            disabled={disabled}
            className="flex items-center gap-1.5 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <Search className="h-3.5 w-3.5" />
            {t("search_zip_code")}
          </Button>
        </div>
        <Input
          id="address"
          name="address"
          value={values.address}
          readOnly
          placeholder={t("address_placeholder")}
          className={`mt-1 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-base md:text-sm ${
            errors.address
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }`}
          disabled={disabled}
        />
        {errors.address && (
          <p className="text-[11px] font-medium text-destructive">
            {errors.address}
          </p>
        )}
      </div>

      {/* 상세 주소 */}
      <div className="space-y-1.5">
        <Label
          htmlFor="addressDetail"
          className="text-xs font-semibold text-stone-700 dark:text-stone-300"
        >
          {t("address_detail")}
          <span className="text-stone-400">*</span>
        </Label>
        <Input
          id="addressDetail"
          name="addressDetail"
          value={values.addressDetail}
          onChange={(e) =>
            onChange({ ...values, addressDetail: e.target.value })
          }
          placeholder={t("address_detail_placeholder")}
          disabled={disabled}
          className={`border-stone-200 dark:border-stone-800 ${
            errors.addressDetail
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }`}
        />
        {errors.addressDetail && (
          <p className="text-[11px] font-medium text-destructive">
            {errors.addressDetail}
          </p>
        )}
      </div>

      {/* 배송 요청사항 (선택) */}
      <div className="space-y-1.5">
        <Label
          htmlFor="deliveryMemo"
          className="flex items-center gap-1.5 text-xs font-medium text-stone-500"
        >
          <Truck className="h-3.5 w-3.5" />
          {t("delivery_memo")}
        </Label>
        <Input
          id="deliveryMemo"
          name="deliveryMemo"
          value={values.deliveryMemo || ""}
          onChange={(e) =>
            onChange({ ...values, deliveryMemo: e.target.value })
          }
          placeholder={t("delivery_memo_placeholder")}
          disabled={disabled}
          className="border-stone-200 dark:border-stone-800"
        />
      </div>

      {/* 카카오 우편번호 검색 팝업 다이얼로그 */}
      <Dialog open={isPostcodeOpen} onOpenChange={setIsPostcodeOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden sm:rounded-2xl border-stone-200 dark:border-stone-800">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-stone-200 dark:border-stone-800">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <Search className="h-4 w-4 text-stone-700 dark:text-stone-300" />
              {t("postcode_modal_title")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("postcode_modal_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-[450px]">
            <DaumPostcodeEmbed
              onComplete={handlePostcodeComplete}
              autoClose={false}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
