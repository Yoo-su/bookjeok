import pg from "pg";

export interface BookRow {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  discount: string;
  pubDate: string | null;
  description: string;
  image: string;
  /** 공급처가 판매지수를 주지 않으면 NULL. */
  salesPoint: number | null;
}

export interface PublisherStat {
  publisher: string;
  count: number;
}

export interface BookDb {
  publisherStats(limit: number): Promise<PublisherStat[]>;
  findExisting(isbns: string[]): Promise<Set<string>>;
  /** 새로 넣었으면 true, 이미 있던 ISBN이면 false. */
  insertBook(row: BookRow): Promise<boolean>;
  close(): Promise<void>;
}

/**
 * `books`에는 SELECT와 INSERT만 합니다. UPDATE·DELETE·DDL은 하지 않습니다.
 *
 * `salesPoint`는 공급처가 준 값만 넣고, 없으면 NULL입니다(0은 "판매 실적 없음"이라는
 * 다른 뜻). `embedding`은 넣지 않습니다. 상시 생성하지 않는 것이 의도된 상태입니다.
 * `viewCount`·`createdAt`·`updatedAt`은 컬럼 기본값을 씁니다.
 */
export function createBookDb(url: string): BookDb {
  // 로컬이 아니면 관리형 DB로 보고 TLS를 켭니다. Supabase는 체인 검증에 걸립니다.
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const pool = new pg.Pool({
    connectionString: url,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 2,
  });

  return {
    async publisherStats(limit) {
      const { rows } = await pool.query<{ publisher: string; count: number }>(
        `SELECT publisher, COUNT(*)::int AS count
           FROM books
          WHERE publisher <> ''
          GROUP BY publisher
          ORDER BY count DESC, publisher
          LIMIT $1`,
        [limit],
      );
      return rows;
    },

    async findExisting(isbns) {
      if (isbns.length === 0) return new Set();
      const { rows } = await pool.query<{ isbn: string }>(
        "SELECT isbn FROM books WHERE isbn = ANY($1::text[])",
        [isbns],
      );
      return new Set(rows.map((row) => row.isbn));
    },

    async insertBook(row) {
      const { rowCount } = await pool.query(
        `INSERT INTO books (isbn, title, author, publisher, discount, "pubDate", description, image, "salesPoint")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (isbn) DO NOTHING`,
        [
          row.isbn,
          row.title,
          row.author,
          row.publisher,
          row.discount,
          row.pubDate,
          row.description,
          row.image,
          row.salesPoint,
        ],
      );
      return rowCount === 1;
    },

    close: () => pool.end(),
  };
}
