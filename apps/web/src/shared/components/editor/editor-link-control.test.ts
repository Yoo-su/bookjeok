import { describe, expect, it } from "vitest";

import { normalizeEditorUrl } from "./editor-link-control";

describe("editor link input", () => {
  it("accepts web and email links, and supplies https for bare domains", () => {
    expect(normalizeEditorUrl(" example.com/books ")).toBe(
      "https://example.com/books",
    );
    expect(normalizeEditorUrl("https://example.com/?q=책")).toContain(
      "https://example.com/",
    );
    expect(normalizeEditorUrl("mailto:reader@example.com")).toBe(
      "mailto:reader@example.com",
    );
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///secret",
    "",
    "https://",
    "bad url",
    "java\nscript:alert(1)",
  ])("rejects %s", (url) => {
    expect(normalizeEditorUrl(url)).toBeNull();
  });
});
