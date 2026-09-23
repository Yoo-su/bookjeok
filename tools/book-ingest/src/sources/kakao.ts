import { cleanHtmlText } from "@bookjeok/core";

import { fetchWithRetry } from "../http";
import { type Draft, type Exclusion, screen, toPubDate } from "../normalize";
import type { BookSource, SourceDefinition } from "./types";

/** 카카오 책 검색 응답의 문서 한 건. 필드는 카카오가 주는 그대로입니다. */
export interface KakaoBook {
  authors: string[];
  contents: string;
  /** ISO 8601. 예: `2026-09-18T00:00:00.000+09:00`. 없으면 빈 문자열. */
  datetime: string;
  /** ISBN10·13을 공백으로 붙인 문자열. 한쪽이 빈 경우가 있습니다(`" 9788937449475"`). */
  isbn: string;
  /** 정가. 비도서는 0이 옵니다. */
  price: number;
  publisher: string;
  /** 판매가. **전자책과 비매품은 -1**입니다. */
  sale_price: number;
  /** `정상판매`·`예약판매`·`주문판매`·`""` 등. */
  status: string;
  /** `search1.kakaocdn.net/thumb/R120x174.q85/?fname=<원본 URL>` 형태. */
  thumbnail: string;
  title: string;
  translators: string[];
  url: string;
}

export interface KakaoPage {
  documents: KakaoBook[];
  meta: { is_end: boolean; pageable_count: number; total_count: number };
}

const PAGE_SIZE = 50;

/**
 * 출판사 검색이 돌려주는 페이지 상한. `pageable_count`가 최대 1,000(50×20)이고,
 * 21페이지 이후를 요청하면 **에러 없이 20페이지를 반복해** 돌려줍니다(2026-09-23 실측).
 */
export const KAKAO_MAX_PAGE = 20;

/** 판매 상태가 빈 문서. 굿즈 KIT 같은 비도서가 여기 걸립니다. */
const NO_STATUS: Exclusion = { reason: "no_status", label: "판매 상태 없음" };

/**
 * 판매가 -1인 문서. 카카오는 전자책을 종이책과 섞어 주며 이것이 유일한 구분 신호입니다.
 * 주요 6개 출판사 최신 293건 중 100건(34%)이 여기 해당했고, 알라딘으로 대조하니
 * 94건이 전자책, 나머지는 비매품·굿즈였습니다. 종이책이 섞인 경우는 없었습니다(2026-09-23).
 * 전자책은 종이책 출간 1~2달 뒤에 별도 ISBN으로 나와, 거르지 않으면 이미 가진 책이
 * 신간으로 보입니다.
 */
const EBOOK: Exclusion = { reason: "ebook", label: "전자책·비매품" };

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

export function toKakaoDraft(doc: KakaoBook): Draft {
  const { isbn13, isbn10 } = parseIsbn(doc.isbn);
  const cover = originalCoverUrl(doc.thumbnail);
  return {
    isbn13,
    isbn10,
    title: cleanHtmlText(doc.title),
    publisher: cleanHtmlText(doc.publisher),
    authors: doc.authors,
    translators: doc.translators,
    price: doc.price,
    pubDate: toPubDate(doc.datetime),
    description: cleanHtmlText(doc.contents),
    coverUrls: cover ? [cover] : [],
    thumbnail: doc.thumbnail,
    salesPoint: null,
    status: doc.status,
    category: null,
    link: doc.url,
    rejection:
      doc.sale_price === -1 ? EBOOK : doc.status.trim() ? null : NO_STATUS,
  };
}

export function createKakaoSource(apiKey: string): BookSource<KakaoBook> {
  return {
    id: kakaoSource.id,
    label: kakaoSource.label,
    maxPages: KAKAO_MAX_PAGE,

    async search(publisher, page) {
      const params = new URLSearchParams({
        query: publisher,
        target: "publisher",
        sort: "latest",
        size: String(PAGE_SIZE),
        page: String(page),
      });
      const res = await fetchWithRetry(
        `https://dapi.kakao.com/v3/search/book?${params}`,
        { headers: { Authorization: `KakaoAK ${apiKey}` } },
      );
      if (!res.ok) {
        throw new Error(
          `카카오 검색 실패 (HTTP ${res.status}): ${await res.text()}`,
        );
      }
      const { documents, meta } = (await res.json()) as KakaoPage;
      return {
        items: documents,
        totalCount: meta.total_count,
        isEnd: meta.is_end,
      };
    },

    normalize: (doc, publisher, today) =>
      screen(kakaoSource.id, toKakaoDraft(doc), doc, publisher, today),
  };
}

export const kakaoSource: SourceDefinition = {
  id: "kakao",
  label: "카카오",
  envKey: "KAKAO_REST_API_KEY",
  maxPages: KAKAO_MAX_PAGE,
  imageOrigins: ["https://search1.kakaocdn.net"],
  create: createKakaoSource,
};
