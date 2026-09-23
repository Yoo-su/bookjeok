import { cleanHtmlText } from "@bookjeok/core";

/** 적재하지 않는 이유. 공급처 고유 사유는 각 공급처 파일에서 같은 모양으로 만듭니다. */
export interface Exclusion {
  reason: string;
  label: string;
}

/**
 * 공급처와 무관하게 적용하는 제외 규칙. 결정 근거는 `docs/book-data-migration-plan.md` 6-d.
 * - periodical: 977로 시작하는 ISSN 바코드. 잡지는 **호가 달라도 같은 값**을 써서 PK가 충돌합니다.
 * - non_isbn: 978·979가 아닌 13자리. `209…` 같은 유통사 내부 바코드로, 달력·굿즈·사은품입니다.
 * - no_price: 정가 0 이하. 코멘터리북 같은 비도서가 여기 걸립니다.
 * - set: 세트 상품. 출판사 검색 상위를 점유하던 전례가 있습니다(8-d).
 * - no_cover: 쓸 만한 원본 표지 주소가 없는 경우. 썸네일로 대신하지 않습니다.
 */
export const COMMON_EXCLUSIONS = {
  publisher_mismatch: { reason: "publisher_mismatch", label: "다른 출판사" },
  no_title: { reason: "no_title", label: "제목 없음" },
  no_isbn13: { reason: "no_isbn13", label: "ISBN-13 없음" },
  periodical: { reason: "periodical", label: "잡지(ISSN)" },
  non_isbn: { reason: "non_isbn", label: "ISBN 아닌 바코드" },
  set: { reason: "set", label: "세트" },
  no_price: { reason: "no_price", label: "정가 0 이하" },
  no_cover: { reason: "no_cover", label: "원본 표지 없음" },
} satisfies Record<string, Exclusion>;

/** 공급처 응답을 공통 형태로 옮긴 것. 제외 규칙을 거치기 전 단계입니다. */
export interface Draft {
  isbn13: string | null;
  isbn10: string | null;
  title: string;
  publisher: string;
  authors: string[];
  translators: string[];
  price: number;
  pubDate: string | null;
  description: string;
  /** 표지 원본 후보. 앞에서부터 받아 보고 실패하면 다음 것을 씁니다. */
  coverUrls: string[];
  /** 화면 미리보기용. DB에는 들어가지 않습니다. */
  thumbnail: string;
  salesPoint: number | null;
  status: string;
  category: string | null;
  link: string;
  /** 공급처 고유 규칙에 걸렸으면 그 사유. 공통 규칙을 모두 통과한 뒤에 봅니다. */
  rejection?: Exclusion | null;
}

/** `books`에 넣을 형태로 정제한 후보. `raw`는 실행 기록에 남길 공급처 원본입니다. */
export interface Candidate {
  source: string;
  isbn: string;
  isbn10: string | null;
  title: string;
  author: string;
  translators: string[];
  publisher: string;
  /** 정가. `books.discount`는 2026-09-09부터 정가를 문자열로 담습니다(7-f). */
  discount: string;
  pubDate: string | null;
  description: string;
  coverUrls: string[];
  thumbnail: string;
  /** 공급처가 준 판매지수. 없으면 NULL로 넣습니다(0은 "판매 실적 없음"이라 다른 뜻). */
  salesPoint: number | null;
  status: string;
  category: string | null;
  link: string;
  /** 출간일이 오늘 이후인 예약판매 도서. 적재 대상이며 표시용입니다. */
  preorder: boolean;
  raw: unknown;
}

export interface Excluded extends Exclusion {
  isbn: string | null;
  title: string;
  publisher: string;
  raw: unknown;
}

export type Normalized =
  | { ok: true; book: Candidate }
  | { ok: false; excluded: Excluded };

/**
 * 저자만 이름 그대로 `", "`로 잇습니다. 역자와 역할 표기는 넣지 않습니다.
 * 기존 `books`의 96%가 이 형식이고, 원본은 실행 기록(JSONL)에 남깁니다.
 */
export function formatAuthor(authors: string[]): string {
  const names = authors.map((name) => cleanHtmlText(name)).filter(Boolean);
  return [...new Set(names)].join(", ");
}

/** 날짜 부분만 씁니다. `Date`로 파싱하면 KST에서 하루가 밀립니다. */
export function toPubDate(raw: string | null | undefined): string | null {
  const day = (raw ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

const SET_TITLE = /세트|\bset\b/i;

function comparablePublisher(name: string): string {
  return cleanHtmlText(name).replace(/\s+/g, " ").trim();
}

/** 공통 제외 규칙을 적용해 후보로 만듭니다. 규칙 순서가 곧 보고되는 사유의 우선순위입니다. */
export function screen(
  source: string,
  draft: Draft,
  raw: unknown,
  expectedPublisher: string,
  today: string,
): Normalized {
  const exclude = (exclusion: Exclusion): Normalized => ({
    ok: false,
    excluded: {
      ...exclusion,
      isbn: draft.isbn13 ?? draft.isbn10,
      title: draft.title,
      publisher: draft.publisher,
      raw,
    },
  });
  const rules = COMMON_EXCLUSIONS;

  if (
    comparablePublisher(draft.publisher) !==
    comparablePublisher(expectedPublisher)
  ) {
    return exclude(rules.publisher_mismatch);
  }
  if (!draft.title) return exclude(rules.no_title);
  if (!draft.isbn13) return exclude(rules.no_isbn13);
  if (draft.isbn13.startsWith("977")) return exclude(rules.periodical);
  if (!/^97[89]/.test(draft.isbn13)) return exclude(rules.non_isbn);
  if (SET_TITLE.test(draft.title)) return exclude(rules.set);
  if (!(draft.price > 0)) return exclude(rules.no_price);
  if (draft.rejection) return exclude(draft.rejection);
  if (draft.coverUrls.length === 0) return exclude(rules.no_cover);

  return {
    ok: true,
    book: {
      source,
      isbn: draft.isbn13,
      isbn10: draft.isbn10,
      title: draft.title,
      author: formatAuthor(draft.authors),
      translators: draft.translators,
      publisher: draft.publisher,
      discount: String(draft.price),
      pubDate: draft.pubDate,
      description: draft.description,
      coverUrls: draft.coverUrls,
      thumbnail: draft.thumbnail,
      salesPoint: draft.salesPoint,
      status: draft.status,
      category: draft.category,
      link: draft.link,
      preorder: draft.pubDate !== null && draft.pubDate > today,
      raw,
    },
  };
}

/** 로컬 달력 기준 오늘 날짜(`YYYY-MM-DD`). */
export function localToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
