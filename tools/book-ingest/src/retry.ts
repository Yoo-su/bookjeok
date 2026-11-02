import { readFile } from "node:fs/promises";

import type { Candidate } from "./normalize";

/** The persisted plan includes books never reached after a block/process interruption. */
export async function readRetryCandidates(path: string): Promise<Candidate[]> {
  const lines = (await readFile(path, "utf8")).trimEnd().split("\n");
  const records = lines.flatMap((line, index) => {
    try {
      return [JSON.parse(line)];
    } catch {
      // An interrupted final append can be incomplete; earlier corruption is an error.
      if (index === lines.length - 1) return [];
      throw new Error("재시도 기록이 손상됐습니다");
    }
  });
  const plan = records.find(
    (record) => record.type === "apply_plan" && record.version === 1,
  );
  if (!plan || !Array.isArray(plan.books))
    throw new Error(
      "재시도 계획이 없는 기록입니다. 새 버전의 apply 기록을 사용하세요",
    );
  const books: Candidate[] = plan.books;
  if (
    !books.every(
      (book) =>
        book &&
        /^97[89]\d{10}$/.test(book.isbn) &&
        typeof book.source === "string" &&
        typeof book.publisher === "string" &&
        typeof book.title === "string" &&
        Array.isArray(book.coverUrls),
    )
  ) {
    throw new Error("재시도 계획의 도서 데이터가 잘못됐습니다");
  }
  const done = new Set(
    records
      .filter(
        (record) =>
          record.type === "ingest" &&
          ["inserted", "already_exists"].includes(record.status),
      )
      .map((record) => record.isbn),
  );
  return [
    ...new Map(
      books
        .filter((book) => !done.has(book.isbn))
        .map((book) => [book.isbn, book]),
    ).values(),
  ];
}
