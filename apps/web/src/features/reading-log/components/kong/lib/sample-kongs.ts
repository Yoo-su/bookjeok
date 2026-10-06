import type { ReceivedKongLog, ReceivedKongsResponse } from "@bookjeok/core";

import { SAMPLE_BOOKS } from "../../stack-view/lib/sample-books";

const NAMES = ["책벌레", "하루", "민지", "새벽독서", "느림보", "모래", "솔"];

/** Storybook용 받은 콩. 앞의 책부터 counts만큼 받은 것으로 */
export function sampleReceivedKongs(counts: number[]): ReceivedKongsResponse {
  const logs: ReceivedKongLog[] = counts.map((count, i) => {
    const book = SAMPLE_BOOKS[i * 2 + 2];
    return {
      logId: book.logId,
      date: book.date,
      book: {
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        image: book.image,
      },
      count,
      senders: Array.from({ length: count }, (_, j) => ({
        userId: j + 10,
        nickname: NAMES[(i + j) % NAMES.length],
        handle: `reader_${j}`,
        profileImageUrl: null,
      })),
      lastReceivedAt: `${book.date}T09:00:00.000Z`,
    };
  });
  return { total: counts.reduce((a, b) => a + b, 0), logs };
}
