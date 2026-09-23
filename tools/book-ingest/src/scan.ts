import { KAKAO_MAX_PAGE, type KakaoSearch } from "./kakao";
import { type Candidate, type Excluded, normalizeBook } from "./normalize";

export interface ScanDeps {
  search: KakaoSearch;
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
  publisher: string;
  pages: number;
  totalCount: number;
  /** DB에 없는 적재 후보. 카카오 최신순 그대로입니다. */
  fresh: Candidate[];
  /** DB에 이미 있는 책(ISBN-10으로만 있는 것 포함). */
  known: Candidate[];
  excluded: Excluded[];
}

/**
 * 한 출판사의 최신순 목록을 `is_end`까지(최대 `maxPages`) 훑어 DB에 없는 책을 고릅니다.
 *
 * 최근 페이지가 전부 이미 가진 책이어도 멈추지 않습니다. 기존 카탈로그는 크롤러
 * 유입으로 채워져 몇 달 전 책도 군데군데 빠져 있습니다(2026-09-23 실측). 최대 20페이지라
 * 끝까지 봐도 카카오 호출은 출판사당 20회입니다.
 */
export async function scanPublisher(
  publisher: string,
  deps: ScanDeps,
  { maxPages = KAKAO_MAX_PAGE, today, onPage }: ScanOptions,
): Promise<PublisherScan> {
  const result: PublisherScan = {
    publisher,
    pages: 0,
    totalCount: 0,
    fresh: [],
    known: [],
    excluded: [],
  };
  const seen = new Set<string>();
  const lastPage = Math.min(Math.max(1, maxPages), KAKAO_MAX_PAGE);

  for (let page = 1; page <= lastPage; page += 1) {
    const { documents, meta } = await deps.search(publisher, page);
    result.pages = page;
    result.totalCount = meta.total_count;

    const candidates: Candidate[] = [];
    let excludedOnPage = 0;
    for (const doc of documents) {
      const normalized = normalizeBook(doc, publisher, today);
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
      ? await deps.findExisting(
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
      totalCount: meta.total_count,
      fresh: freshOnPage,
      known: candidates.length - freshOnPage,
      excluded: excludedOnPage,
    });

    if (meta.is_end || documents.length === 0) break;
  }

  return result;
}
