import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { drawSceneItems } from "./draw-canvas";
import { SceneNodes } from "./scene-svg";
import { type AuthorArt, authorArtItems, tracedItems } from "./traced";

const art: AuthorArt = {
  sil: "M0 0L600 0L600 2000L0 2000Z",
  book: "M100 500L200 500L200 700Z",
  levels: ["M20 20L50 20L50 40Z"],
};
const colors = { paper: "#FFFFFF", line: "#2F2621", held: "#123456" };

describe("따낸 원화 배치", () => {
  it("높이·위치가 바뀌어도 원화 경로와 자식 노드를 재사용한다", () => {
    const first = authorArtItems(
      art,
      (x, y) => [10 + x * 0.5, 20 + y * 0.5],
      colors,
    )[0];
    const second = authorArtItems(
      art,
      (x, y) => [80 + x * 0.25, 60 + y * 0.25],
      colors,
    )[0];
    expect(first.children).toBe(second.children);
    expect(first.transform).toEqual([0.25, 0, 0, 0.25, 10, 20]);
    expect(second.transform).toEqual([0.125, 0, 0, 0.125, 80, 60]);
    expect(first.children[0]).toMatchObject({ d: art.sil, fill: colors.paper });
    expect(first.children[2]).toMatchObject({
      d: art.levels[0],
      rule: "evenodd",
      op: 0.3,
    });
  });
  it("책 색을 바꾸면 새 표지색을 반영하고 연필 농도는 유지한다", () => {
    const group = authorArtItems(art, (x, y) => [x, y], {
      ...colors,
      held: "#ABCDEF",
    })[0];
    expect(group.children[1]).toMatchObject({ fill: "#ABCDEF" });
    expect(group.children[2]).toMatchObject({ op: 0.3 });
  });
  it("빈 내부를 메우는 면은 윤곽과 별도로 불투명하게 칠한다", () => {
    const backing = "M100 100L400 100L400 400Z";
    const group = tracedItems({ ...art, backing }, (x, y) => [x, y], {
      skin: colors.paper,
      line: colors.line,
    })[0];
    expect(group.children.slice(0, 2)).toEqual([
      { k: "p", d: backing, fill: colors.paper },
      { k: "p", d: art.sil, fill: colors.paper },
    ]);
  });
  it("SVG와 공유 Canvas에서 같은 변환을 적용하고 다음 도형에는 누적하지 않는다", () => {
    const items = authorArtItems(
      art,
      (x, y) => [10 + x * 0.5, 20 + y * 0.5],
      colors,
    );
    const svg = renderToStaticMarkup(
      <svg>
        <SceneNodes items={items} />
      </svg>,
    );
    expect(svg).toContain('transform="matrix(0.25 0 0 0.25 10 20)"');
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      transform: vi.fn(),
      fill: vi.fn(),
    };
    vi.stubGlobal(
      "Path2D",
      class {
        constructor(public d: string) {}
      },
    );
    try {
      drawSceneItems(ctx as unknown as CanvasRenderingContext2D, items, {
        hand: "Gaegu",
        ui: "sans-serif",
      });
      expect(ctx.transform).toHaveBeenCalledExactlyOnceWith(
        0.25,
        0,
        0,
        0.25,
        10,
        20,
      );
      expect(ctx.save).toHaveBeenCalledTimes(4);
      expect(ctx.restore).toHaveBeenCalledTimes(4);
      expect(ctx.fill).toHaveBeenLastCalledWith(expect.anything(), "evenodd");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
