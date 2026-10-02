import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";
import { StackShareDialog } from "@/features/reading-log/components/stack-view/stack-share-dialog";

const renderImage = vi.hoisted(() => vi.fn());
const settings = vi.hoisted(() => ({
  data: undefined as { isReadingLogPublic: boolean } | undefined,
}));
const updateSettings = vi.hoisted(() => vi.fn());

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
  useLocale: () => "ko",
}));
vi.mock("@bookjeok/react-query", () => ({
  useReadingLogSettingsQuery: () => settings,
}));
vi.mock("@/features/reading-log/mutations", () => ({
  useUpdateReadingLogSettingsMutation: () => ({
    mutate: updateSettings,
    isPending: false,
  }),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement("img", { src, alt }),
}));
vi.mock("@/styles/fonts", () => ({
  gaegu: { style: { fontFamily: "Gaegu" } },
  gowun_batang: { style: { fontFamily: "Gowun Batang" } },
}));
vi.mock(
  "@/features/reading-log/components/stack-view/stack-height-chip",
  () => ({ StackHeightChip: () => null }),
);
vi.mock("@/features/reading-log/components/stack-view/lib/share-image", () => ({
  renderStackShareImage: renderImage,
}));

beforeAll(() => {
  globalThis.URL.createObjectURL ??= () => "blob:stack";
  globalThis.URL.revokeObjectURL ??= () => {};
});

beforeEach(() => {
  settings.data = undefined;
  updateSettings.mockReset();
  renderImage.mockReset();
  renderImage.mockResolvedValue({
    toBlob: (cb: (b: Blob) => void) => cb(new Blob(["png"])),
  });
});

const books = SAMPLE_BOOKS.slice(0, 8);

const OBJECT = {
  spec: { id: "dachshund" as const, heightMm: 300 },
  labels: { myHeight: "object" } as never,
  subline: "object-subline",
};

function setup(initialMode: "object" | "person" = "person", handle?: string) {
  return render(
    <StackShareDialog
      open
      onOpenChange={vi.fn()}
      year={2026}
      books={books}
      stackMm={200}
      userMm={1730}
      character="M"
      status={{} as never}
      labels={{ myHeight: "person" } as never}
      texts={{ subline: "person-subline" } as never}
      initialMode={initialMode}
      object={OBJECT}
      handle={handle}
    />,
  );
}

const lastLegend = () => renderImage.mock.calls.at(-1)?.[0].legend;

describe("StackShareDialog 제목 넣을 책", () => {
  it("고르기 전에는 맨 위 5권과 나머지 권수를 넘긴다", async () => {
    setup();
    await waitFor(() => expect(renderImage).toHaveBeenCalled());
    expect(lastLegend()).toEqual({
      ids: books.slice(-5).map((b) => b.logId),
      heading: "legend_heading",
      rest: 'legend_rest:{"count":3}',
    });
  });

  it("5권을 채우면 나머지는 못 고르고, 하나 빼면 다시 그린다", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "legend_edit" }));
    const boxes = screen.getAllByRole("checkbox");
    // 최근 순: 앞 5개가 켜져 있고 나머지는 막혀 있다
    expect(
      boxes.slice(0, 5).every((b) => (b as HTMLInputElement).checked),
    ).toBe(true);
    expect(boxes.slice(5).every((b) => (b as HTMLInputElement).disabled)).toBe(
      true,
    );

    fireEvent.click(boxes[0]);
    expect(boxes[5]).not.toBeDisabled();
    await waitFor(() => expect(lastLegend()?.ids).toHaveLength(4));
    expect(lastLegend()?.ids).not.toContain(books[7].logId);
  });

  it("모두 빼면 목록 없이 그린다", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "legend_edit" }));
    screen
      .getAllByRole("checkbox")
      .filter((b) => (b as HTMLInputElement).checked)
      .forEach((b) => fireEvent.click(b));
    await waitFor(() => expect(lastLegend()).toBeUndefined());
  });
});

describe("StackShareDialog 비교 대상", () => {
  const lastCall = () => renderImage.mock.calls.at(-1)?.[0];

  it("화면에서 보던 사물 탭으로 열고 사물 장면과 부제를 넘긴다", async () => {
    setup("object");
    await waitFor(() => expect(renderImage).toHaveBeenCalled());
    expect(lastCall().object).toEqual(OBJECT.spec);
    expect(lastCall().labels).toEqual(OBJECT.labels);
    expect(lastCall().texts.subline).toBe("object-subline");
  });

  it("사람으로 바꾸면 사물 없이 다시 그린다", async () => {
    setup("object");
    await waitFor(() => expect(renderImage).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "mode_person" }));
    await waitFor(() => expect(lastCall().object).toBeUndefined());
    expect(lastCall().labels).toEqual({ myHeight: "person" });
    expect(lastCall().texts.subline).toBe("person-subline");
  });
});

describe("StackShareDialog 프로필 링크", () => {
  it("핸들이 있으면 이미지와 같은 해의 프로필 주소를 보여 준다", () => {
    setup("person", "reader");
    expect(
      screen.getByText(`${window.location.host}/users/reader`),
    ).toBeInTheDocument();
    expect(screen.getByText("link_hint")).toBeInTheDocument();
  });

  it("링크 복사는 연도와 공유 표시가 붙은 주소를 복사한다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    setup("person", "reader");
    fireEvent.click(screen.getByRole("button", { name: "link_copy" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/ko/users/reader?year=2026&ref=share`,
      ),
    );
  });

  it("비공개면 알리고 공개로 바꿀 수 있다", () => {
    settings.data = { isReadingLogPublic: false };
    setup("person", "reader");
    expect(screen.getByRole("alert")).toHaveTextContent("link_private");
    fireEvent.click(screen.getByRole("button", { name: "link_make_public" }));
    expect(updateSettings).toHaveBeenCalledWith(true);
  });

  it("핸들이 없으면 링크 줄을 그리지 않는다", () => {
    setup();
    expect(screen.queryByText("link_hint")).not.toBeInTheDocument();
  });
});
