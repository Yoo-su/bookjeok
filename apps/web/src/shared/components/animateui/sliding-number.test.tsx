import { render } from "@testing-library/react";
import { MotionConfig } from "motion/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SlidingNumber } from "./sliding-number";

const measured = vi.hoisted(() => ({ height: 0 }));
vi.mock("react-use-measure", () => ({
  default: () => [() => {}, { height: measured.height }],
}));

const frame = () => new Promise((r) => requestAnimationFrame(r));

/** 한 자리 바퀴에서 그 숫자 칸의 세로 위치(px) */
const offsetOf = (container: HTMLElement, digit: number) => {
  const el = [
    ...container.querySelectorAll<HTMLElement>(
      '[data-slot="sliding-number-display"]',
    ),
  ].find((e) => e.textContent === String(digit));
  const match = el?.style.transform.match(/translateY\((-?[\d.]+)px\)/);
  return match ? Number(match[1]) : 0;
};

describe("SlidingNumber", () => {
  it("높이를 재기 전(서버 렌더)에도 지금 숫자만 보인다", () => {
    measured.height = 0;
    const html = renderToString(<SlidingNumber number={7} initiallyStable />);
    const visible = [
      ...html.matchAll(/visibility:(visible|hidden)[^>]*>(\d)</g),
    ].filter(([, v]) => v === "visible");

    expect(visible.map(([, , d]) => d)).toEqual(["7"]);
  });

  it("동작 줄이기면 굴리지 않고 다음 프레임에 바로 자리 잡는다", async () => {
    measured.height = 20;
    const ui = (n: number) => (
      <MotionConfig reducedMotion="always">
        <SlidingNumber number={n} initiallyStable />
      </MotionConfig>
    );
    const { container, rerender } = render(ui(3));

    rerender(ui(4));
    await frame();

    expect(offsetOf(container, 4)).toBe(0);
    expect(offsetOf(container, 3)).toBe(-20);
  });

  it("평소에는 스프링으로 굴러 한 프레임 뒤엔 아직 가는 중이다", async () => {
    measured.height = 20;
    const { container, rerender } = render(
      <SlidingNumber number={3} initiallyStable />,
    );

    rerender(<SlidingNumber number={4} initiallyStable />);
    await frame();
    await frame();

    expect(offsetOf(container, 4)).not.toBe(0);
  });
});
