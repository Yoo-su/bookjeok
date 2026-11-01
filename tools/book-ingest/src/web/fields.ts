import { type BookDimensions, toDimensions } from "../dimensions";
import { type Candidate, type Draft, localToday, screen } from "../normalize";
import {
  attr,
  compactText,
  documentOf,
  elements,
  hasClass,
  meta,
  textOf,
} from "./html";

export interface AladinDetail {
  draft: Draft;
  dimensions: BookDimensions;
  /** The website also uses K-prefixed product codes for description requests. */
  productCode: string;
}

/** Names with the same role share one parenthesis group, as in the old API. */
function authorsOf(raw: string) {
  const authors: string[] = [];
  const translators: string[] = [];
  const translatorRoles = new Set(["옮긴이", "번역", "역자", "역"]);
  const names = (value: string) =>
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const group = /([^()]*)\(([^()]*)\)/g;
  let rest = 0;
  for (let match = group.exec(raw); match; match = group.exec(raw)) {
    (translatorRoles.has(match[2].trim()) ? translators : authors).push(
      ...names(match[1]),
    );
    rest = group.lastIndex;
  }
  authors.push(...names(raw.slice(rest)));
  return { authors, translators };
}

export function parseAladinDetail(html: string, isbn: string): AladinDetail {
  const root = documentOf(html);
  if (meta(root, "books:isbn") !== isbn)
    throw new Error(`알라딘 ISBN 불일치: ${isbn}`);
  const scripts = elements(
    root,
    (e) => e.tagName === "script" && attr(e, "type") === "application/ld+json",
  );
  // Book metadata is mandatory. Never mistake a login/error page (HTTP 200) for a book.
  const data = scripts
    .map((e) => {
      try {
        return JSON.parse(textOf(e.childNodes[0]));
      } catch {
        return null;
      }
    })
    .find((d) => d?.["@type"] === "Book");
  const work = data?.workExample?.find(
    (w: { isbn?: string }) => w.isbn === isbn,
  );
  const bindingByFormat: Record<string, string> = {
    "https://schema.org/Paperback": "반양장본",
    "https://schema.org/Hardcover": "양장본",
  };
  const binding = bindingByFormat[work?.bookFormat];
  if (!binding) throw new Error(`알라딘 종이책 제본 확인 실패: ${isbn}`);
  const basic = elements(root, (e) => hasClass(e, "conts_info_list1"))[0];
  const specs = basic
    ? elements(basic, (e) => e.tagName === "li").map(compactText)
    : [];
  const size = specs
    .join(" ")
    .match(/(\d+(?:\.\d+)?)\s*[*×x]\s*(\d+(?:\.\d+)?)\s*mm/i);
  const dimensions = toDimensions("aladin-web+yes24", {
    width: size?.[1],
    height: size?.[2],
    pages: specs
      .join(" ")
      .match(/([\d,]+)\s*쪽/)?.[1]
      ?.replaceAll(",", ""),
    weight: specs
      .join(" ")
      .match(/([\d,]+)\s*g\b/)?.[1]
      ?.replaceAll(",", ""),
    binding:
      specs.find((s) =>
        /^(?:양장본|반양장본|무선제본|스프링북|보드북)$/.test(s),
      ) ?? binding,
  });
  if (!dimensions) throw new Error(`알라딘 판형 없음: ${isbn}`);
  const authorRow = elements(
    root,
    (e) => e.tagName === "li" && hasClass(e, "Ere_sub2_title"),
  )[0];
  let authorText = "";
  for (const node of authorRow?.childNodes ?? []) {
    if ("tagName" in node && attr(node, "href").includes("PublisherSearch="))
      break;
    authorText += textOf(node);
  }
  const publisherLink =
    authorRow &&
    elements(authorRow, (e) => attr(e, "href").includes("PublisherSearch="))[0];
  const { authors, translators } = authorsOf(
    authorText.replace(/\s+/g, " ").trim(),
  );
  const priceRow = elements(root, (e) => hasClass(e, "info_list")).flatMap(
    (e) =>
      elements(
        e,
        (li) =>
          li.tagName === "li" &&
          elements(li, (n) => hasClass(n, "Litem") && compactText(n) === "정가")
            .length > 0,
      ),
  )[0];
  const price = Number(
    compactText(priceRow)
      .replace(/^정가\s*/, "")
      .match(/[\d,]+/)?.[0]
      ?.replaceAll(",", ""),
  );
  const pointNode = elements(root, (e) =>
    attr(e, "id").endsWith("pnlRanking"),
  )[0];
  const pointText = compactText(pointNode).match(
    /Sales Point\s*:\s*([\d,]+)/i,
  )?.[1];
  const cover = meta(root, "og:image");
  const coverUrl = new URL(cover || "https://invalid.local");
  if (
    coverUrl.hostname !== "image.aladin.co.kr" ||
    !coverUrl.pathname.includes("/cover500/") ||
    /noimg/i.test(cover)
  ) {
    throw new Error(`알라딘 500px 표지 없음: ${isbn}`);
  }
  const productCode = elements(
    root,
    (e) => e.tagName === "input" && hasClass(e, "hd_ISBN"),
  )
    .map((e) => attr(e, "value"))
    .find((value) => /^[a-z\d]{10}$/i.test(value));
  if (!productCode) throw new Error(`알라딘 소개 상품코드 없음: ${isbn}`);
  const titleNode = elements(root, (e) => hasClass(e, "Ere_bo_title"))[0];
  const subtitles = titleNode?.parentNode
    ? elements(
        titleNode.parentNode,
        (e) => e.tagName === "span" && hasClass(e, "Ere_sub1_title"),
      ).map(compactText)
    : [];
  const detail: AladinDetail = {
    productCode,
    dimensions,
    draft: {
      isbn13: isbn,
      isbn10: /^\d{9}[\dX]$/i.test(productCode) ? productCode : null,
      title:
        [compactText(titleNode), ...subtitles].filter(Boolean).join(" ") ||
        String(data.name ?? ""),
      publisher: compactText(publisherLink),
      authors,
      translators,
      price,
      pubDate:
        typeof work.datePublished === "string" ? work.datePublished : null,
      description: "",
      coverUrls: [coverUrl.toString()],
      thumbnail: coverUrl.toString(),
      salesPoint:
        pointText !== undefined ? Number(pointText.replaceAll(",", "")) : null,
      status: "종이책 확인",
      category: typeof data.genre === "string" ? data.genre : null,
      link: String(data.url ?? ""),
    },
  };
  const normalized = screen("aladin-web", detail.draft, {}, null, localToday());
  if (!normalized.ok)
    throw new Error(`알라딘 보강 제외: ${normalized.excluded.label}`);
  const missing = [
    ...missingBibliography(normalized.book),
    ...missingDimensions(dimensions, false),
  ];
  if (missing.length)
    throw new Error(`알라딘 필수 정보 미확보 (${isbn}): ${missing.join(", ")}`);
  return detail;
}

/** Extract only the book's full description, excluding publisher ads and short duplicates. */
export function parseDescription(
  html: string,
  kind: "PublisherDesc" | "Introduce",
): string {
  const root = documentOf(html);
  const node = elements(root, (e) => attr(e, "id") === `div_${kind}_All`)[0];
  if (!node) throw new Error(`${kind}: 소개 전문 영역 없음`);
  const text = textOf(node)
    .split("\n")
    .map((s) => s.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text) throw new Error(`${kind}: 소개 전문이 비어 있습니다`);
  return text;
}

export function yes24ProductIds(html: string): string[] {
  const root = documentOf(html);
  const list = elements(root, (e) => attr(e, "id") === "yesSchList")[0];
  if (!list) throw new Error("YES24 ISBN 검색 결과 영역 없음");
  return [
    ...new Set(
      elements(
        list,
        (e) => e.tagName === "li" && /^\d+$/.test(attr(e, "data-goods-no")),
      )
        .filter(
          (e) =>
            !/eBook|전자책/i.test(
              compactText(elements(e, (n) => hasClass(n, "gd_res"))[0]),
            ),
        )
        .map((e) => attr(e, "data-goods-no")),
    ),
  ].slice(0, 5);
}

export function parseYes24Depth(html: string, isbn: string): number {
  const root = documentOf(html);
  const section = elements(
    root,
    (e) => attr(e, "id") === "infoset_specific",
  )[0];
  if (!section) throw new Error("YES24 품목정보 영역 없음");
  const rows = new Map(
    elements(section, (e) => e.tagName === "tr").map((e) => [
      compactText(elements(e, (n) => n.tagName === "th")[0]),
      compactText(elements(e, (n) => n.tagName === "td")[0]),
    ]),
  );
  if (rows.get("ISBN13") !== isbn)
    throw new Error(`YES24 ISBN 불일치: ${isbn}`);
  const info = rows.get("쪽수, 무게, 크기") ?? "";
  const size = info.match(
    /\b(\d+(?:\.\d+)?)\s*[*×x]\s*(\d+(?:\.\d+)?)\s*[*×x]\s*(\d+(?:\.\d+)?)\s*mm/i,
  );
  const dimensions = toDimensions("yes24", { depth: size?.[3] });
  if (!dimensions?.depth)
    throw new Error(`YES24 두께 없음 또는 범위 밖: ${isbn}`);
  return dimensions.depth;
}

export type WebCandidate = Pick<
  Candidate,
  "source" | "isbn" | "publisher" | "raw"
>;

export function completeCandidate(
  detail: AladinDetail,
  description: string,
  depth: number,
  candidate: WebCandidate,
  today: string,
): Candidate {
  const result = screen(
    candidate.source,
    { ...detail.draft, description },
    candidate.raw,
    candidate.publisher || null,
    today,
  );
  if (!result.ok) throw new Error(`알라딘 보강 제외: ${result.excluded.label}`);
  const book = { ...result.book, dimensions: { ...detail.dimensions, depth } };
  assertComplete(book);
  return book;
}

function missingBibliography(book: Candidate): string[] {
  const missing: string[] = [];
  for (const key of ["title", "author", "publisher", "pubDate"] as const) {
    if (!book[key]?.trim()) missing.push(key);
  }
  if (!book.pubDate || !/^\d{4}-\d{2}-\d{2}$/.test(book.pubDate))
    missing.push("출간일");
  if (!(Number(book.discount) > 0)) missing.push("정가");
  if (
    book.salesPoint === null ||
    !Number.isFinite(book.salesPoint) ||
    book.salesPoint < 0
  )
    missing.push("판매지수");
  if (book.coverUrls.length === 0) missing.push("표지");
  return missing;
}

function missingDimensions(
  dimensions: BookDimensions | null,
  requireDepth: boolean,
): string[] {
  const missing: string[] = [];
  for (const key of [
    "width",
    "height",
    "depth",
    "pages",
    "weight",
    "binding",
  ] as const) {
    if ((requireDepth || key !== "depth") && !dimensions?.[key])
      missing.push(key);
  }
  return missing;
}

export function assertComplete(book: Candidate): void {
  const missing = [
    ...missingBibliography(book),
    ...missingDimensions(book.dimensions, true),
  ];
  if (!book.description?.trim()) missing.push("description");
  if (missing.length)
    throw new Error(`필수 정보 미확보 (${book.isbn}): ${missing.join(", ")}`);
}
