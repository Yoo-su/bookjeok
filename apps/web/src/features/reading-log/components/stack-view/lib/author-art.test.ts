import { describe, expect, it } from "vitest";

import { loadAuthorArt } from "./author-art";
import { STACK_AUTHOR_IDS } from "./authors";
import { buildFigure } from "./figure";

const C = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

describe("작가 시안 전신", () => {
  it.each(STACK_AUTHOR_IDS)(
    "%s: 받은 전신에 손에 든 책 색을 칠한다",
    async (id) => {
      const art = await loadAuthorArt(id);
      expect(art.book.length).toBeGreaterThan(0);
      const items = buildFigure({
        fx: 0,
        fy: 0,
        k: 0.4,
        colors: C,
        u: 1,
        mood: "calm",
        character: id,
        heldColor: "#AB1234",
        boil: true,
        authorArt: art,
      });
      const json = JSON.stringify(items);
      expect(json).toContain('"fill":"#AB1234"');
      expect(json).toContain('"rule":"evenodd"');
      // 통째로 딴 그림은 한 벌만 그린다
      expect(json).not.toContain("stack-boil");
    },
  );
});
