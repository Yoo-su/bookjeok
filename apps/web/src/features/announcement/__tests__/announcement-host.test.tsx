import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ANNOUNCE_DELAY_MS,
  AnnouncementHost,
} from "@/features/announcement/components/announcement-host";
import {
  canAnnounceOn,
  pickAnnouncement,
} from "@/features/announcement/constants/announcements";
import { useAnnouncementStore } from "@/features/announcement/stores/use-announcement-store";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";

let pathname = "/";
vi.mock("@/shared/config/i18n/routing", () => ({
  usePathname: () => pathname,
}));

// 소개 모달 본체 대신 열림 상태만 보여 준다
vi.mock("next/dynamic", () => ({
  default: () =>
    function Intro(props: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }) {
      return (
        <div data-testid="intro" data-open={String(props.open)}>
          <button type="button" onClick={() => props.onOpenChange(false)}>
            close
          </button>
        </div>
      );
    },
}));

const DURING = new Date("2026-10-01T12:00:00+09:00");
const at = (iso: string) => Date.parse(iso);

describe("공지 기간과 경로", () => {
  it("기간 안이고 아직 보지 않았을 때만 고른다", () => {
    expect(pickAnnouncement(at("2026-09-25T23:59:00+09:00"), [])).toBe(
      undefined,
    );
    expect(pickAnnouncement(DURING.getTime(), [])?.id).toBe("reading-stack");
    expect(pickAnnouncement(DURING.getTime(), ["reading-stack"])).toBe(
      undefined,
    );
    expect(pickAnnouncement(at("2026-10-26T00:00:00+09:00"), [])).toBe(
      undefined,
    );
  });

  it("비로그인은 홈에서만, 로그인은 어디서나 띄우고 남의 공개 독서 키재기에서는 띄우지 않는다", () => {
    expect(canAnnounceOn("/", false)).toBe(true);
    expect(canAnnounceOn("/book/9788932003979/detail", false)).toBe(false);
    expect(canAnnounceOn("/book/9788932003979/detail", true)).toBe(true);
    expect(canAnnounceOn("/users/someone", true)).toBe(false);
    expect(canAnnounceOn("/users/someone", false)).toBe(false);
  });
});

describe("AnnouncementHost", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(DURING);
    pathname = "/";
    useAnnouncementStore.setState({ seen: [] });
    useAuthStore.setState({ accessToken: null });
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  const wait = () => act(() => vi.advanceTimersByTime(ANNOUNCE_DELAY_MS));

  it("홈에 들어온 비로그인 사용자에게 잠시 뒤 연다", () => {
    render(<AnnouncementHost />);
    expect(screen.queryByTestId("intro")).toBeNull();
    wait();
    expect(screen.getByTestId("intro")).toHaveAttribute("data-open", "true");
  });

  it("비로그인은 홈이 아니면 열지 않고, 로그인했으면 연다", () => {
    pathname = "/book/9788932003979/detail";
    const { unmount } = render(<AnnouncementHost />);
    wait();
    expect(screen.queryByTestId("intro")).toBeNull();
    unmount();

    useAuthStore.setState({ accessToken: "token" });
    render(<AnnouncementHost />);
    wait();
    expect(screen.getByTestId("intro")).toHaveAttribute("data-open", "true");
  });

  it("닫으면 본 것으로 기록하고 다시 열지 않는다", () => {
    const { rerender } = render(<AnnouncementHost />);
    wait();
    fireEvent.click(screen.getByText("close"));
    expect(useAnnouncementStore.getState().seen).toEqual(["reading-stack"]);
    expect(screen.getByTestId("intro")).toHaveAttribute("data-open", "false");
    rerender(<AnnouncementHost />);
    wait();
    expect(screen.getByTestId("intro")).toHaveAttribute("data-open", "false");
  });

  it("이미 봤거나 기간이 지났으면 열지 않는다", () => {
    useAnnouncementStore.setState({ seen: ["reading-stack"] });
    const { unmount } = render(<AnnouncementHost />);
    wait();
    expect(screen.queryByTestId("intro")).toBeNull();
    unmount();

    useAnnouncementStore.setState({ seen: [] });
    vi.setSystemTime(new Date("2026-10-27T00:00:00+09:00"));
    render(<AnnouncementHost />);
    wait();
    expect(screen.queryByTestId("intro")).toBeNull();
  });

  it("다른 모달이 열려 있으면 이번에는 건너뛰고 본 것으로 치지 않는다", () => {
    const other = document.createElement("div");
    other.setAttribute("role", "dialog");
    document.body.appendChild(other);
    render(<AnnouncementHost />);
    wait();
    expect(screen.queryByTestId("intro")).toBeNull();
    expect(useAnnouncementStore.getState().seen).toEqual([]);
  });
});
