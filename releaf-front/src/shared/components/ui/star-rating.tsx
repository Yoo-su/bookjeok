"use client";

import { Star, StarHalf } from "lucide-react";
import React from "react";

import { cn } from "@/shared/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  className?: string;
  size?: number;
  disabled?: boolean;
}

export const StarRating = ({
  value,
  onChange,
  readonly = false,
  className,
  size = 24,
  disabled = false,
}: StarRatingProps) => {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    if (readonly || disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(index + (isHalf ? 0.5 : 1));
  };

  const handleClick = () => {
    if (readonly || disabled || hoverValue === null) return;
    onChange?.(hoverValue);
  };

  const displayValue = hoverValue ?? value;

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onMouseLeave={() => setHoverValue(null)}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = displayValue >= i + 1;
        const half = displayValue === i + 0.5;

        return (
          <div
            key={i}
            className={cn(
              "relative transition-transform hover:scale-110",
              (readonly || disabled) && "cursor-default hover:scale-100",
              !readonly && !disabled && "cursor-pointer"
            )}
            style={{ width: size, height: size }}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onClick={handleClick}
          >
            <Star
              className={cn(
                "absolute top-0 left-0 w-full h-full text-stone-200 transition-colors",
                filled && "text-amber-400 fill-amber-400 drop-shadow-sm"
              )}
              strokeWidth={1.5}
            />
            {half && (
              <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                <Star
                  className="w-full h-full text-amber-400 fill-amber-400 drop-shadow-sm"
                  strokeWidth={1.5}
                  style={{ width: size, height: size }}
                />
              </div>
            )}
          </div>
        );
      })}
      {!readonly && (
        <span className="ml-2 text-sm font-bold text-amber-500 min-w-[3ch]">
          {displayValue > 0 ? displayValue.toFixed(1) : "0.0"}
        </span>
      )}
    </div>
  );
};
