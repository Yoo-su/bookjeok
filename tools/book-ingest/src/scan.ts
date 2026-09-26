import type { Candidate, Excluded } from "./normalize";
import type {
  BookSource,
  KeywordQuery,
  ListCatalog,
  ListQuery,
  ListWeek,
  SearchField,
  SearchSort,
  SourcePage,
} from "./sources";

export interface ScanDeps {
  source: BookSource;
  /** 주어진 ISBN 중 `books`에 이미 있는 것. ISBN-10과 13을 섞어 넘깁니다. */
  findExisting(isbns: string[]): Promise<Set<string>>;
}

/** 무엇을 훑을지. 출판사 신간, 자유 검색, 또는 베스트셀러 같은 목록 여러 개입니다. */
export type ScanTarget =
  | { kind: "publisher"; publisher: string }
  | { kind: "keyword"; query: KeywordQuery }
  | {
      kind: "lists";
      label: string;
      lists: { label: string; query: ListQuery }[];
    };

export interface ScanOptions {
  maxPages?: number;
  today: string;
  onPage?: (progress: PageProgress) => void;
}

export interface PageProgress {
  /** 화면·로그에 쓰는 대상 이름. 출판사 이름 또는 `검색 "…"`. */
  label: string;
  page: number;
  totalCount: number;
  fresh: number;
  known: number;
  excluded: number;
}

export interface ScanResult {
  source: string;
  target: ScanTarget;
  label: string;
  pages: number;
  totalCount: number;
  /** DB에 없는 적재 후보. 공급처가 준 순서 그대로입니다. */
  fresh: Candidate[];
  /** DB에 이미 있는 책(ISBN-10으로만 있는 것 포함). */
  known: Candidate[];
  excluded: Excluded[];
  /** 훑은 목록 수. 목록 대상만 있습니다. */
  lists?: number;
  /** 끝까지 훑지 못한 이유(쿼터 소진 등). 그때까지 받은 결과는 남깁니다. */
  incomplete?: string;
}

export const SEARCH_FIELDS: SearchField[] = ["all", "title", "author", "isbn"];
export const SEARCH_SORTS: SearchSort[] = ["accuracy", "latest"];

const MAX_QUERY = 100;

/**
 * 자유 검색어를 정리합니다. 하이픈·공백을 뺀 값이 ISBN(10·13자리)이면 필드와
 * 관계없이 ISBN 검색으로 바꿉니다. 비었거나 너무 길면 null.
 */
export function parseKeywordQuery(
  text: string,
  field: SearchField = "all",
  sort: SearchSort = "accuracy",
): KeywordQuery | null {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length > MAX_QUERY) return null;
  const compact = trimmed.replace(/[-\s]/g, "");
  if (/^(\d{9}[\dX]|\d{13})$/i.test(compact)) {
    return { text: compact.toUpperCase(), field: "isbn", sort };
  }
  return { text: trimmed, field: field === "isbn" ? "all" : field, sort };
}

export function targetLabel(target: ScanTarget): string {
  if (target.kind === "publisher") return target.publisher;
  if (target.kind === "keyword") return `검색 "${target.query.text}"`;
  return target.label;
}

export const LIST_INTERVALS = ["month", "week"] as const;
export type ListInterval = (typeof LIST_INTERVALS)[number];

/**
 * 오늘부터 `months`개월 전까지 훑을 주차. 이번 주(null)가 맨 앞이고, 지난달부터 거꾸로
 * 한 달에 1주차 하나(`month`) 또는 1~4주차(`week`)입니다. 이번 달의 지난 주차는
 * 넣지 않습니다(알라딘 주차 경계를 알 수 없고, 이번 주 목록과 대부분 겹침).
 */
export function listWeeks(
  months: number,
  interval: ListInterval,
  today: string,
  since = 2000,
): (ListWeek | null)[] {
  const [year, month] = today.split("-").map(Number);
  const weeks: (ListWeek | null)[] = [null];
  for (let back = 1; back < months; back += 1) {
    const index = year * 12 + (month - 1) - back;
    const y = Math.floor(index / 12);
    if (y < since) break;
    const m = (index % 12) + 1;
    for (const week of interval === "week" ? [1, 2, 3, 4] : [1]) {
      weeks.push({ year: y, month: m, week });
    }
  }
  return weeks;
}

export interface ListRequest {
  type: string;
  categoryIds: string[];
  /** 오늘부터 몇 개월 전까지. 1이면 이번 주만. */
  months: number;
  interval: ListInterval;
}

/** 목록 요청을 스캔 대상 하나로 펼칩니다. 모르는 종류·분야면 오류 문구를 돌려줍니다. */
export function buildListTarget(
  catalog: ListCatalog,
  request: ListRequest,
  today: string,
): ScanTarget | string {
  const type = catalog.types.find((t) => t.id === request.type);
  if (!type) return "목록 종류가 잘못됐습니다";
  const ids = [...new Set(request.categoryIds)];
  const categories = ids.map((id) =>
    catalog.categories.find((c) => c.id === id),
  );
  if (ids.length === 0 || categories.some((c) => !c)) {
    return "분야를 1개 이상 고르세요";
  }
  const weeks = type.dated
    ? listWeeks(request.months, request.interval, today, catalog.since)
    : [null];
  const period =
    weeks.length === 1
      ? "이번 주"
      : `최근 ${request.months}개월·${request.interval === "week" ? "매주" : "월 1회"}`;
  const names = categories.map((c) => c!.label);
  return {
    kind: "lists",
    label: `${type.label} · ${names.length > 3 ? `${names.slice(0, 3).join("·")} 외 ${names.length - 3}개` : names.join("·")} · ${type.dated ? period : "현재"}`,
    lists: weeks.flatMap((week) =>
      categories.map((c) => ({
        label: `${type.label} ${c!.label} ${week ? `${week.year}.${week.month} ${week.week}주` : "이번 주"}`,
        query: { type: type.id, categoryId: c!.id, week },
      })),
    ),
  };
}

/**
 * 한 대상의 목록을 끝까지(최대 `maxPages`) 훑어 DB에 없는 책을 고릅니다.
 *
 * 최근 페이지가 전부 이미 가진 책이어도 멈추지 않습니다. 기존 카탈로그는 크롤러
 * 유입으로 채워져 몇 달 전 책도 군데군데 빠져 있습니다(2026-09-23 실측).
 * 페이지 수는 공급처 상한(`source.maxPages`, 목록은 `catalog.maxPages`)을 넘지 않습니다.
 * 넘기면 앞 페이지를 반복해 주는 공급처가 있어서입니다. 자유 검색·목록은 출판사를
 * 대조하지 않습니다. 목록 여러 개는 한 결과로 합치고, 목록끼리 겹치는 책은 한 번만 셉니다.
 */
export async function scanTarget(
  target: ScanTarget,
  { source, findExisting }: ScanDeps,
  { maxPages, today, onPage }: ScanOptions,
): Promise<ScanResult> {
  const label = targetLabel(target);
  const result: ScanResult = {
    source: source.id,
    target,
    label,
    pages: 0,
    totalCount: 0,
    fresh: [],
    known: [],
    excluded: [],
  };
  const seen = new Set<string>();

  const scanFeed = async (
    feedLabel: string,
    fetchPage: (page: number) => Promise<SourcePage<unknown>>,
    expectedPublisher: string | null,
    cap: number,
  ) => {
    const lastPage = Math.min(Math.max(1, maxPages ?? cap), cap);
    for (let page = 1; page <= lastPage; page += 1) {
      const { items, totalCount, isEnd } = await fetchPage(page);
      result.pages += 1;
      if (page === 1) result.totalCount += totalCount;

      const candidates: Candidate[] = [];
      let excludedOnPage = 0;
      for (const item of items) {
        const normalized = source.normalize(item, expectedPublisher, today);
        if (!normalized.ok) {
          result.excluded.push(normalized.excluded);
          excludedOnPage += 1;
          continue;
        }
        // 같은 책이 여러 페이지·목록에 걸쳐 다시 나오는 경우를 한 번만 셉니다.
        if (seen.has(normalized.book.isbn)) continue;
        seen.add(normalized.book.isbn);
        candidates.push(normalized.book);
      }

      const existing = candidates.length
        ? await findExisting(
            candidates.flatMap((c) =>
              c.isbn10 ? [c.isbn, c.isbn10] : [c.isbn],
            ),
          )
        : new Set<string>();
      let freshOnPage = 0;
      for (const candidate of candidates) {
        const isKnown =
          existing.has(candidate.isbn) ||
          (candidate.isbn10 !== null && existing.has(candidate.isbn10));
        if (isKnown) {
          result.known.push(candidate);
        } else {
          result.fresh.push(candidate);
          freshOnPage += 1;
        }
      }

      onPage?.({
        label: feedLabel,
        page,
        totalCount,
        fresh: freshOnPage,
        known: candidates.length - freshOnPage,
        excluded: excludedOnPage,
      });

      if (isEnd || items.length === 0) break;
    }
  };

  if (target.kind === "publisher") {
    await scanFeed(
      label,
      (page) => source.searchPublisher(target.publisher, page),
      target.publisher,
      source.maxPages,
    );
  } else if (target.kind === "keyword") {
    await scanFeed(
      label,
      (page) => source.searchKeyword(target.query, page),
      null,
      source.maxPages,
    );
  } else {
    const lists = source.lists;
    if (!lists) throw new Error(`${source.label}은(는) 목록을 주지 않습니다`);
    result.lists = 0;
    for (const list of target.lists) {
      // 목록이 수백 개라 쿼터가 도중에 끊길 수 있습니다. 받은 데까지는 남깁니다.
      try {
        await scanFeed(
          list.label,
          (page) => lists.search(list.query, page),
          null,
          lists.catalog.maxPages,
        );
      } catch (error) {
        result.incomplete = `${list.label}에서 멈춤 — ${error instanceof Error ? error.message : String(error)}`;
        break;
      }
      result.lists += 1;
    }
  }

  return result;
}
