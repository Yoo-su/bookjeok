import { cn } from "@/shared/utils/cn";

interface PriceDisplayProps {
  value: number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const PriceDisplay = ({
  value,
  currency = "KRW",
  size = "md",
  className,
}: PriceDisplayProps) => {
  const formattedValue = new Intl.NumberFormat("ko-KR").format(value);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-bold",
    xl: "text-3xl font-extrabold",
  };

  return (
    <span
      className={cn("font-medium text-gray-900", sizeClasses[size], className)}
    >
      {formattedValue}
      <span className="ml-0.5 text-sm font-normal text-gray-600">
        {currency === "KRW" ? "원" : currency}
      </span>
    </span>
  );
};
