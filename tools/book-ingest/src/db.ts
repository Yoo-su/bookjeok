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

/** `book_dimensions` 한 행. 모르는 값은 NULL. */
export interface DimensionRow {
  isbn: string;
  width: number | null;
  height: number | null;
  depth: number | null;
  pages: number | null;
  weight: number | null;
  binding: string | null;
  coverColor: string | null;
}

/** 각 테이블에 이번에 새로 넣었는지. 이미 있던 행이면 false. */
export interface InsertResult {
  book: boolean;
  dimension: boolean;
}

export interface PublisherStat {
  publisher: string;
  count: number;
}

export interface BookDb {
  publisherStats(limit: number): Promise<PublisherStat[]>;
  findExisting(isbns: string[]): Promise<Set<string>>;
  insertBook(
    row: BookRow,
    dimension: DimensionRow | null,
  ): Promise<InsertResult>;
  /** 두 테이블에 넣을 수 있는지 확인합니다. 없으면 무엇이 빠졌는지 던집니다. */
  assertWritable(): Promise<void>;
  close(): Promise<void>;
}

/**
 * `books`·`book_dimensions`에는 SELECT와 INSERT만 합니다. UPDATE·DELETE·DDL은 하지 않습니다.
 *
 * `salesPoint`는 공급처가 준 값만 넣고, 없으면 NULL입니다(0은 "판매 실적 없음"이라는
 * 다른 뜻). `embedding`은 넣지 않습니다. 상시 생성하지 않는 것이 의도된 상태입니다.
 * `viewCount`·`createdAt`·`updatedAt`은 컬럼 기본값을 씁니다.
 * `book_dimensions`에는 추정값을 넣지 않습니다. 없는 값은 NULL이고 서버가 조회 때 채웁니다.
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

    async insertBook(row, dimension) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const book = await client.query(
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
        // 책이 이미 있어도 판형 행이 없으면 채웁니다. 있으면 건드리지 않습니다.
        const dim = dimension
          ? await client.query(
              `INSERT INTO book_dimensions (isbn, width, height, depth, pages, weight, binding, "coverColor")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (isbn) DO NOTHING`,
              [
                dimension.isbn,
                dimension.width,
                dimension.height,
                dimension.depth,
                dimension.pages,
                dimension.weight,
                dimension.binding,
                dimension.coverColor,
              ],
            )
          : null;
        await client.query("COMMIT");
        return { book: book.rowCount === 1, dimension: dim?.rowCount === 1 };
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    /**
     * `INSERT … ON CONFLICT (isbn)`은 INSERT만으로는 안 됩니다. 충돌 검사에 SELECT 권한이,
     * RLS가 켜진 테이블에서는 SELECT 정책까지 필요합니다(PGlite로 확인, 2026-09-25).
     */
    async assertWritable() {
      const { rows } = await pool.query<{
        name: string;
        granted: boolean;
        rls: boolean;
      }>(
        `WITH mine AS (
           SELECT tablename, cmd FROM pg_policies
            WHERE schemaname = 'public'
              AND (current_user = ANY (roles) OR 'public' = ANY (roles))
         )
         SELECT t.name,
                has_table_privilege(current_user, c.oid, 'SELECT')
                  AND has_table_privilege(current_user, c.oid, 'INSERT') AS granted,
                NOT c.relrowsecurity
                  OR pg_has_role(current_user, c.relowner, 'USAGE')
                  OR (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user)
                  OR (EXISTS (SELECT 1 FROM mine WHERE tablename = t.name AND cmd IN ('SELECT', 'ALL'))
                      AND EXISTS (SELECT 1 FROM mine WHERE tablename = t.name AND cmd IN ('INSERT', 'ALL'))) AS rls
           FROM unnest(ARRAY['books', 'book_dimensions']) AS t(name)
           JOIN pg_class c ON c.oid = ('public.' || t.name)::regclass`,
      );
      const missing = rows
        .filter((r) => !r.granted || !r.rls)
        .map(
          (r) =>
            `${r.name}(${!r.granted ? "SELECT·INSERT 권한" : "SELECT·INSERT RLS 정책"})`,
        );
      if (missing.length > 0) {
        throw new Error(
          `이 DB 계정으로는 ${missing.join(", ")}이 없어 적재할 수 없습니다. ` +
            "docs/manual-ddl-log.md 12절의 GRANT·정책을 먼저 적용하세요.",
        );
      }
    },

    close: () => pool.end(),
  };
}
