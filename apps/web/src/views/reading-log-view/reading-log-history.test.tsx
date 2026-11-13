import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { expect, it, vi } from "vitest";

import { ReadingLogView } from "./index";

const subscribe = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(
      useSyncExternalStore(subscribe, () => window.location.search),
    ),
}));
vi.mock("@/features/reading-log/components/common/reading-log-hero", () => ({
  ReadingLogHero: () => null,
}));
vi.mock(
  "@/features/reading-log/components/calendar-view/reading-log-calendar",
  () => ({
    ReadingLogCalendar: ({
      currentDate,
      openDate,
      onOpenDay,
      onCloseDay,
    }: {
      currentDate: Date;
      openDate: Date | null;
      onOpenDay: (date: Date) => void;
      onCloseDay: () => void;
    }) => (
      <>
        <output>{currentDate.getMonth() + 1}</output>
        <button onClick={() => onOpenDay(new Date(2024, 6, 10))}>
          Open day
        </button>
        {openDate && <button onClick={onCloseDay}>Close day</button>}
      </>
    ),
  }),
);

it("날짜 상세를 닫으면 원래 달로 돌아가고 앞으로가기로 다시 연다", async () => {
  window.history.replaceState(
    null,
    "",
    "/en/my-page/reading-log?view=calendar&month=2024-06&ref=dock",
  );
  render(<ReadingLogView />);

  fireEvent.click(screen.getByText("Open day"));
  // Next의 네이티브 History API 연동을 테스트의 URL 구독으로 전달한다.
  act(() => window.dispatchEvent(new PopStateEvent("popstate")));
  expect(window.location.pathname).toBe("/en/my-page/reading-log");
  expect(new URLSearchParams(window.location.search).get("ref")).toBe("dock");
  expect(screen.getByText("Close day")).toBeInTheDocument();

  fireEvent.click(screen.getByText("Close day"));
  await waitFor(() =>
    expect(screen.queryByText("Close day")).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("status")).toHaveTextContent("6");

  window.history.forward();
  expect(await screen.findByText("Close day")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("7");
});
