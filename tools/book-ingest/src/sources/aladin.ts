/**
 * 알라딘 공급처. **2026-10-30 알라딘 Open API 종료와 함께 지웁니다.**
 * 알라딘에 관한 코드는 전부 이 파일에 있습니다. 지울 때는 이 파일과
 * `__tests__/aladin.test.ts`를 지우고 `sources/index.ts`의 등록 한 줄을 빼면 됩니다
 * (README 「알라딘 제거」).
 */
import { cleanHtmlText } from "@bookjeok/core";

import { toDimensions } from "../dimensions";
import { fetchWithRetry } from "../http";
import {
  type Candidate,
  type Draft,
  type Exclusion,
  screen,
  toPubDate,
} from "../normalize";
import type {
  BookSource,
  KeywordQuery,
  SourceDefinition,
  SourcePage,
} from "./types";

/** ItemSearch·ItemLookUp 응답의 상품 한 건. 쓰는 필드만 적었습니다. */
export interface AladinItem {
  title: string;
  link: string;
  /** `이름 (지은이), 이름, 이름 (옮긴이)` 형태. 역할 괄호가 여러 이름에 걸립니다. */
  author: string;
  pubDate: string;
  description: string;
  /** ISBN-10. 국내 ISBN이 없는 상품은 `K142130036` 같은 알라딘 내부 코드가 옵니다. */
  isbn: string;
  /** 비어 있을 수 있습니다. 잡지는 977 ISSN이 들어옵니다. */
  isbn13: string;
  itemId: number;
  priceSales: number;
  priceStandard: number;
  mallType: string;
  /** 정상 판매는 빈 문자열. `예약판매`·`품절`·`절판` 등. */
  stockStatus: string;
  /** `Cover=Big`이면 `.../cover200/...` 경로. */
  cover: string;
  categoryName: string;
  publisher: string;
  salesPoint: number;
  adult: boolean;
  /** ItemLookUp에서만 옵니다. 알라딘 책소개 전문. */
  fullDescription?: string;
  /** ItemLookUp에서만 옵니다. 출판사 제공 책소개(HTML). */
  fullDescription2?: string;
  /** ItemLookUp에서만 값이 옵니다(검색 응답은 빈 객체). 판형은 `OptResult=packing`. */
  subInfo?: {
    itemPage?: number;
    packing?: {
      /** 양장본·반양장본·`미확인` 등. */
      styleDesc?: string;
      weight?: number;
      sizeDepth?: number;
      sizeHeight?: number;
      sizeWidth?: number;
    };
  };
}

interface AladinResponse {
  totalResults?: number;
  startIndex?: number;
  item?: AladinItem[];
  errorCode?: number;
  errorMessage?: string;
}

type Request = (url: string) => Promise<Response>;

const API = "https://www.aladin.co.kr/ttb/api";
const PAGE_SIZE = 50;

/**
 * 검색이 돌려주는 페이지 상한. 결과가 수천 건이어도 200건(50×4)까지만 주고,
 * 5페이지 이후를 요청하면 **에러 없이 1페이지를 다시** 돌려줍니다
 * (출판사 검색 2026-09-23, 자유 검색 2026-09-25 실측).
 */
export const ALADIN_MAX_PAGE = 4;

/** ItemLookUp이 "없는 상품"에 주는 오류 코드(2026-09-25 실측). 쿼터·키 오류와 구분합니다. */
const NOT_FOUND = 8;

/** 자유 검색 필드 → `QueryType`. ISBN은 키워드 검색이 정확히 한 권으로 찾습니다. */
const ALADIN_QUERY_TYPE: Record<KeywordQuery["field"], string> = {
  all: "Keyword",
  title: "Title",
  author: "Author",
  isbn: "Keyword",
};

const ALADIN_SORT: Record<KeywordQuery["sort"], string> = {
  accuracy: "Accuracy",
  latest: "PublishTime",
};

const ADULT: Exclusion = { reason: "adult", label: "성인 도서" };
const TRANSLATOR_ROLES = new Set(["옮긴이", "번역", "역자", "역"]);

/**
 * 알라딘 저자 문자열을 저자와 역자로 나눕니다. 역할 괄호는 바로 앞의 이름 묶음에 걸립니다.
 * `천쓰홍, 찬와이 (지은이), 김태성 (옮긴이)` → 저자 [천쓰홍, 찬와이], 역자 [김태성].
 * 옮긴이가 아닌 역할(엮은이·그림·감수 등)은 저자로 칩니다. 카카오 `authors[]`와 같은 기준입니다.
 */
export function splitAladinAuthor(raw: string): {
  authors: string[];
  translators: string[];
} {
  const authors: string[] = [];
  const translators: string[] = [];
  const text = cleanHtmlText(raw);
  const names = (chunk: string) =>
    chunk
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

  const group = /([^()]*)\(([^()]*)\)/g;
  let rest = 0;
  for (let m = group.exec(text); m; m = group.exec(text)) {
    const role = m[2].trim();
    (TRANSLATOR_ROLES.has(role) ? translators : authors).push(...names(m[1]));
    rest = group.lastIndex;
  }
  // 역할 표기가 없는 이름은 저자로 봅니다
  authors.push(...names(text.slice(rest)));
  return { authors, translators };
}

/**
 * 표지 후보를 고화질 순으로 돌려줍니다. 경로의 `cover200`을 `cover500`으로 바꾸면
 * 500px 원본이 나오고(Phase 0 수집과 같은 규칙), 없으면 원래 주소로 물러납니다.
 * 표지가 없는 상품은 `noimg` 자리표시 이미지를 주므로 후보에서 뺍니다.
 */
export function aladinCoverUrls(cover: string): string[] {
  if (!cover || /noimg/i.test(cover)) return [];
  const original = cover.replace(/^http:\/\//i, "https://");
  const large = original.replace(/\/cover(sum|\d+)?\//i, "/cover500/");
  return [...new Set([large, original])];
}

export function toAladinDraft(item: AladinItem): Draft {
  const { authors, translators } = splitAladinAuthor(item.author);
  const isbn13 = /^\d{13}$/.test(item.isbn13 ?? "") ? item.isbn13 : null;
  const isbn10 = /^\d{9}[\dX]$/i.test(item.isbn ?? "")
    ? item.isbn.toUpperCase()
    : null;
  const salesPoint = Number(item.salesPoint);
  return {
    isbn13,
    isbn10,
    title: cleanHtmlText(item.title),
    publisher: cleanHtmlText(item.publisher),
    authors,
    translators,
    price: Number(item.priceStandard),
    pubDate: toPubDate(item.pubDate),
    description: cleanHtmlText(item.description),
    coverUrls: aladinCoverUrls(item.cover),
    thumbnail: item.cover.replace(/^http:\/\//i, "https://"),
    salesPoint: Number.isFinite(salesPoint) ? salesPoint : null,
    status: item.stockStatus || "정상판매",
    category: item.categoryName || null,
    link: cleanHtmlText(item.link),
    rejection: item.adult ? ADULT : null,
  };
}

/** ItemLookUp 응답에서 판형을 꺼냅니다. 값이 없으면 null. */
export function aladinDimensions(item: AladinItem) {
  const packing = item.subInfo?.packing ?? {};
  return toDimensions("aladin", {
    width: packing.sizeWidth,
    height: packing.sizeHeight,
    depth: packing.sizeDepth,
    pages: item.subInfo?.itemPage,
    weight: packing.weight,
    binding: packing.styleDesc,
  });
}

class AladinError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(`알라딘 오류 ${code}: ${message}`);
  }
}

/** `Output=js` 응답은 끝에 세미콜론이 붙기도 합니다. 오류도 200으로 옵니다. */
async function call(request: Request, url: string): Promise<AladinResponse> {
  const res = await request(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`알라딘 요청 실패 (HTTP ${res.status})`);
  let data: AladinResponse;
  try {
    data = JSON.parse(text.trim().replace(/;\s*$/, ""));
  } catch {
    throw new Error(`알라딘 응답을 읽지 못했습니다: ${text.slice(0, 120)}`);
  }
  if (data.errorCode) {
    throw new AladinError(data.errorCode, data.errorMessage ?? "");
  }
  return data;
}

export function createAladinSource(
  ttbKey: string,
  request: Request = (url) => fetchWithRetry(url),
): BookSource<AladinItem> {
  const common = { ttbkey: ttbKey, Output: "js", Version: "20131101" };

  async function search(
    params: Record<string, string>,
    page: number,
  ): Promise<SourcePage<AladinItem>> {
    const query = new URLSearchParams({
      ...common,
      ...params,
      SearchTarget: "Book",
      MaxResults: String(PAGE_SIZE),
      Start: String(page),
      Cover: "Big",
    });
    const data = await call(request, `${API}/ItemSearch.aspx?${query}`);
    const totalCount = data.totalResults ?? 0;
    // 상한을 넘긴 요청은 1페이지를 다시 줍니다. 페이지 번호가 어긋나면 끝으로 봅니다.
    if (data.startIndex !== page) {
      return { items: [], totalCount, isEnd: true };
    }
    const items = data.item ?? [];
    return {
      items,
      totalCount,
      isEnd:
        items.length < PAGE_SIZE ||
        page * PAGE_SIZE >= totalCount ||
        page >= ALADIN_MAX_PAGE,
    };
  }

  async function lookUp(isbn: string, options: string) {
    const params = new URLSearchParams({
      ...common,
      ItemId: isbn,
      ItemIdType: "ISBN13",
      Cover: "Big",
      OptResult: options,
    });
    const data = await call(request, `${API}/ItemLookUp.aspx?${params}`);
    const item = data.item?.[0];
    if (!item || item.isbn13 !== isbn) {
      throw new Error(`알라딘 상세 조회 결과가 ${isbn}과 다릅니다`);
    }
    return item;
  }

  return {
    id: aladinSource.id,
    label: aladinSource.label,
    maxPages: ALADIN_MAX_PAGE,

    searchPublisher: (publisher, page) =>
      search(
        { Query: publisher, QueryType: "Publisher", Sort: "PublishTime" },
        page,
      ),

    searchKeyword: ({ text, field, sort }, page) =>
      search(
        {
          Query: text,
          QueryType: ALADIN_QUERY_TYPE[field],
          Sort: ALADIN_SORT[sort],
        },
        page,
      ),

    normalize: (item, publisher, today) =>
      screen(aladinSource.id, toAladinDraft(item), item, publisher, today),

    /**
     * 검색 응답의 소개는 요약이라 적재 직전에 ItemLookUp으로 전문을 받습니다.
     * 기존 `books`가 쓰던 우선순위(출판사 소개 → 알라딘 소개 → 요약)를 그대로 따릅니다.
     * 판매지수도 이 응답의 값으로 갱신하고, 같은 호출에서 판형(`packing`)도 받습니다.
     */
    async enrich(book: Candidate): Promise<Candidate> {
      const item = await lookUp(
        book.isbn,
        "fulldescription,fulldescription2,packing",
      );
      const salesPoint = Number(item.salesPoint);
      return {
        ...book,
        description:
          cleanHtmlText(
            item.fullDescription2 || item.fullDescription || item.description,
          ) || book.description,
        salesPoint: Number.isFinite(salesPoint) ? salesPoint : book.salesPoint,
        dimensions: aladinDimensions(item),
        raw: item,
      };
    },

    /** 카카오처럼 판형을 주지 않는 공급처의 책에 빌려 줍니다. 알라딘에 없는 책이면 null. */
    async lookupDimensions(isbn) {
      try {
        return aladinDimensions(await lookUp(isbn, "packing"));
      } catch (error) {
        if (error instanceof AladinError && error.code === NOT_FOUND) {
          return null;
        }
        throw error;
      }
    },
  };
}

export const aladinSource: SourceDefinition = {
  id: "aladin",
  label: "알라딘",
  envKey: "ALADIN_TTB_KEY",
  maxPages: ALADIN_MAX_PAGE,
  imageOrigins: ["https://image.aladin.co.kr"],
  enrichNote:
    "적재할 때 한 권씩 상세 조회해 긴 소개(출판사 제공)·판매지수·판형을 다시 받습니다. 여기 보이는 소개는 검색 응답의 요약입니다.",
  create: (apiKey) => createAladinSource(apiKey),
};
