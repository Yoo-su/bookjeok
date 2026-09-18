import { describe, expect, it } from "vitest";

import {
  prepareReviewContent,
  sanitizeReviewContent,
} from "../sanitize-review-content";

describe("review outline", () => {
  it("allows local image object URLs only in draft previews", () => {
    const content =
      '<img src="blob:http://localhost/draft"><a href="blob:http://localhost/link">link</a>';
    expect(prepareReviewContent(content).html).not.toContain('src="blob:');
    expect(prepareReviewContent(content, true).html).toContain('src="blob:');
    expect(prepareReviewContent(content, true).html).not.toContain(
      'href="blob:',
    );
  });
  it("produces unique deterministic anchors, decoded labels and legacy levels", () => {
    const content =
      '<h1 id="unsafe">같은 제목</h1><h2><strong>같은 제목</strong></h2><h3>A &amp; B &lt;C&gt;</h3><h6>마지막</h6>';
    const result = prepareReviewContent(content);
    expect(result).toEqual(prepareReviewContent(content));
    expect(result.headings.map(({ id }) => id)).toEqual([
      "review-section-1",
      "review-section-2",
      "review-section-3",
      "review-section-4",
    ]);
    expect(result.headings.map(({ text, level }) => [text, level])).toEqual([
      ["같은 제목", 1],
      ["같은 제목", 2],
      ["A & B <C>", 3],
      ["마지막", 6],
    ]);
    for (const heading of result.headings)
      expect(result.html).toContain(`id="${heading.id}"`);
    expect(result.html).not.toContain('id="unsafe"');
  });
  it("omits empty headings without removing existing content", () => {
    const result = prepareReviewContent(
      "<h2> &nbsp; </h2><p>본문</p><h3>끝</h3>",
    );
    expect(result.headings).toEqual([
      { id: "review-section-2", text: "끝", level: 3 },
    ]);
    expect(result.html).toContain("<p>본문</p>");
  });
  it("does not weaken sanitization or permit attacker supplied anchors", () => {
    const result = prepareReviewContent(
      '<h2 onclick="bad()" id="location">안전<script>bad()</script></h2><img src="javascript:bad()" onerror="bad()"><p id="review-section-1">본문</p>',
    );
    expect(result.headings[0].text).toBe("안전");
    expect(result.html).not.toMatch(
      /onclick|onerror|javascript:|<script|id="location"/,
    );
    expect(result.html.match(/id="review-section-1"/g)).toHaveLength(1);
    expect(sanitizeReviewContent('<h2 id="x">제목</h2>')).toBe("<h2>제목</h2>");
  });
});
