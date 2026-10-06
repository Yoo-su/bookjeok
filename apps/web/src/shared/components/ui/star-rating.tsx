"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import React from "react";

import { Star } from "@/shared/components/icons/iconsax";
import { RollingNumber } from "@/shared/components/ui/rolling-number";
import { cn } from "@/shared/utils";

/** 별이 차오를 때 앞 별부터 하나씩 */
const FILL_STAGGER = 0.045;

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
  const t = useTranslations("common.aria");
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);
  const starRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const reduceMotion = useReducedMotion();

  /** 고른 별을 통 튀김. 0점(지움)은 조용히 */
  const bounce = (rating: number) => {
    const el = starRefs.current[Math.ceil(rating) - 1];
    if (!el || reduceMotion) return;
    animate(el, { scale: [1, 1.28, 1] }, { duration: 0.32, ease: "easeOut" });
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number,
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
    bounce(hoverValue);
  };

  const displayValue = hoverValue ?? value;
  // 보이는 값이 오를 때 직전 값 다음 별부터 순서대로 채운다. 내릴 때는 바로 비움
  const [fill, setFill] = React.useState({
    shown: displayValue,
    from: displayValue,
  });
  if (displayValue !== fill.shown) {
    setFill({ shown: displayValue, from: fill.shown });
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readonly || disabled) return;

    let newValue = value;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      newValue = Math.min(5, value + 0.5);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      newValue = Math.max(0, value - 0.5);
    } else if (e.key === "Home") {
      newValue = 0;
    } else if (e.key === "End") {
      newValue = 5;
    } else {
      return;
    }
    e.preventDefault();
    if (newValue === value) return;
    onChange?.(newValue);
    bounce(newValue);
  };

  return (
    <div
      role={readonly || disabled ? undefined : "slider"}
      aria-label={t("rating_select")}
      aria-valuemin={readonly || disabled ? undefined : 0}
      aria-valuemax={readonly || disabled ? undefined : 5}
      aria-valuenow={readonly || disabled ? undefined : value}
      tabIndex={readonly || disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-md p-1 -m-1",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onMouseLeave={() => setHoverValue(null)}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = displayValue >= i + 1;
        const half = displayValue === i + 0.5;
        const lit = filled || half;
        const delay =
          displayValue > fill.from
            ? Math.max(0, i - Math.floor(fill.from)) * FILL_STAGGER
            : 0;

        return (
          <div
            key={i}
            className={cn(
              "relative transition-transform",
              !readonly &&
                !disabled &&
                "cursor-pointer pointer-fine:hover:scale-110",
              (readonly || disabled) && "cursor-default",
            )}
            style={{ width: size, height: size }}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onClick={handleClick}
          >
            <span
              ref={(el) => {
                starRefs.current[i] = el;
              }}
              className="absolute inset-0"
            >
              <Star
                variant="outline"
                className="absolute top-0 left-0 w-full h-full text-stone-200"
                aria-hidden="true"
              />
              {/* 반 별은 왼쪽 절반만 보이게 자름 */}
              <motion.span
                initial={false}
                animate={
                  lit ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }
                }
                transition={
                  lit
                    ? { type: "spring", stiffness: 600, damping: 22, delay }
                    : { duration: 0.1 }
                }
                className={cn(
                  "absolute top-0 left-0 h-full overflow-hidden",
                  half ? "w-1/2" : "w-full",
                )}
              >
                <Star
                  variant="bold"
                  className="h-full text-amber-400 drop-shadow-sm"
                  style={{ width: size, height: size }}
                  aria-hidden="true"
                />
              </motion.span>
            </span>
          </div>
        );
      })}
      {!readonly && (
        <RollingNumber
          value={displayValue}
          format={(v) => v.toFixed(1)}
          className="ml-2 text-sm font-bold text-amber-500 min-w-[3ch]"
        />
      )}
    </div>
  );
};
