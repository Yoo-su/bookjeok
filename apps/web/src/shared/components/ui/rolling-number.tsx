"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useState } from "react";

import { cn } from "@/shared/utils";

// 늘면 아래에서 올라오고, 줄면 위에서 내려온다. custom = 1(증가) | -1(감소)
const digitVariants: Variants = {
  enter: (direction: number) => ({ y: `${direction * 100}%`, opacity: 0 }),
  center: { y: "0%", opacity: 1 },
  exit: (direction: number) => ({ y: `${direction * -100}%`, opacity: 0 }),
};

interface RollingNumberProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
}

/**
 * 값이 바뀐 자릿수만 굴려서 바꾸는 숫자. 첫 렌더에는 움직이지 않는다.
 */
export function RollingNumber({
  value,
  format = String,
  className,
}: RollingNumberProps) {
  const text = format(value);
  // 직전 값 대비 방향과, 직전 값의 자릿수(이보다 높은 자리는 새로 생긴 자리)
  const [roll, setRoll] = useState({
    value,
    direction: 1,
    previousLength: text.length,
  });
  if (value !== roll.value) {
    setRoll({
      value,
      direction: value > roll.value ? 1 : -1,
      previousLength: format(roll.value).length,
    });
  }
  const { direction, previousLength } = roll;

  // 오른쪽 끝 자리부터 키를 매겨야 자릿수가 늘어도 기존 자리가 그대로 남는다
  const chars = text.split("").map((char, index) => ({
    char,
    slot: text.length - index,
  }));

  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      <span className="sr-only">{text}</span>
      {chars.map(({ char, slot }) => (
        <span
          key={slot}
          aria-hidden="true"
          className="relative inline-flex overflow-hidden"
        >
          <AnimatePresence
            mode="popLayout"
            initial={slot > previousLength}
            custom={direction}
          >
            <motion.span
              key={char}
              custom={direction}
              variants={digitVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 520, damping: 34 }}
              className="inline-block"
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
