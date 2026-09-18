import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useReviewReading } from "./use-review-reading";

let scroll = 0;
let body: HTMLDivElement;
const headings = [1, 2, 3].map((number) => ({
  id: `review-section-${number}`,
  text: `Section ${number}`,
  level: 2,
}));
const rect = (top: number, height: number) => ({
  top: top - scroll,
  bottom: top + height - scroll,
  height,
  left: 0,
  right: 800,
  width: 800,
  x: 0,
  y: top - scroll,
  toJSON() {},
});
const tick = () =>
  act(() => {
    window.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(20);
  });

beforeEach(() => {
  vi.useFakeTimers();
  scroll = 0;
  window.history.replaceState(null, "", "/");
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 1),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 800,
  });
  body = document.createElement("div");
  body.innerHTML = headings
    .map(({ id, text }) => `<h2 id="${id}" tabindex="-1">${text}</h2>`)
    .join("");
  document.body.append(body);
  vi.spyOn(body, "getBoundingClientRect").mockImplementation(() =>
    rect(200, 3000),
  );
  [...body.children].forEach((element, index) =>
    vi
      .spyOn(element, "getBoundingClientRect")
      .mockImplementation(() => rect(200 + index * 1400, 40)),
  );
});
afterEach(() => {
  body.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("review reading navigation", () => {
  it("tracks the current DOM if the rendered headings are replaced", () => {
    const ref = { current: body };
    const { result } = renderHook(() =>
      useReviewReading(ref, headings, 100, true),
    );
    body.innerHTML = headings
      .map(({ id, text }) => `<h2 id="${id}">${text}</h2>`)
      .join("");
    [...body.children].forEach((element, index) =>
      vi
        .spyOn(element, "getBoundingClientRect")
        .mockImplementation(() => rect(200 + index * 1400, 40)),
    );
    scroll = 1000;
    tick();
    expect(result.current.activeId).toBe("review-section-1");
  });
  it("keeps the current section through long paragraphs and finishes at the body end", () => {
    const { result } = renderHook(() =>
      useReviewReading({ current: body }, headings, 100, true),
    );
    scroll = 1000;
    tick();
    expect(result.current.activeId).toBe("review-section-1");
    scroll = 1600;
    tick();
    expect(result.current.activeId).toBe("review-section-2");
    scroll = 2500;
    tick();
    expect(result.current.activeId).toBe("review-section-3");
    expect(result.current.progress).toBe(1);
  });
  it("navigates with reduced motion, focuses the heading, and preserves history state", () => {
    window.history.replaceState({ marker: true }, "", "/");
    const { result } = renderHook(() =>
      useReviewReading({ current: body }, headings, 100, true),
    );
    act(() => result.current.navigate("review-section-2"));
    expect(window.location.hash).toBe("#review-section-2");
    expect(window.history.state).toEqual({ marker: true });
    expect(document.activeElement?.id).toBe("review-section-2");
    expect(window.scrollTo).toHaveBeenLastCalledWith({
      top: 1500,
      behavior: "instant",
    });
    expect(result.current.activeId).toBe("review-section-2");
  });
  it("releases click highlighting when the reader interrupts scrolling", () => {
    const { result } = renderHook(() =>
      useReviewReading({ current: body }, headings, 100, true),
    );
    act(() => result.current.navigate("review-section-3"));
    scroll = 500;
    act(() => {
      window.dispatchEvent(new Event("wheel"));
      vi.advanceTimersByTime(20);
    });
    expect(result.current.activeId).toBe("review-section-1");
  });
  it("restores a deep link on entry", () => {
    window.history.replaceState(null, "", "/#review-section-3");
    renderHook(() => useReviewReading({ current: body }, headings, 100, true));
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 2900,
      behavior: "instant",
    });
  });
});
