import type { Candidate, Excluded } from "./normalize";
import type { BookSource } from "./sources";

export interface ScanDeps {
  source: BookSource;
  /** 주어진 ISBN 중 `books`에 이미 있는 것. ISBN-10과 13을 섞어 넘깁니다. */
  findExisting(isbns: string[]): Promise<Set<string>>;
}

export interface ScanOptions {
  maxPages?: number;
  today: string;
  onPage?: (progress: PageProgress) => void;
}

export interface PageProgress {
  publisher: string;
  page: number;
  totalCount: number;
  fresh: number;
  known: number;
  excluded: number;
}

export interface PublisherScan {
  source: string;
  publisher: string;
  pages: number;
  totalCount: number;
  /** DB에 없는 적재 후보. 공급처의 최신순 그대로입니다. */
  fresh: Candidate[];
  /** DB에 이미 있는 책(ISBN-10으로만 있는 것 포함). */
  known: Candidate[];
  excluded: Excluded[];
}

/**
 * 한 출판사의 최신순 목록을 끝까지(최대 `maxPages`) 훑어 DB에 없는 책을 고릅니다.
 *
 * 최근 페이지가 전부 이미 가진 책이어도 멈추지 않습니다. 기존 카탈로그는 크롤러
 * 유입으로 채워져 몇 달 전 책도 군데군데 빠져 있습니다(2026-09-23 실측).
 * 페이지 수는 공급처 상한(`source.maxPages`)을 넘지 않습니다. 넘기면 앞 페이지를
 * 반복해 주는 공급처가 있어서입니다.
 */
export async function scanPublisher(
  publisher: string,
  { source, findExisting }: ScanDeps,
  { maxPages = source.maxPages, today, onPage }: ScanOptions,
): Promise<PublisherScan> {
  const result: PublisherScan = {
    source: source.id,
    publisher,
    pages: 0,
    totalCount: 0,
    fresh: [],
    known: [],
    excluded: [],
  };
  const seen = new Set<string>();
  const lastPage = Math.min(Math.max(1, maxPages), source.maxPages);

  for (let page = 1; page <= lastPage; page += 1) {
    const { items, totalCount, isEnd } = await source.search(publisher, page);
    result.pages = page;
    result.totalCount = totalCount;

    const candidates: Candidate[] = [];
    let excludedOnPage = 0;
    for (const item of items) {
      const normalized = source.normalize(item, publisher, today);
      if (!normalized.ok) {
        result.excluded.push(normalized.excluded);
        excludedOnPage += 1;
        continue;
      }
      // 같은 책이 여러 페이지에 걸쳐 다시 나오는 경우를 한 번만 셉니다.
      if (seen.has(normalized.book.isbn)) continue;
      seen.add(normalized.book.isbn);
      candidates.push(normalized.book);
    }

    const existing = candidates.length
      ? await findExisting(
          candidates.flatMap((c) => (c.isbn10 ? [c.isbn, c.isbn10] : [c.isbn])),
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
      publisher,
      page,
      totalCount,
      fresh: freshOnPage,
      known: candidates.length - freshOnPage,
      excluded: excludedOnPage,
    });

    if (isEnd || items.length === 0) break;
  }

  return result;
}
