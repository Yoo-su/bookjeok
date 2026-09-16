"use client";

import {
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  FILTER_ALL,
  FilterFormInputs,
  formatPrice,
  MAX_MARKET_PRICE,
  SaleStatus,
  SearchBookSalesParams,
  SortOption,
} from "@bookjeok/core";
import { useBookSaleRegionsQuery } from "@bookjeok/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { RefreshCw, Search } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Input } from "@/shared/components/shadcn/input";
import { Label } from "@/shared/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { Slider } from "@/shared/components/shadcn/slider";
import { cn } from "@/shared/utils/cn";
import { formatCurrency } from "@/shared/utils/format-currency";

interface BookSaleFilterProps {
  initialParams: SearchBookSalesParams;
  onApply: (data: FilterFormInputs) => void;
  onReset: () => void;
}

export const BookSaleFilter = ({
  initialParams,
  onApply,
  onReset,
}: BookSaleFilterProps) => {
  const t = useTranslations("market.filter");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { data: availableRegions } = useBookSaleRegionsQuery();

  // initialParams에서 직접 초기값 계산 (useEffect 대신)
  const getDefaultValues = (): FilterFormInputs => ({
    search: initialParams.search || "",
    city: initialParams.city || FILTER_ALL,
    district: initialParams.district || FILTER_ALL,
    status: initialParams.status || [],
    priceRange: [
      initialParams.minPrice ?? 0,
      initialParams.maxPrice ?? MAX_MARKET_PRICE,
    ],
    sort:
      initialParams.sortBy === "distance"
        ? "distance_ASC"
        : (`${initialParams.sortBy || DEFAULT_SORT_BY}_${
            initialParams.sortOrder || DEFAULT_SORT_ORDER
          }` as SortOption),
  });

  const { register, handleSubmit, control, watch, reset, setValue } =
    useForm<FilterFormInputs>({
      defaultValues: getDefaultValues(),
    });

  const city = watch("city");
  const priceRange = watch("priceRange");

  // URL 파라미터가 변경될 때 폼 동기화
  useEffect(() => {
    reset(getDefaultValues());
  }, [
    initialParams.search,
    initialParams.city,
    initialParams.district,
    initialParams.sortBy,
    initialParams.sortOrder,
    initialParams.minPrice,
    initialParams.maxPrice,
    // status는 배열이므로 JSON.stringify로 비교
    JSON.stringify(initialParams.status),
    reset,
  ]);

  const handleCityChange = (newCity: string) => {
    setValue("city", newCity);
    setValue("district", FILTER_ALL);
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <form onSubmit={handleSubmit(onApply)} className="mb-12 space-y-6">
      {/* 1행: 검색 (전체 너비) */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
        <Input
          type="text"
          {...register("search")}
          placeholder={t("placeholder_search")}
          className="w-full h-12 pl-12 text-base bg-white border-stone-200 rounded-sm focus-visible:ring-stone-400 focus-visible:border-stone-400 placeholder:text-stone-400 transition-all font-serif"
        />
      </div>

      {/* 2행: 주요 필터 (모바일: 그리드, 데스크탑: 플렉스 - 변경됨) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* 지역 선택 */}
        <Controller
          name="city"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={handleCityChange}>
              <SelectTrigger className="w-full h-12 bg-white border-stone-200 rounded-sm focus:ring-stone-200">
                <SelectValue placeholder={t("placeholder_city")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>{t("all_cities")}</SelectItem>
                {availableRegions &&
                  Object.keys(availableRegions).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        />
        <Controller
          name="district"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={
                !city ||
                city === FILTER_ALL ||
                !availableRegions?.[city] ||
                availableRegions[city].length === 0
              }
            >
              <SelectTrigger className="w-full h-12 bg-white border-stone-200 rounded-sm focus:ring-stone-200 disabled:bg-stone-50 disabled:opacity-50">
                <SelectValue placeholder={t("placeholder_district")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>{t("all_districts")}</SelectItem>
                {city &&
                  city !== FILTER_ALL &&
                  availableRegions?.[city]?.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        />

        {/* 정렬 */}
        <Controller
          name="sort"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full h-12 bg-white border-stone-200 rounded-sm focus:ring-stone-200 col-span-2 md:col-span-1">
                <SelectValue placeholder={t("sort.label")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt_DESC">
                  {t("sort.newest")}
                </SelectItem>
                <SelectItem value="price_ASC">{t("sort.price_low")}</SelectItem>
                <SelectItem value="price_DESC">
                  {t("sort.price_high")}
                </SelectItem>
                <SelectItem value="distance_ASC">
                  {t("sort.distance")}
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* 3행: 상세 필터 (상태 & 가격) */}
      <div className="pt-4 border-t border-dashed border-stone-200/50 flex flex-col md:flex-row gap-6 md:gap-12">
        {/* 판매 상태 */}
        <div className="space-y-3">
          <Label className="text-sm font-serif font-bold text-stone-900">
            {t("label_status")}
          </Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {(
                  Object.keys(SaleStatus) as Array<keyof typeof SaleStatus>
                ).map((key) => {
                  const currentStatus = SaleStatus[key];
                  const isChecked = field.value.includes(currentStatus);
                  return (
                    <label
                      key={key}
                      className={cn(
                        "cursor-pointer inline-flex items-center px-3 py-1.5 rounded-full border text-sm transition-all",
                        isChecked
                          ? "bg-stone-900 border-stone-900 text-white font-medium shadow-sm"
                          : "bg-white border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newValue = checked
                            ? [...field.value, currentStatus]
                            : field.value.filter((s) => s !== currentStatus);
                          field.onChange(newValue);
                        }}
                      />
                      {t(`status.${currentStatus}`)}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </div>

        {/* 가격 범위 */}
        <div className="flex-1 space-y-3 min-w-[240px]">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-serif font-bold text-stone-900">
              {t("label_price")}
            </Label>
            <span className="text-sm font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-sm">
              {formatPrice(priceRange[0])} ~ {formatPrice(priceRange[1])}
            </span>
          </div>
          <div className="pt-2 px-1">
            <Controller
              name="priceRange"
              control={control}
              render={({ field }) => (
                <Slider
                  value={field.value}
                  onValueChange={field.onChange}
                  max={MAX_MARKET_PRICE}
                  step={1000}
                  className="w-full"
                />
              )}
            />
          </div>
          <div className="flex justify-between text-[10px] text-stone-400 font-medium px-1">
            <span>{formatCurrency(0, locale, tCommon("won"))}</span>
            <span>{formatPrice(MAX_MARKET_PRICE)}</span>
          </div>
        </div>
      </div>

      {/* 4행: 실행 버튼 */}
      <div className="grid grid-cols-2 md:flex md:justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="h-12 px-4 rounded-sm border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t("reset_conditions")}
        </Button>

        <Button
          size="lg"
          type="submit"
          className="h-12 md:px-12 rounded-sm bg-stone-700 hover:bg-stone-600 text-white font-medium gap-2 transition-colors"
        >
          <Search className="h-4 w-4" />
          {t("search")}
        </Button>
      </div>
    </form>
  );
};
