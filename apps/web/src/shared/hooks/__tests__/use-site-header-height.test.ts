/**
 * 루트에 사는 dock 패널은 화면을 옮겨도 남아 있음. 레이아웃이 다른 화면(book/ ↔ (default))으로 가면
 * 헤더가 새로 그려지는데, 옛 헤더 높이 0을 믿으면 패널이 헤더 뒤로 파고든다.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSiteHeaderHeight } from "../use-site-header-height";

const nav = vi.hoisted(() => ({ pathname: "/ko/lounge" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

// 관찰 중인 요소별 콜백. 테스트가 크기 변화를 직접 알림
const observers = new Map<Element, () => void>();
class FakeResizeObserver {
  constructor(private cb: () => void) {}
  observe(el: Element) {
    observers.set(el, this.cb);
  }
  disconnect() {
    for (const [el, cb] of observers) if (cb === this.cb) observers.delete(el);
  }
  unobserve() {}
}

const mountHeader = (height: number) => {
  const el = document.createElement("header");
  el.setAttribute("data-site-header", "");
  el.getBoundingClientRect = () =>
    ({ height: el.isConnected ? height : 0 }) as DOMRect;
  document.body.appendChild(el);
  return el;
};

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  nav.pathname = "/ko/lounge";
});
afterEach(() => {
  vi.unstubAllGlobals();
  observers.clear();
  document.body.innerHTML = "";
});

describe("useSiteHeaderHeight", () => {
  it("헤더 높이를 잰다", () => {
    mountHeader(72);
    const { result } = renderHook(() => useSiteHeaderHeight());
    expect(result.current).toBe(72);
  });

  it("화면을 옮겨 헤더가 바뀌면 떨어져 나간 옛 헤더의 0을 믿지 않고 새 헤더를 잰다", () => {
    const old = mountHeader(72);
    const { result, rerender } = renderHook(() => useSiteHeaderHeight());

    // 다른 레이아웃으로 이동: 옛 헤더가 빠지고 새 헤더가 들어옴
    old.remove();
    const next = mountHeader(76);
    act(() => observers.get(old)?.());
    expect(result.current).toBe(72);

    nav.pathname = "/ko/book/search";
    rerender();
    expect(result.current).toBe(76);

    // 이후 크기 변화는 새 헤더를 따름
    next.getBoundingClientRect = () => ({ height: 64 }) as DOMRect;
    act(() => observers.get(next)?.());
    expect(result.current).toBe(64);
  });
});
