import { render } from "@testing-library/react";
import { MotionConfig } from "motion/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { TurningNumber } from "@/features/reading-log/components/calendar-view/reading-log-controls/turning-number";

/** 그려진 숫자와 각 숫자의 시작 위치(transform) */
const numbers = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>("[aria-hidden] > span")].map(
    (el) => ({ text: el.textContent, transform: el.style.transform }),
  );

const month = (y: number, m: number, motion?: "always") => (
  <MotionConfig reducedMotion={motion ?? "never"}>
    <TurningNumber value={m} order={y * 12 + m - 1} />
  </MotionConfig>
);

describe("TurningNumber", () => {
  it("첫 화면에는 숫자 하나만 제자리에 그린다", () => {
    const { container } = render(month(2026, 7));

    expect(numbers(container)).toEqual([
      { text: "7", transform: "translateY(0%)" },
    ]);
  });

  it("12월 → 1월로 앞으로 넘기면 1이 아래에서 올라온다(숫자 크기가 아니라 넘긴 방향)", () => {
    const { container, rerender } = render(month(2025, 12));

    rerender(month(2026, 1));

    expect(numbers(container)).toEqual([
      { text: "12", transform: expect.any(String) },
      { text: "1", transform: "translateY(100%)" },
    ]);
  });

  it("1월 → 12월로 뒤로 넘기면 위에서 내려온다", () => {
    const { container, rerender } = render(month(2026, 1));

    rerender(month(2025, 12));

    expect(numbers(container).at(-1)).toEqual({
      text: "12",
      transform: "translateY(-100%)",
    });
  });

  it("연달아 넘겨도 나가는 숫자와 들어오는 숫자 둘만 남는다", () => {
    const { container, rerender } = render(month(2026, 7));

    for (const m of [6, 5, 4, 3, 2]) rerender(month(2026, m));

    expect(numbers(container).map((n) => n.text)).toEqual(["3", "2"]);
  });

  it("숫자가 같으면(1월 → 작년 1월) 넘기지 않는다", () => {
    const { container, rerender } = render(month(2026, 1));

    rerender(month(2025, 1));

    expect(numbers(container)).toEqual([
      { text: "1", transform: "translateY(0%)" },
    ]);
  });

  it("동작 줄이기면 밀지 않고 제자리에서 바뀐다", () => {
    const { container, rerender } = render(month(2026, 7, "always"));

    rerender(month(2026, 8, "always"));

    expect(numbers(container).at(-1)).toEqual({
      text: "8",
      transform: "translateY(0%)",
    });
  });
});
