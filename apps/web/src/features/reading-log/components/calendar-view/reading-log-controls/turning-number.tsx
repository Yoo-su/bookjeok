"use client";

import { motion, useReducedMotionConfig } from "motion/react";
import { useState } from "react";

import { cn } from "@/shared/utils";

import { MONTH_TURN } from "../../../constants/ui";

interface TurningNumberProps {
  value: number;
  /** 넘긴 방향을 정하는 순서. 월은 `연 * 12 + 월`을 넘겨 12월 → 1월도 앞으로 넘어가게 한다 */
  order: number;
  className?: string;
}

/**
 * 달력 상단 연·월 숫자. 달 그리드와 같은 박자·방향으로 숫자를 통째로 넘긴다
 * - 나가는 숫자와 들어오는 숫자 둘만 그려 연달아 넘겨도 쌓이지 않는다
 * - transform 문자열로 움직여 합성 스레드에서 돈다. 새 달 칸을 그리느라 메인 스레드가 바빠도 끊기지 않는다
 * - 동작 줄이기면 움직이지 않고 겹쳐 바뀐다(transform 문자열은 MotionConfig가 줄여 주지 않음)
 */
export function TurningNumber({ value, order, className }: TurningNumberProps) {
  const reduceMotion = useReducedMotionConfig();
  const [turn, setTurn] = useState({
    id: 0,
    value,
    order,
    previous: null as number | null,
    direction: 1,
  });
  if (value !== turn.value) {
    setTurn({
      id: turn.id + 1,
      value,
      order,
      previous: turn.value,
      direction: order > turn.order ? 1 : -1,
    });
  } else if (order !== turn.order) {
    // 1월 → 작년 1월처럼 숫자가 같으면 넘기지 않고 순서만 맞춘다
    setTurn({ ...turn, order });
  }

  const shift = (side: number) =>
    `translateY(${reduceMotion ? 0 : side * turn.direction * 100}%)`;

  // 같은 배열에 키로 두어야 들어오던 숫자가 나가는 숫자로 바뀔 때 다시 붙지 않고 이어서 움직인다
  const items = [
    turn.previous !== null && (
      <motion.span
        key={turn.id - 1}
        className="col-start-1 row-start-1"
        animate={{ transform: shift(-1), opacity: 0 }}
        transition={MONTH_TURN.exit}
      >
        {turn.previous}
      </motion.span>
    ),
    <motion.span
      key={turn.id}
      className="col-start-1 row-start-1"
      initial={turn.id === 0 ? false : { transform: shift(1), opacity: 0 }}
      animate={{ transform: shift(0), opacity: 1 }}
      transition={MONTH_TURN.enter}
    >
      {value}
    </motion.span>,
  ];

  return (
    <span
      aria-hidden="true"
      className={cn("inline-grid overflow-y-clip tabular-nums", className)}
    >
      {items}
    </span>
  );
}
