/**
 * dock 패널의 포커스 관리.
 * 열면 패널로 들어가고, 닫으면 연 버튼으로 돌아오며, 모바일 시트는 Tab이 밖으로 새지 않는다.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { DockPanel } from "./dock-panel";

vi.mock("next-intl", () => ({
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));

vi.mock("@/shared/hooks/use-body-scroll-lock", () => ({
  useBodyScrollLock: vi.fn(),
}));

const media = vi.hoisted(() => ({ isDesktop: false }));
vi.mock("@/shared/hooks/use-media-query", () => ({
  useMediaQuery: () => media.isDesktop,
}));

// jsdom은 배치를 안 해 getClientRects가 비어 모든 요소를 안 보이는 것으로 봄.
// 열림 애니메이션도 끝나지 않아(visibility hidden) 패널 안은 역할 대신 글자·라벨로 찾음
const originalRects = HTMLElement.prototype.getClientRects;
beforeAll(() => {
  HTMLElement.prototype.getClientRects = function () {
    return [{}] as unknown as DOMRectList;
  };
});
afterAll(() => {
  HTMLElement.prototype.getClientRects = originalRects;
});

const Harness = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)}>
        opener
      </button>
      <button type="button">elsewhere</button>
      <DockPanel open={open} onClose={() => setOpen(false)} label="패널">
        <button type="button">first</button>
        <a href="#x">middle</a>
        <button type="button">last</button>
      </DockPanel>
    </>
  );
};

const toggle = () => {
  const opener = screen.getByRole("button", { name: "opener" });
  act(() => opener.focus());
  fireEvent.click(opener);
  return opener;
};

const panel = () =>
  screen.getByLabelText("패널", { selector: "[role=dialog]" });

beforeEach(() => {
  media.isDesktop = false;
});

describe.each([
  ["모바일 시트", false],
  ["데스크톱 카드", true],
])("DockPanel 포커스 — %s", (_, isDesktop) => {
  beforeEach(() => {
    media.isDesktop = isDesktop;
  });

  it("열면 패널로 포커스가 옮겨 간다", () => {
    render(<Harness />);
    toggle();
    expect(document.activeElement).toBe(panel());
  });

  it("패널 안에 포커스가 있을 때 Esc로 닫으면 연 버튼으로 돌아온다", () => {
    render(<Harness />);
    const opener = toggle();
    act(() => screen.getByText("last").focus());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(opener);
  });

  it("포커스가 이미 패널 밖으로 나갔으면 닫혀도 빼앗지 않는다", () => {
    render(<Harness />);
    toggle();
    const elsewhere = screen.getByRole("button", { name: "elsewhere" });
    act(() => elsewhere.focus());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(elsewhere);
  });
});

describe("DockPanel 모달 여부", () => {
  it("모바일 시트는 모달이고 Tab이 안에서 돈다", () => {
    render(<Harness />);
    toggle();
    expect(panel()).toHaveAttribute("aria-modal", "true");

    // 첫 요소는 시트 머리의 닫기 버튼
    const close = screen.getByLabelText("common.aria.close");
    const last = screen.getByText("last");

    act(() => last.focus());
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("데스크톱 카드는 페이지를 가리지 않아 모달이 아니다", () => {
    media.isDesktop = true;
    render(<Harness />);
    toggle();
    expect(panel()).not.toHaveAttribute("aria-modal");

    const last = screen.getByText("last");
    act(() => last.focus());
    const event = fireEvent.keyDown(last, { key: "Tab" });
    // 가두지 않으면 기본 동작(다음 요소로 이동)을 막지 않음
    expect(event).toBe(true);
  });
});
