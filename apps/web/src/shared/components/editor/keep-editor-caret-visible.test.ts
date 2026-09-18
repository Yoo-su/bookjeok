import { describe, expect, it } from "vitest";

import { getCaretScrollDelta } from "./keep-editor-caret-visible";

describe("editor caret visibility", () => {
  it("does not move a visible typing line", () => {
    expect(
      getCaretScrollDelta({ top: 220, bottom: 244 }, { top: 160, bottom: 700 }),
    ).toBe(0);
  });
  it("brings a line hidden above the sticky toolbar back below it", () => {
    expect(
      getCaretScrollDelta(
        { top: -300, bottom: -276 },
        { top: 160, bottom: 700 },
      ),
    ).toBe(-460);
  });
  it("brings a line below the visible keyboard viewport into view", () => {
    expect(
      getCaretScrollDelta({ top: 650, bottom: 674 }, { top: 160, bottom: 400 }),
    ).toBe(274);
  });
});
