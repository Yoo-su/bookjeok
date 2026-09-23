import { cleanHtmlText } from "@bookjeok/core";

import type { KakaoBook } from "./kakao";

/**
 * 적재하지 않는 이유. 결정 근거는 `docs/book-data-migration-plan.md` 6-d.
 * - periodical: 977로 시작하는 ISSN 바코드. 잡지는 **호가 달라도 같은 값**을 써서 PK가 충돌합니다.
 * - no_price / no_status: 정가 0 이하·판매 상태 없음. 코멘터리북·굿즈 KIT 같은 비도서가 여기 걸립니다.
 * - set: 세트 상품. 출판사 검색 상위를 점유하던 전례가 있습니다(8-d).
 * - no_cover: 원본 표지 URL(`fname`)이 없는 경우. 120px 썸네일로 대신하지 않습니다.
 */
export type ExcludeReason =
  | "publisher_mismatch"
  | "no_title"
  | "no_isbn13"
  | "periodical"
  | "set"
  | "no_price"
  | "no_status"
  | "no_cover";

export const EXCLUDE_REASON_LABEL: Record<ExcludeReason, string> = {
  publisher_mismatch: "다른 출판사",
  no_title: "제목 없음",
  no_isbn13: "ISBN-13 없음",
  periodical: "잡지(ISSN)",
  set: "세트",
  no_price: "정가 0 이하",
  no_status: "판매 상태 없음",
  no_cover: "원본 표지 없음",
};

/** `books`에 넣을 형태로 정제한 후보. `kakao`는 산출물 보존용 원본입니다. */
export interface Candidate {
  isbn: string;
  isbn10: string | null;
  title: string;
  author: string;
  publisher: string;
  /** 정가. `books.discount`는 2026-09-09부터 정가를 문자열로 담습니다(7-f). */
  discount: string;
  pubDate: string | null;
  description: string;
  coverSourceUrl: string;
  /** 출간일이 오늘 이후인 예약판매 도서. 적재 대상이며 표시용입니다. */
  preorder: boolean;
  kakao: KakaoBook;
}

export interface Excluded {
  reason: ExcludeReason;
  isbn: string | null;
  title: string;
  kakao: KakaoBook;
}

export type Normalized =
  | { ok: true; book: Candidate }
  | { ok: false; excluded: Excluded };

export function parseIsbn(raw: string): {
  isbn13: string | null;
  isbn10: string | null;
} {
  const parts = raw.split(/\s+/).filter(Boolean);
  return {
    isbn13: parts.find((p) => /^\d{13}$/.test(p)) ?? null,
    isbn10: parts.find((p) => /^\d{9}[\dX]$/i.test(p))?.toUpperCase() ?? null,
  };
}

/**
 * 썸네일 URL의 `fname`에 든 원본 표지 주소를 꺼냅니다.
 * 원본은 `t1.daumcdn.net/lbook/image/{id}`이고 폭 392~458px입니다. 썸네일 크기
 * 지정자를 키워도 이보다 커지지 않으므로 이것이 얻을 수 있는 최대 화질입니다.
 */
export function originalCoverUrl(thumbnail: string): string | null {
  if (!thumbnail) return null;
  try {
    const fname = new URL(thumbnail).searchParams.get("fname");
    if (!fname) return null;
    const source = new URL(fname);
    return source.protocol === "http:" || source.protocol === "https:"
      ? source.toString()
      : null;
  } catch {
    return null;
  }
}

/**
 * 저자만 이름 그대로 `", "`로 잇습니다. 역자와 역할 표기는 넣지 않습니다.
 * 기존 `books`의 96%가 이 형식이고, 원본 배열은 실행 기록(JSONL)에 남깁니다.
 */
export function formatAuthor(authors: string[]): string {
  return authors
    .map((name) => cleanHtmlText(name))
    .filter(Boolean)
    .join(", ");
}

/** `datetime`의 날짜 부분만 씁니다. `Date`로 파싱하면 KST에서 하루가 밀립니다. */
export function toPubDate(datetime: string): string | null {
  const day = datetime.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

const SET_TITLE = /세트|\bset\b/i;

function normalizePublisher(name: string): string {
  return cleanHtmlText(name).replace(/\s+/g, " ").trim();
}

export function normalizeBook(
  kakao: KakaoBook,
  expectedPublisher: string,
  today: string,
): Normalized {
  const title = cleanHtmlText(kakao.title);
  const { isbn13, isbn10 } = parseIsbn(kakao.isbn);
  const exclude = (reason: ExcludeReason): Normalized => ({
    ok: false,
    excluded: { reason, isbn: isbn13 ?? isbn10, title, kakao },
  });

  if (
    normalizePublisher(kakao.publisher) !==
    normalizePublisher(expectedPublisher)
  ) {
    return exclude("publisher_mismatch");
  }
  if (!title) return exclude("no_title");
  if (!isbn13) return exclude("no_isbn13");
  if (isbn13.startsWith("977")) return exclude("periodical");
  if (SET_TITLE.test(title)) return exclude("set");
  if (!(kakao.price > 0)) return exclude("no_price");
  if (!kakao.status.trim()) return exclude("no_status");
  const coverSourceUrl = originalCoverUrl(kakao.thumbnail);
  if (!coverSourceUrl) return exclude("no_cover");

  const pubDate = toPubDate(kakao.datetime);
  return {
    ok: true,
    book: {
      isbn: isbn13,
      isbn10,
      title,
      author: formatAuthor(kakao.authors),
      publisher: cleanHtmlText(kakao.publisher),
      discount: String(kakao.price),
      pubDate,
      description: cleanHtmlText(kakao.contents),
      coverSourceUrl,
      preorder: pubDate !== null && pubDate > today,
      kakao,
    },
  };
}

/** 로컬 달력 기준 오늘 날짜(`YYYY-MM-DD`). */
export function localToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
