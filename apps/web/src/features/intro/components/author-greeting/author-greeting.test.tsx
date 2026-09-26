import { act, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildFigure } from "@/features/reading-log/components/stack-view/lib/figure";
import type { SceneItem } from "@/features/reading-log/components/stack-view/lib/types";

import { AuthorGreeting, GREETING_FIRST_MS, GREETING_MIN_WIDTH } from "./index";

let reduce = false;
vi.mock("@/shared/hooks/use-prefers-reduced-motion", () => ({
  usePrefersReducedMotion: () => reduce,
}));

// 실제 인사 대신 누가 어떤 동작으로 나왔는지만 남기고 1초 뒤 끝낸다
vi.mock("next/dynamic", async () => {
  const { useEffect } = await import("react");
  return {
    default: () =>
      function Peek(p: {
        action: string;
        playKey: number;
        onDone?: () => void;
      }) {
        useEffect(() => {
          const id = setTimeout(() => p.onDone?.(), 1000);
          return () => clearTimeout(id);
        }, [p]);
        return (
          <div data-testid="peek" data-action={p.action} data-key={p.playKey} />
        );
      },
  };
});

class IO {
  constructor(private cb: IntersectionObserverCallback) {}
  observe() {
    this.cb(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  disconnect() {}
}

const setWidth = (w: number) =>
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: w,
  });

describe("AuthorGreeting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("IntersectionObserver", IO);
    reduce = false;
    setWidth(1280);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("넓은 화면에서 잠시 뒤 작가 한 명을 내보낸다", () => {
    render(<AuthorGreeting />);
    expect(screen.queryByTestId("peek")).toBeNull();
    act(() => vi.advanceTimersByTime(GREETING_FIRST_MS));
    expect(["bow", "wave", "heart"]).toContain(
      screen.getByTestId("peek").dataset.action,
    );
  });

  it("좁은 화면이나 동작 줄이기에서는 내보내지 않는다", () => {
    setWidth(GREETING_MIN_WIDTH - 1);
    const { unmount } = render(<AuthorGreeting />);
    act(() => vi.advanceTimersByTime(GREETING_FIRST_MS * 3));
    expect(screen.queryByTestId("peek")).toBeNull();
    unmount();

    setWidth(1280);
    reduce = true;
    render(<AuthorGreeting />);
    act(() => vi.advanceTimersByTime(GREETING_FIRST_MS * 3));
    expect(screen.queryByTestId("peek")).toBeNull();
  });

  it("횟수 제한 없이 끝날 때마다 다음 작가를 내보낸다", () => {
    render(<AuthorGreeting />);
    act(() => vi.advanceTimersByTime(GREETING_FIRST_MS));
    const keys = new Set<string>();
    for (let i = 0; i < 10; i++) {
      keys.add(screen.getByTestId("peek").dataset.key ?? "");
      // 끝나면 치우고, 다음 간격(최대 6초)을 기다린다
      act(() => vi.advanceTimersByTime(1000));
      expect(screen.queryByTestId("peek")).toBeNull();
      act(() => vi.advanceTimersByTime(6000));
    }
    expect(keys.size).toBe(10);
  });

  it("다른 창이 떠 있으면 건너뛰었다가 닫히면 내보낸다", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.appendChild(dialog);
    render(<AuthorGreeting />);
    act(() => vi.advanceTimersByTime(GREETING_FIRST_MS));
    expect(screen.queryByTestId("peek")).toBeNull();
    dialog.remove();
    act(() => vi.advanceTimersByTime(GREETING_FIRST_MS));
    expect(screen.getByTestId("peek")).toBeInTheDocument();
  });
});

describe("인사용 캐릭터 그림", () => {
  const groups = (items: SceneItem[]): string[] =>
    items.flatMap((it) =>
      it.k === "g" ? [it.cls, ...groups(it.children)] : [],
    );
  const figure = (o: { arm?: "wave" | "heart"; peek?: boolean }) =>
    buildFigure({
      fx: 0,
      fy: 0,
      k: 0.3,
      colors: {
        paper: "#fff",
        ink: "#000",
        pen: "#047857",
        muted: "#777",
        faint: "#aaa",
      },
      u: 1,
      mood: "calm",
      character: "kafka",
      heldColor: "#123456",
      boil: false,
      ...o,
    });

  it("손하트는 머리·팔뚝·하트를 따로 묶어 움직일 수 있게 한다", () => {
    expect(groups(figure({ arm: "heart", peek: true }))).toEqual([
      "stack-figure",
      "peek-head",
      "peek-forearm",
      "peek-heart",
    ]);
    expect(groups(figure({ arm: "wave", peek: true }))).not.toContain(
      "peek-heart",
    );
  });

  it("무대의 평소 그림에는 인사용 묶음이 없다", () => {
    expect(groups(figure({}))).toEqual(["stack-figure"]);
  });
});
