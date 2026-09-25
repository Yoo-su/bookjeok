import type { CoverExt, PreparedCover } from "./cover";
import type { BookRow, DimensionRow, InsertResult } from "./db";
import { type BookDimensions, hasMeasurement } from "./dimensions";
import type { Candidate } from "./normalize";
import { coverKey, type CoverStore } from "./r2";

export interface IngestDeps {
  /** 공급처의 적재 직전 보강 조회. 보강할 것이 없는 공급처는 그대로 돌려줍니다. */
  enrich(book: Candidate): Promise<Candidate>;
  downloadCover(url: string): Promise<Buffer>;
  prepareCover(original: Buffer): Promise<PreparedCover>;
  /** 표지 원본을 로컬에 남깁니다. 가공 스펙이 바뀌면 여기서 다시 뽑습니다. */
  saveOriginal(isbn: string, body: Buffer, ext: CoverExt): Promise<void>;
  store: CoverStore;
  /** 공개 URL이 200인지. DB에 넣기 전 마지막 확인입니다. */
  verifyPublic(url: string): Promise<boolean>;
  /** 표지 대표색 `#rrggbb`. */
  coverColor(image: Buffer): Promise<string>;
  /** `books`와 `book_dimensions`를 한 트랜잭션으로 넣습니다. */
  insertBook(
    row: BookRow,
    dimension: DimensionRow | null,
  ): Promise<InsertResult>;
  /** 적재를 시작하기 전에 쓰기 권한을 확인합니다. 없으면 던집니다. */
  preflight(): Promise<void>;
  cdnBase: string;
}

export interface CoverReport {
  key: string;
  reused: boolean;
  /** 실제로 받은 표지 주소. 첫 후보가 실패하면 다음 후보입니다. */
  sourceUrl?: string;
  sourceFormat?: string;
  sourceWidth?: number;
  sourceBytes?: number;
  uploadedBytes?: number;
  psnr?: number | null;
  converted?: boolean;
}

export interface DimensionReport {
  /** 이번에 행을 새로 넣었는지. 이미 있었거나 넣을 값이 없으면 false. */
  written: boolean;
  dimensions: BookDimensions | null;
  coverColor: string | null;
  /** 표지색을 못 뽑은 이유. 표지색은 부가 정보라 적재는 계속합니다. */
  colorError?: string;
}

export type IngestOutcome =
  | {
      isbn: string;
      status: "inserted" | "already_exists";
      image: string;
      cover: CoverReport;
      dimension: DimensionReport;
    }
  | { isbn: string; status: "failed"; error: string; cover?: CoverReport };

export interface IngestResult {
  outcome: IngestOutcome;
  /** 보강 조회를 거친 책. 보강 전에 실패했으면 받은 그대로입니다. */
  book: Candidate;
}

/**
 * 한 권을 적재합니다. **표지를 R2에 올리고 공개 URL을 확인한 뒤에만 INSERT합니다.**
 * 그래서 `books.image`에 벤더 URL이나 깨진 링크가 들어가는 순간이 없습니다
 * (계획서 「확정된 결정」 2번). 중간에 실패하면 R2에 표지만 남는데, 참조되지
 * 않을 뿐 무해하고 다음 실행이 그 키를 재사용합니다.
 *
 * 보강 조회는 표지보다 먼저 합니다. 쿼터 소진처럼 실패할 일이면 R2에 쓰기 전에 멈춥니다.
 *
 * `book_dimensions`는 `books`와 같은 트랜잭션으로 넣습니다. 도구에 UPDATE 권한이 없어
 * 책만 들어가고 판형이 빠지면 나중에 채울 길이 없기 때문입니다.
 */
export async function ingestBook(
  candidate: Candidate,
  deps: IngestDeps,
): Promise<IngestResult> {
  let book = candidate;
  let cover: CoverReport | undefined;
  const fail = (error: unknown): IngestResult => ({
    book,
    outcome: {
      isbn: book.isbn,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      cover,
    },
  });

  try {
    book = await deps.enrich(candidate);

    let original: Buffer | null = null;
    const existing = await deps.store.existingKey(book.isbn);
    if (existing) {
      cover = { key: existing, reused: true };
    } else {
      const downloaded = await downloadFirst(
        book.coverUrls,
        deps.downloadCover,
      );
      original = downloaded.body;
      const prepared = await deps.prepareCover(original);
      await deps.saveOriginal(
        book.isbn,
        original,
        extOfFormat(prepared.original.format),
      );
      const key = coverKey(book.isbn, prepared.ext);
      await deps.store.put(key, prepared.body, prepared.contentType);
      cover = {
        key,
        reused: false,
        sourceUrl: downloaded.url,
        sourceFormat: prepared.original.format,
        sourceWidth: prepared.original.width,
        sourceBytes: prepared.original.bytes,
        uploadedBytes: prepared.body.length,
        psnr: prepared.psnr,
        converted: prepared.converted,
      };
    }

    const image = `${deps.cdnBase}/${cover.key}`;
    if (!(await deps.verifyPublic(image))) {
      throw new Error(`공개 URL이 200이 아닙니다: ${image}`);
    }

    // 재사용한 표지는 원본을 받지 않았으므로 공개 URL에서 받아 색을 뽑습니다
    const color = await extractColor(original, image, deps);
    const dimensionRow = toDimensionRow(book, color.coverColor);
    const inserted = await deps.insertBook(
      {
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        discount: book.discount,
        pubDate: book.pubDate,
        description: book.description,
        image,
        salesPoint: book.salesPoint,
      },
      dimensionRow,
    );
    return {
      book,
      outcome: {
        isbn: book.isbn,
        status: inserted.book ? "inserted" : "already_exists",
        image,
        cover,
        dimension: {
          written: inserted.dimension,
          dimensions: book.dimensions,
          ...color,
        },
      },
    };
  } catch (error) {
    return fail(error);
  }
}

async function extractColor(
  original: Buffer | null,
  image: string,
  deps: IngestDeps,
): Promise<{ coverColor: string | null; colorError?: string }> {
  try {
    const body = original ?? (await deps.downloadCover(image));
    return { coverColor: await deps.coverColor(body) };
  } catch (error) {
    return {
      coverColor: null,
      colorError: error instanceof Error ? error.message : String(error),
    };
  }
}

/** 판형이나 표지색 중 하나라도 있으면 행을 만듭니다. 운영 적재와 같은 기준입니다. */
function toDimensionRow(
  book: Candidate,
  coverColor: string | null,
): DimensionRow | null {
  const d = book.dimensions;
  if (!hasMeasurement(d) && !coverColor) return null;
  return {
    isbn: book.isbn,
    width: d?.width ?? null,
    height: d?.height ?? null,
    depth: d?.depth ?? null,
    pages: d?.pages ?? null,
    weight: d?.weight ?? null,
    binding: d?.binding ?? null,
    coverColor,
  };
}

/** 표지 후보를 앞에서부터 받아 봅니다. 전부 실패하면 마지막 오류를 던집니다. */
async function downloadFirst(
  urls: string[],
  download: IngestDeps["downloadCover"],
): Promise<{ url: string; body: Buffer }> {
  let lastError: unknown = new Error("표지 주소가 없습니다");
  for (const url of urls) {
    try {
      return { url, body: await download(url) };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function extOfFormat(format: string): CoverExt {
  if (format === "jpeg") return "jpg";
  if (format === "png" || format === "gif" || format === "webp") return format;
  return "jpg";
}
