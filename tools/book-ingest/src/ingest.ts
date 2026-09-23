import type { CoverExt, PreparedCover } from "./cover";
import type { BookRow } from "./db";
import type { Candidate } from "./normalize";
import { coverKey, type CoverStore } from "./r2";

export interface IngestDeps {
  downloadCover(url: string): Promise<Buffer>;
  prepareCover(original: Buffer): Promise<PreparedCover>;
  /** 표지 원본을 로컬에 남깁니다. 가공 스펙이 바뀌면 여기서 다시 뽑습니다. */
  saveOriginal(isbn: string, body: Buffer, ext: CoverExt): Promise<void>;
  store: CoverStore;
  /** 공개 URL이 200인지. DB에 넣기 전 마지막 확인입니다. */
  verifyPublic(url: string): Promise<boolean>;
  insertBook(row: BookRow): Promise<boolean>;
  cdnBase: string;
}

export interface CoverReport {
  key: string;
  reused: boolean;
  sourceFormat?: string;
  sourceWidth?: number;
  sourceBytes?: number;
  uploadedBytes?: number;
  psnr?: number | null;
  converted?: boolean;
}

export type IngestOutcome =
  | {
      isbn: string;
      status: "inserted" | "already_exists";
      image: string;
      cover: CoverReport;
    }
  | { isbn: string; status: "failed"; error: string; cover?: CoverReport };

/**
 * 한 권을 적재합니다. **표지를 R2에 올리고 공개 URL을 확인한 뒤에만 INSERT합니다.**
 * 그래서 `books.image`에 벤더 URL이나 깨진 링크가 들어가는 순간이 없습니다
 * (계획서 「확정된 결정」 2번). 중간에 실패하면 R2에 표지만 남는데, 참조되지
 * 않을 뿐 무해하고 다음 실행이 그 키를 재사용합니다.
 */
export async function ingestBook(
  book: Candidate,
  deps: IngestDeps,
): Promise<IngestOutcome> {
  let cover: CoverReport | undefined;
  try {
    const existing = await deps.store.existingKey(book.isbn);
    if (existing) {
      cover = { key: existing, reused: true };
    } else {
      const original = await deps.downloadCover(book.coverSourceUrl);
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

    const inserted = await deps.insertBook({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      discount: book.discount,
      pubDate: book.pubDate,
      description: book.description,
      image,
    });
    return {
      isbn: book.isbn,
      status: inserted ? "inserted" : "already_exists",
      image,
      cover,
    };
  } catch (error) {
    return {
      isbn: book.isbn,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      cover,
    };
  }
}

function extOfFormat(format: string): CoverExt {
  if (format === "jpeg") return "jpg";
  if (format === "png" || format === "gif" || format === "webp") return format;
  return "jpg";
}
