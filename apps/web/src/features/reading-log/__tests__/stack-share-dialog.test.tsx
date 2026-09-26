import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";
import { StackShareDialog } from "@/features/reading-log/components/stack-view/stack-share-dialog";

const renderImage = vi.hoisted(() => vi.fn());

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
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
  renderImage.mockReset();
  renderImage.mockResolvedValue({
    toBlob: (cb: (b: Blob) => void) => cb(new Blob(["png"])),
  });
});

const books = SAMPLE_BOOKS.slice(0, 8);

function setup() {
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
      labels={{} as never}
      texts={{} as never}
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
