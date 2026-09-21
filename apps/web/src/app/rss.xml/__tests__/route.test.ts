import * as apis from "@bookjeok/api-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "../route";

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof apis>()),
  getReviews: vi.fn(),
  getRecentBookSales: vi.fn(),
}));

const review = {
  id: 1,
  title: "리뷰 제목",
  content: "<p>첫 문장이다.</p><p>둘째 &amp; 문장.</p>",
  createdAt: "2026-09-01T00:00:00.000Z",
  book: { title: "책 제목" },
};

const sale = {
  id: 2,
  title: "판매글 제목",
  content: "판매합니다",
  price: 10000,
  createdAt: "2026-09-02T00:00:00.000Z",
  book: { title: "책 제목" },
};

const parse = (xml: string) =>
  new DOMParser().parseFromString(xml, "application/xml");

const readFeed = async () => {
  const res = await GET();
  const xml = await res.text();
  return { xml, doc: parse(xml) };
};

/** 링크로 항목을 집는다. 피드는 최신순 정렬이라 순서로 집으면 흔들린다. */
const findItemBy = (doc: Document, linkFragment: string) =>
  [...doc.querySelectorAll("item")].find((item) =>
    item.querySelector("link")?.textContent?.includes(linkFragment),
  );

describe("GET /rss.xml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apis.getReviews).mockResolvedValue({
      reviews: [review],
    } as never);
    vi.mocked(apis.getRecentBookSales).mockResolvedValue([sale] as never);
  });

  it("본문 HTML을 벗겨 설명에 싣는다", async () => {
    const { doc } = await readFeed();

    const descriptions = [...doc.querySelectorAll("item > description")].map(
      (node) => node.textContent,
    );

    expect(descriptions).toContain("첫 문장이다. 둘째 & 문장.");
  });

  it("항목마다 카테고리를 붙인다", async () => {
    const { doc } = await readFeed();

    const categories = [...doc.querySelectorAll("item > category")].map(
      (node) => node.textContent,
    );

    expect(categories).toEqual(
      expect.arrayContaining(["도서리뷰", "중고도서"]),
    );
  });

  it("리뷰의 태그를 카테고리로 함께 싣는다", async () => {
    // 네이버가 RSS를 신규 웹문서 수집 소스로 쓴다. 고정값 하나만 실으면
    // 글마다 주제 구분이 없다.
    vi.mocked(apis.getReviews).mockResolvedValue({
      reviews: [{ ...review, tags: ["카뮈", "부조리"] }],
    } as never);

    const { doc } = await readFeed();

    const categories = [
      ...(findItemBy(doc, "/book/reviews/1")?.querySelectorAll("category") ??
        []),
    ].map((node) => node.textContent);

    expect(categories).toEqual(["도서리뷰", "카뮈", "부조리"]);
  });

  it("태그가 없는 리뷰도 기본 카테고리는 유지한다", async () => {
    const { doc } = await readFeed();

    const categories = [
      ...(findItemBy(doc, "/book/reviews/1")?.querySelectorAll("category") ??
        []),
    ].map((node) => node.textContent);

    expect(categories).toEqual(["도서리뷰"]);
  });

  it("본문에 CDATA 종료 문자열이 있어도 XML이 깨지지 않는다", async () => {
    vi.mocked(apis.getReviews).mockResolvedValue({
      reviews: [{ ...review, content: "탈출 시도 ]]> 뒤 문장" }],
    } as never);

    const { doc } = await readFeed();

    expect(doc.querySelector("parsererror")).toBeNull();
    expect(
      findItemBy(doc, "/book/reviews/1")?.querySelector("description")
        ?.textContent,
    ).toBe("탈출 시도 ]]> 뒤 문장");
  });

  it("한쪽 조회가 실패해도 나머지로 피드를 만든다", async () => {
    vi.mocked(apis.getReviews).mockRejectedValue(new Error("down"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { doc } = await readFeed();

    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelectorAll("item")).toHaveLength(1);

    consoleError.mockRestore();
  });
});
