"use client";

import { RefreshCw, Search } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { SaleStatus, SearchBookSalesParams } from "@/features/book/types";
import { Button } from "@/shared/components/shadcn/button";
import { Checkbox } from "@/shared/components/shadcn/checkbox";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { KOREA_DISTRICTS } from "@/shared/constants/korea-districts";
import { formatPrice } from "@/shared/utils/format-price";

const statusToKorean: { [key in SaleStatus]: string } = {
  FOR_SALE: "판매중",
  RESERVED: "예약중",
  SOLD: "판매완료",
};

const MAX_PRICE = 100000;

type FilterFormInputs = {
  search: string;
  city: string;
  district: string;
  status: SaleStatus[];
  priceRange: [number, number];
  sort: string;
};

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
  const { register, handleSubmit, control, watch, reset, setValue } =
    useForm<FilterFormInputs>({
      defaultValues: {
        search: "",
        city: "all",
        district: "all",
        status: [],
        priceRange: [0, MAX_PRICE],
        sort: "createdAt_DESC",
      },
    });

  const city = watch("city");
  const priceRange = watch("priceRange");

  useEffect(() => {
    reset({
      search: initialParams.search || "",
      city: initialParams.city || "all",
      district: initialParams.district || "all",
      status: initialParams.status || [],
      priceRange: [
        initialParams.minPrice ?? 0,
        initialParams.maxPrice ?? MAX_PRICE,
      ],
      sort: `${initialParams.sortBy || "createdAt"}_${
        initialParams.sortOrder || "DESC"
      }`,
    });
  }, [initialParams, reset]);

  const handleCityChange = (newCity: string) => {
    setValue("city", newCity);
    setValue("district", "all");
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <form
      onSubmit={handleSubmit(onApply)}
      className="mb-8 space-y-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
    >
      {/* Row 1: Search & Location */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative grow min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            {...register("search")}
            placeholder="검색..."
            className="w-full pl-10 text-base"
          />
        </div>
        <div className="flex items-center gap-2">
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={handleCityChange}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="시/도" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">시/도 전체</SelectItem>
                  {Object.keys(KOREA_DISTRICTS).map((c) => (
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
                  !city || city === "all" || KOREA_DISTRICTS[city]?.length === 0
                }
              >
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="시/군/구" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">시/군/구 전체</SelectItem>
                  {city &&
                    city !== "all" &&
                    KOREA_DISTRICTS[city].map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Row 2: Status & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex items-center gap-4">
          <Label className="shrink-0 font-semibold">상태:</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <>
                {(
                  Object.keys(SaleStatus) as Array<keyof typeof SaleStatus>
                ).map((key) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <Checkbox
                      id={SaleStatus[key]}
                      checked={field.value.includes(SaleStatus[key])}
                      onCheckedChange={(checked) => {
                        const currentStatus = SaleStatus[key];
                        const newValue = checked
                          ? [...field.value, currentStatus]
                          : field.value.filter((s) => s !== currentStatus);
                        field.onChange(newValue);
                      }}
                    />
                    <Label htmlFor={SaleStatus[key]} className="font-normal">
                      {statusToKorean[SaleStatus[key]]}
                    </Label>
                  </div>
                ))}
              </>
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          <Controller
            name="sort"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt_DESC">최신순</SelectItem>
                  <SelectItem value="price_ASC">낮은 가격순</SelectItem>
                  <SelectItem value="price_DESC">높은 가격순</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Row 3: Price Slider & Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex grow items-center gap-4">
          <Label className="shrink-0 font-semibold">가격대:</Label>
          <div className="grow flex items-center gap-2">
            <Controller
              name="priceRange"
              control={control}
              render={({ field }) => (
                <Slider
                  value={field.value}
                  onValueChange={field.onChange}
                  max={MAX_PRICE}
                  step={1000}
                  className="w-full max-w-xs"
                />
              )}
            />
            <div className="text-sm text-muted-foreground w-40 text-center">
              {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="text-muted-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Reset Filters</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>초기화</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button size="sm" type="submit">
            <Search className="mr-1 h-4 w-4" />
            검색
          </Button>
        </div>
      </div>
    </form>
  );
};
