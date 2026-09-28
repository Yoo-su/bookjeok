"use client";

import { TradeMethod } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import { Textarea } from "@/shared/components/shadcn/textarea";

import { TradeMethodField } from "./trade-method-field";

/** 작성·수정 폼이 함께 쓰는 필드. 두 폼의 스키마가 모두 이 필드를 가진다 */
interface SaleCommonValues {
  title: string;
  price: string;
  tradeMethod: TradeMethod;
  content: string;
}

/** 판매글 작성·수정 폼의 제목·가격·거래 방식 필드 */
export const SaleBasicFields = () => {
  const t = useTranslations("market.form");
  const form = useFormContext<SaleCommonValues>();

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t("fields.title")}</FormLabel>
                <span className="text-xs text-muted-foreground">
                  {field.value?.length || 0} / 50{t("char_unit")}
                </span>
              </div>
              <FormControl>
                <Input placeholder={t("fields.title_placeholder")} {...field} />
              </FormControl>
              <FormMessage className="mt-1" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.price")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                    ₩
                  </span>
                  <Input
                    type="number"
                    placeholder={t("fields.price_placeholder")}
                    className="pl-8"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="mt-1" />
            </FormItem>
          )}
        />
      </div>

      {/* 거래 방식 선택 (택배 옵션은 PG 승인 전까지 비활성) */}
      <TradeMethodField control={form.control} name="tradeMethod" />
    </>
  );
};

/** 판매글 작성·수정 폼의 본문 필드. 추천 태그를 눌러 본문에 덧붙인다 */
export const SaleContentField = () => {
  const t = useTranslations("market.form");
  const form = useFormContext<SaleCommonValues>();

  return (
    <FormField
      control={form.control}
      name="content"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>{t("fields.content")}</FormLabel>
            <span className="text-xs text-muted-foreground">
              {field.value?.length || 0} / 1000{t("char_unit")}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {((t.raw("suggested_tags") as string[]) || []).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const currentContent = form.getValues("content") || "";
                  if (!currentContent.includes(tag)) {
                    form.setValue(
                      "content",
                      currentContent ? `${currentContent}\n${tag}` : tag,
                      { shouldValidate: true },
                    );
                  }
                }}
                className="text-xs px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>

          <FormControl>
            <Textarea
              placeholder={t("fields.content_placeholder")}
              className="resize-none"
              rows={8}
              {...field}
            />
          </FormControl>
          <div className="mt-1 min-h-5">
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
};
