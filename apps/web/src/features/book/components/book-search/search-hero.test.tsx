import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SearchHero } from "./search-hero";

const environment = vi.hoisted(() => ({ reduced: false, inView: true }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: undefined, inView: environment.inView }),
}));
vi.mock("@/shared/hooks/use-prefers-reduced-motion", () => ({
  usePrefersReducedMotion: () => environment.reduced,
}));

beforeEach(() => {
  sessionStorage.clear();
  environment.reduced = false;
  environment.inView = true;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: environment.reduced })),
  );
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, "paused", { configurable: true, value: false });
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, "paused", { configurable: true, value: true });
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, "connection");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("검색 히어로 영상 로딩", () => {
  it("재생이 끝나면 영상 제어 버튼을 숨긴다", async () => {
    const { container } = render(<SearchHero />);
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    if (!video) return;
    await waitFor(() => expect(video.paused).toBe(false));
    fireEvent.playing(video);
    fireEvent.ended(video);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(video).toHaveStyle({ opacity: "1" });
  });

  it("검색으로 히어로가 다시 마운트돼도 완료한 영상을 재생하지 않는다", async () => {
    const { container, rerender } = render(<SearchHero key="before-search" />);
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1),
    );
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    if (!video) return;
    fireEvent.playing(video);
    fireEvent.ended(video);

    rerender(<SearchHero key="after-search" />);

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("이전에 끝까지 본 영상은 첫 장면 대신 마지막 장면을 보여 준다", async () => {
    sessionStorage.setItem(
      "book-search-video-completed:/videos/bookjeok_search_hero_v3.mp4",
      "1",
    );
    const { container } = render(<SearchHero />);
    await waitFor(() =>
      expect(container.querySelector("img")?.getAttribute("src")).toContain(
        "bookjeok_search_hero_v3_end.jpg",
      ),
    );
    expect(container.querySelector("video")).not.toHaveAttribute("src");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
  it("동작 줄이기에서는 영상을 요청하지 않고 검색 UI를 유지한다", () => {
    environment.reduced = true;
    const { container } = render(
      <SearchHero>
        <input aria-label="search" />
      </SearchHero>,
    );
    expect(container.querySelector("video")).not.toHaveAttribute("src");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "title" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "search" })).toBeVisible();
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("데이터 절약에서는 다운로드하지 않고 명시적인 재생 요청만 허용한다", async () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: Object.assign(new EventTarget(), { saveData: true }),
    });
    const { container } = render(<SearchHero />);
    expect(container.querySelector("video")).not.toHaveAttribute("src");
    fireEvent.click(screen.getByRole("button", { name: "hero.play" }));
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce(),
    );
    expect(container.querySelector("video")).toHaveAttribute(
      "src",
      "/videos/bookjeok_search_hero_v3.mp4",
    );
  });

  it("자동재생 차단 때 포스터와 검색을 유지하고 직접 재생을 허용한다", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new DOMException("Blocked", "NotAllowedError"),
    );
    const { container } = render(
      <SearchHero>
        <input aria-label="search" />
      </SearchHero>,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "hero.play" })).toBeEnabled(),
    );
    expect(container.querySelector("video")).toHaveStyle({ opacity: "0" });
    expect(screen.getByRole("textbox", { name: "search" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "hero.play" }));
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2),
    );
  });

  it("화면 밖에서는 정지하고 돌아오면 이어 재생한다", async () => {
    const { container, rerender } = render(<SearchHero />);
    await waitFor(() =>
      expect(container.querySelector("video")?.paused).toBe(false),
    );
    environment.inView = false;
    rerender(<SearchHero />);
    expect(container.querySelector("video")?.paused).toBe(true);
    environment.inView = true;
    rerender(<SearchHero />);
    await waitFor(() =>
      expect(container.querySelector("video")?.paused).toBe(false),
    );
  });
});
