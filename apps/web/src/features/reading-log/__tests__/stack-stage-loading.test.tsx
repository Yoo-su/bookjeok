import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { SAMPLE_BOOKS } from "../components/stack-view/lib/sample-books";
import type { AuthorArt } from "../components/stack-view/lib/traced";
import {
  StackStage,
  type StackStagePerson,
} from "../components/stack-view/stack-stage";
const mock = vi.hoisted(() => ({
  art: undefined as AuthorArt | undefined,
  pending: false,
}));
vi.mock("../components/stack-view/hooks/use-author-art", () => ({
  useAuthorArt: () => mock,
}));
vi.mock("../components/stack-view/hooks/use-canvas-measure", () => ({
  useCanvasMeasure: () => measure,
}));
vi.mock("@/shared/hooks/use-prefers-reduced-motion", () => ({
  usePrefersReducedMotion: () => false,
}));
const measure = (t: string, s: number) => t.length * s * 0.5;
const person = (
  character: StackStagePerson["character"],
  userMm = 1730,
): StackStagePerson => ({
  character,
  userMm,
  labelsFor: () => ({
    myHeight: "173cm",
    remain: "80cm",
    approxBooks: "40",
    stackHeight: "94cm",
    bubble: ["작가", "비교"],
  }),
});
beforeEach(() => {
  mock.art = undefined;
  mock.pending = false;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(640);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(600);
  Object.defineProperty(SVGElement.prototype, "getBBox", {
    configurable: true,
    value: () => ({ x: 100, y: 200, width: 60, height: 10 }),
  });
  Object.defineProperty(SVGElement.prototype, "animate", {
    configurable: true,
    value: vi.fn(() => ({ finish: vi.fn() })),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("작가를 받는 동안 이전 장면을 유지하고 책 입장을 다시 시작하지 않는다", async () => {
  const intro = vi.fn();
  const props = {
    books: SAMPLE_BOOKS,
    stackMm: 949,
    replayKey: 0,
    stackClickLabel: "목록",
    ariaLabel: "키재기",
    onIntroStart: intro,
  };
  const view = render(<StackStage {...props} person={person("M")} />);
  await waitFor(() => expect(intro).toHaveBeenCalledTimes(1));
  const books = view.container.querySelectorAll(".stack-book");
  mock.pending = true;
  view.rerender(<StackStage {...props} person={person("kafka", 1820)} />);
  expect(view.container.querySelector("svg")).not.toBeNull();
  expect(view.container.querySelector(".stack-book")).toBe(books[0]);
  const wrap = view.container.firstElementChild!;
  expect(wrap).toHaveClass("stack-art-pending");
  mock.pending = false;
  mock.art = {
    sil: "M0 0L600 0L600 2000L0 2000Z",
    book: "M0 500L100 500L100 700Z",
    levels: [],
  };
  view.rerender(<StackStage {...props} person={person("kafka", 1820)} />);
  await waitFor(() =>
    expect(view.container.querySelector(".traced-art")).not.toBeNull(),
  );
  expect(wrap).not.toHaveClass("stack-art-pending");
  expect(intro).toHaveBeenCalledTimes(1);
  expect(view.container.querySelector(".stack-book")).toBe(books[0]);
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});
it("처음 작가를 받기 전에는 점선과 책을 먼저 그리지 않는다", () => {
  mock.pending = true;
  const view = render(
    <StackStage
      books={SAMPLE_BOOKS}
      stackMm={949}
      person={person("woolf")}
      replayKey={0}
      stackClickLabel="목록"
      ariaLabel="키재기"
    />,
  );
  expect(view.container.querySelector("svg")).toBeNull();
});
