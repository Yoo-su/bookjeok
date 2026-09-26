import { render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthorPeek } from "./index";
import { AUTHOR_SIGNATURES } from "./signatures";

describe("AuthorPeek 서명", () => {
  beforeEach(() => {
    // jsdom에는 Web Animations API가 없다
    Element.prototype.animate = vi.fn(() => ({
      cancel: vi.fn(),
      onfinish: null,
    })) as unknown as Element["animate"];
  });
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).animate;
  });

  it("오른쪽에서 나와도 이름은 뒤집힌 틀 밖에 있어 거울상이 되지 않는다", () => {
    const { container } = render(
      <AuthorPeek
        author="kundera"
        side="right"
        action="heart"
        height={270}
        playKey={1}
      />,
    );
    const name = container.querySelector(
      `path[d="${AUTHOR_SIGNATURES.kundera.d}"]`,
    );
    expect(name).not.toBeNull();
    for (let el = name?.parentElement; el; el = el.parentElement)
      expect(el.style.transform).not.toContain("scaleX(-1)");
  });

  it("작가마다 서명이 있다", () => {
    for (const sig of Object.values(AUTHOR_SIGNATURES)) {
      expect(sig.d.length).toBeGreaterThan(100);
      expect(sig.w).toBeGreaterThan(0);
    }
  });
});
