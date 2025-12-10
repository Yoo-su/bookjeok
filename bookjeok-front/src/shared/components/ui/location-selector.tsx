"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { KOREA_DISTRICTS } from "@/shared/constants/korea-districts";
import { cn } from "@/shared/utils/cn";

interface LocationSelectorProps {
  city: string;
  district: string;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
  className?: string;
}

export const LocationSelector = ({
  city,
  district,
  onCityChange,
  onDistrictChange,
  className,
}: LocationSelectorProps) => {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          지역 (시/도)
        </label>
        <Select
          value={city}
          onValueChange={(value) => {
            onCityChange(value);
            // Reset district when city changes
            onDistrictChange("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="시/도 선택" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(KOREA_DISTRICTS).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          지역 (시/군/구)
        </label>
        <Select
          value={district}
          onValueChange={onDistrictChange}
          disabled={
            !city ||
            !KOREA_DISTRICTS[city] ||
            KOREA_DISTRICTS[city].length === 0
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="시/군/구 선택" />
          </SelectTrigger>
          <SelectContent>
            {city &&
              KOREA_DISTRICTS[city]?.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
