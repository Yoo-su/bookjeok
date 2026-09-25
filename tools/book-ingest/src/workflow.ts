import { hasMeasurement } from "./dimensions";
import { ingestBook, type IngestDeps, type IngestOutcome } from "./ingest";
import type { Journal } from "./journal";
import type { Candidate } from "./normalize";
import {
  type PageProgress,
  type ScanDeps,
  type ScanResult,
  type ScanTarget,
  scanTarget,
} from "./scan";

export interface ScanSummary {
  source: string;
  kind: ScanTarget["kind"];
  /** 출판사 이름 또는 `검색 "…"`. */
  label: string;
  pages: number;
  totalCount: number;
  fresh: number;
  known: number;
  excluded: number;
  /** 제외 사유(화면 표기) → 건수. */
  excludedByReason: Record<string, number>;
  /** 저자 배열이 비어 빈 문자열로 들어갈 후보 수. */
  emptyAuthor: number;
  preorder: number;
}

export function summarizeScan(scan: ScanResult): ScanSummary {
  const excludedByReason: Record<string, number> = {};
  for (const { label } of scan.excluded) {
    excludedByReason[label] = (excludedByReason[label] ?? 0) + 1;
  }
  return {
    source: scan.source,
    kind: scan.target.kind,
    label: scan.label,
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

/** 기록에 남길 대상. 출판사 신간은 예전 기록과 같은 `publisher` 키를 씁니다. */
const targetFields = (target: ScanTarget) =>
  target.kind === "publisher"
    ? { publisher: target.publisher }
    : { query: target.query };

export async function runScan(
  targets: ScanTarget[],
  deps: ScanDeps,
  journal: Journal,
  options: {
    maxPages?: number;
    today: string;
    onPage?: (p: PageProgress) => void;
  },
): Promise<ScanResult[]> {
  const scans: ScanResult[] = [];
  const source = deps.source.id;
  for (const target of targets) {
    const scan = await scanTarget(target, deps, options);
    const where = targetFields(target);
    for (const [result, books] of [
      ["fresh", scan.fresh],
      ["known", scan.known],
    ] as const) {
      for (const book of books) {
        journal.write({
          type: "scan",
          source,
          ...where,
          result,
          isbn: book.isbn,
          raw: book.raw,
        });
      }
    }
    for (const item of scan.excluded) {
      journal.write({
        type: "scan",
        source,
        ...where,
        result: "excluded",
        reason: item.reason,
        isbn: item.isbn,
        raw: item.raw,
      });
    }
    journal.write({ type: "scan_summary", ...where, ...summarizeScan(scan) });
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
  /** 이번에 새로 넣은 `book_dimensions` 행. */
  dimensionRows: number;
  /** 그중 판형·쪽수 실측값이 있는 행. 나머지는 표지색만 있습니다. */
  measured: number;
  /** 표지색을 못 뽑은 책. 적재는 됐고 서버가 대체 색을 씁니다. */
  colorFailed: number;
}

/**
 * 후보를 한 권씩 순서대로 적재합니다. 한 권이 실패해도 멈추지 않고 다음으로
 * 넘어가며, 실패는 기록에 남습니다. 같은 후보로 다시 돌리면 이미 들어간 책은
 * `already_exists`, R2에만 남은 표지는 재사용됩니다. 기록과 `onBook`에는 보강
 * 조회를 거친 책이 갑니다.
 *
 * 시작 전에 쓰기 권한을 확인합니다. 권한이 없으면 보강 조회 쿼터와 R2 업로드를
 * 쓰기 전에 멈춥니다.
 */
export async function runApply(
  books: Candidate[],
  deps: IngestDeps,
  journal: Journal,
  onBook?: (outcome: IngestOutcome, index: number, book: Candidate) => void,
): Promise<ApplySummary> {
  await deps.preflight();
  const summary: ApplySummary = {
    total: books.length,
    inserted: 0,
    alreadyExists: 0,
    failed: 0,
    reusedCovers: 0,
    emptyAuthor: 0,
    dimensionRows: 0,
    measured: 0,
    colorFailed: 0,
  };
  for (const [index, candidate] of books.entries()) {
    const { outcome, book } = await ingestBook(candidate, deps);
    if (outcome.status === "inserted") summary.inserted += 1;
    if (outcome.status === "already_exists") summary.alreadyExists += 1;
    if (outcome.status === "failed") summary.failed += 1;
    if (outcome.cover?.reused) summary.reusedCovers += 1;
    if (outcome.status === "inserted" && !book.author) summary.emptyAuthor += 1;
    if (outcome.status !== "failed") {
      const { dimension } = outcome;
      if (dimension.written) summary.dimensionRows += 1;
      if (dimension.written && hasMeasurement(dimension.dimensions)) {
        summary.measured += 1;
      }
      if (dimension.colorError) summary.colorFailed += 1;
    }
    journal.write({
      type: "ingest",
      source: book.source,
      ...outcome,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      salesPoint: book.salesPoint,
      raw: book.raw,
    });
    onBook?.(outcome, index, book);
  }
  journal.write({ type: "apply_summary", ...summary });
  return summary;
}
