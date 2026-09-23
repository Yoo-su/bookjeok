import { ingestBook, type IngestDeps, type IngestOutcome } from "./ingest";
import type { Journal } from "./journal";
import type { Candidate, ExcludeReason } from "./normalize";
import {
  type PageProgress,
  type PublisherScan,
  type ScanDeps,
  scanPublisher,
} from "./scan";

export interface ScanSummary {
  publisher: string;
  pages: number;
  totalCount: number;
  fresh: number;
  known: number;
  excluded: number;
  excludedByReason: Partial<Record<ExcludeReason, number>>;
  /** 저자 배열이 비어 빈 문자열로 들어갈 후보 수. */
  emptyAuthor: number;
  preorder: number;
}

export function summarizeScan(scan: PublisherScan): ScanSummary {
  const excludedByReason: Partial<Record<ExcludeReason, number>> = {};
  for (const { reason } of scan.excluded) {
    excludedByReason[reason] = (excludedByReason[reason] ?? 0) + 1;
  }
  return {
    publisher: scan.publisher,
    pages: scan.pages,
    totalCount: scan.totalCount,
    fresh: scan.fresh.length,
    known: scan.known.length,
    excluded: scan.excluded.length,
    excludedByReason,
    emptyAuthor: scan.fresh.filter((b) => !b.author).length,
    preorder: scan.fresh.filter((b) => b.preorder).length,
  };
}

export async function runScan(
  publishers: string[],
  deps: ScanDeps,
  journal: Journal,
  options: {
    maxPages?: number;
    today: string;
    onPage?: (p: PageProgress) => void;
  },
): Promise<PublisherScan[]> {
  const scans: PublisherScan[] = [];
  for (const publisher of publishers) {
    const scan = await scanPublisher(publisher, deps, options);
    for (const book of scan.fresh) {
      journal.write({
        type: "scan",
        publisher,
        result: "fresh",
        isbn: book.isbn,
        kakao: book.kakao,
      });
    }
    for (const book of scan.known) {
      journal.write({
        type: "scan",
        publisher,
        result: "known",
        isbn: book.isbn,
        kakao: book.kakao,
      });
    }
    for (const item of scan.excluded) {
      journal.write({
        type: "scan",
        publisher,
        result: "excluded",
        reason: item.reason,
        isbn: item.isbn,
        kakao: item.kakao,
      });
    }
    journal.write({ type: "scan_summary", ...summarizeScan(scan) });
    scans.push(scan);
  }
  return scans;
}

export interface ApplySummary {
  total: number;
  inserted: number;
  alreadyExists: number;
  failed: number;
  reusedCovers: number;
  emptyAuthor: number;
}

/**
 * 후보를 한 권씩 순서대로 적재합니다. 한 권이 실패해도 멈추지 않고 다음으로
 * 넘어가며, 실패는 기록에 남습니다. 같은 후보로 다시 돌리면 이미 들어간 책은
 * `already_exists`, R2에만 남은 표지는 재사용됩니다.
 */
export async function runApply(
  books: Candidate[],
  deps: IngestDeps,
  journal: Journal,
  onBook?: (outcome: IngestOutcome, index: number, book: Candidate) => void,
): Promise<ApplySummary> {
  const summary: ApplySummary = {
    total: books.length,
    inserted: 0,
    alreadyExists: 0,
    failed: 0,
    reusedCovers: 0,
    emptyAuthor: 0,
  };
  for (const [index, book] of books.entries()) {
    const outcome = await ingestBook(book, deps);
    if (outcome.status === "inserted") summary.inserted += 1;
    if (outcome.status === "already_exists") summary.alreadyExists += 1;
    if (outcome.status === "failed") summary.failed += 1;
    if (outcome.cover?.reused) summary.reusedCovers += 1;
    if (outcome.status === "inserted" && !book.author) summary.emptyAuthor += 1;
    journal.write({
      type: "ingest",
      ...outcome,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      kakao: book.kakao,
    });
    onBook?.(outcome, index, book);
  }
  journal.write({ type: "apply_summary", ...summary });
  return summary;
}
