import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/shared/utils/cn";
import { formatAmount, isUnitPrefixed } from "@/shared/utils/format-currency";

interface PriceDisplayProps {
  value: number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** 통화 단위 span 클래스. 좌우 여백은 로케일 배치에 맞춰 컴포넌트가 붙인다 */
  unitClassName?: string;
}

export const PriceDisplay = ({
  value,
  currency = "KRW",
  size = "md",
  className,
  unitClassName,
}: PriceDisplayProps) => {
  const locale = useLocale();
  const t = useTranslations("common");

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-bold",
    xl: "text-3xl font-extrabold",
  };

  const isKRW = currency === "KRW";
  // ko는 `4,500원`, en은 `₩4,500`
  const isPrefix = isKRW && isUnitPrefixed(locale);
  const unit = isKRW ? t("won") : currency;
  // 앞에 붙는 기호는 숫자와 같은 크기로 읽히는 편이 자연스럽다
  const unitClass =
    unitClassName ??
    (isPrefix ? undefined : "text-sm font-normal text-gray-600");

  return (
    <span
      className={cn("font-medium text-gray-900", sizeClasses[size], className)}
    >
      {isPrefix && <span className={unitClass}>{unit}</span>}
      {formatAmount(value, locale)}
      {!isPrefix && <span className={cn("ml-0.5", unitClass)}>{unit}</span>}
    </span>
  );
};
