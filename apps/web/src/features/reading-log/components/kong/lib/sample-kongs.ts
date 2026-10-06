import {
  KONG_SENDERS_PER_LOG,
  type ReceivedKongLog,
  type ReceivedKongsResponse,
} from "@bookjeok/core";

import { SAMPLE_BOOKS } from "../../stack-view/lib/sample-books";

const NAMES = ["책벌레", "하루", "민지", "새벽독서", "느림보", "모래", "솔"];
/** 닉네임이 길 때 */
export const LONG_NAMES = [
  "밤새도록책장넘기는사람",
  "도서관이두번째집",
  "커피한잔과고전문학",
];

/** Storybook용 받은 콩. 앞의 책부터 counts만큼 받은 것으로. 보낸 사람은 서버처럼 앞의 몇 명만 */
export function sampleReceivedKongs(
  counts: number[],
  names: string[] = NAMES,
): ReceivedKongsResponse {
  const logs: ReceivedKongLog[] = counts.map((count, i) => {
    const book = SAMPLE_BOOKS[(i * 2 + 2) % SAMPLE_BOOKS.length];
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
      senders: Array.from(
        { length: Math.min(count, KONG_SENDERS_PER_LOG) },
        (_, j) => ({
          userId: j + 10,
          nickname: names[(i + j) % names.length],
          handle: `reader_${j}`,
          profileImageUrl: null,
        }),
      ),
      lastReceivedAt: `${book.date}T09:00:00.000Z`,
    };
  });
  return { total: counts.reduce((a, b) => a + b, 0), logs };
}
