/** 운영에서 읽기 전용으로 확보한 공개 도서 JSON을 로컬 PostgreSQL에 넣어 비교한다. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { PGlite } = require('@electric-sql/pglite');
const { pg_trgm } = require('@electric-sql/pglite/contrib/pg_trgm');
require('ts-node').register({
  project: path.resolve(__dirname, '../tsconfig.json'),
  transpileOnly: true,
});
const root = path.resolve(__dirname, '../../..');
const current = require('../src/features/book/providers/book-search-query.ts');
const {
  planBookSearch,
} = require('../src/features/book/providers/book-search-plan.ts');
const queries = [
  '채식주의자',
  '한강 채식주의자',
  '채식주의자 한강',
  '한강의 채식주의자',
  '채식주의자 책',
  '해리포터',
  '해리 포터',
  '사탄 탱고',
  '라슬로 사탄',
  '어린 왕자',
  '그리스 로마 신화',
  '민음사',
  '김영하',
  'c++',
  'Q&A',
  '인공지능 윤리',
  '인공지능의 윤리',
  '기후 위기',
  '여성 노동',
  '관계 심리',
  '불안 심리학',
  '불안을 다루는 심리학 책',
  '세계문학전집',
  '철학 입문',
  '우주 과학',
  'SF 입문',
  '상실을 극복하는 소설',
  '사랑 소설',
];

async function main() {
  const [
    input = '.tmp/search-corpus.json',
    output = '.tmp/book-search-comparison.json',
    baselineRef = 'HEAD',
  ] = process.argv.slice(2);
  const baselineRevision = execFileSync(
    'git',
    ['rev-parse', '--verify', baselineRef],
    { cwd: root, encoding: 'utf8' },
  ).trim();
  const source = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
  const beforePath = path.resolve(root, '.tmp/book-search-query.before.ts');
  fs.writeFileSync(
    beforePath,
    execFileSync(
      'git',
      [
        'show',
        `${baselineRevision}:apps/server/src/features/book/providers/book-search-query.ts`,
      ],
      { cwd: root },
    ),
  );
  const before = require(beforePath);
  const db = new PGlite({
    dataDir: path.resolve(root, '.tmp/book-search-lab'),
    extensions: { pg_trgm },
  });
  try {
    await db.exec('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    const existing = await db.query(
      "SELECT to_regclass('public.books') AS table_name",
    );
    if (!existing.rows[0].table_name) {
      await db.exec(`CREATE TABLE books (
        isbn varchar PRIMARY KEY, title text, author text, publisher text,
        description text, "salesPoint" integer, "pubDate" date
      )`);
      for (let offset = 0; offset < source.books.length; offset += 500) {
        await db.query(
          `INSERT INTO books SELECT * FROM jsonb_to_recordset($1::jsonb)
          AS x(isbn varchar,title text,author text,publisher text,description text,"salesPoint" integer,"pubDate" date)`,
          [JSON.stringify(source.books.slice(offset, offset + 500))],
        );
        if (offset % 5000 === 0)
          console.log(
            `로컬 적재 ${Math.min(offset + 500, source.books.length)}/${source.books.length}`,
          );
      }
      await db.exec(
        `CREATE INDEX "IDX_books_search_key_trgm" ON books USING gin ((${current.SEARCH_KEY_SQL.replaceAll('book.', '')}) gin_trgm_ops)`,
      );
    }
    const count = await db.query('SELECT count(*)::int AS count FROM books');
    if (count.rows[0].count !== source.books.length)
      throw new Error(
        '로컬 사본의 책 수가 다릅니다. .tmp/book-search-lab을 확인하세요.',
      );
    const ddl = fs.readFileSync(
      path.resolve(root, 'docs/ddl/2026-10-29-book-discovery-index.sql'),
      'utf8',
    );
    const hasIndex = await db.query('SELECT to_regclass($1) AS name', [
      'public."' + current.SEARCH_DOCUMENT_INDEX + '"',
    ]);
    if (!hasIndex.rows[0].name) {
      console.log('로컬 전문검색 인덱스 생성 시작');
      await db.exec(ddl.replace('CREATE INDEX CONCURRENTLY', 'CREATE INDEX'));
    }
    await db.exec('ANALYZE books');
    const sizes = await db.query(
      "SELECT pg_relation_size($1)::bigint AS document_index_bytes, pg_total_relation_size('books')::bigint AS total_bytes",
      ['"' + current.SEARCH_DOCUMENT_INDEX + '"'],
    );
    console.log(JSON.stringify({ sizes: sizes.rows[0] }));
    const results = [];
    for (const query of queries) {
      const row = { query };
      for (const [label, builder] of [
        ['before', before],
        ['after', current],
      ]) {
        const plan =
          label === 'before'
            ? { tokens: before.tokenize(query) }
            : planBookSearch(query, 'Keyword');
        const columns = builder.searchColumnsFor('Keyword');
        let adjacent = false;
        if (builder.canMatchAdjacent(plan.tokens)) {
          const probe = builder.buildAdjacentProbe(plan.tokens, columns);
          adjacent = (await db.query(probe.sql, probe.params)).rows.length > 0;
        }
        const options = {
          ...plan,
          columns,
          sort: 'sim',
          adjacent,
          limit: 10,
          offset: 0,
        };
        const built = builder.buildSearchQuery(options);
        const durations = [];
        let page;
        for (let run = 0; run < 2; run++) {
          const started = performance.now();
          page = await db.query(built.sql, built.params);
          durations.push(Math.round(performance.now() - started));
        }
        const isbns = page.rows.map((item) => item.isbn);
        const books = await db.query(
          'SELECT isbn,title,author,publisher FROM books WHERE isbn = ANY($1::varchar[])',
          [isbns],
        );
        const byIsbn = new Map(books.rows.map((book) => [book.isbn, book]));
        row[label] = {
          total: Number(page.rows[0]?.total ?? 0),
          localMs: durations,
          items: isbns.map((isbn) => byIsbn.get(isbn)),
        };
      }
      results.push(row);
      console.log(
        JSON.stringify({
          query,
          before: row.before.total,
          after: row.after.total,
          beforeMs: row.before.localMs,
          afterMs: row.after.localMs,
        }),
      );
      fs.writeFileSync(
        path.resolve(output),
        JSON.stringify(
          {
            corpusAt: source.measuredAt,
            baselineRevision,
            count: source.books.length,
            sizes: sizes.rows[0],
            note: '로컬 PGlite 사본. 운영 PostgreSQL 성능·인덱스 크기와 같다고 보장하지 않음. 각 2회이며 2회차도 콜드/웜 상태를 통제한 측정이 아님.',
            results,
          },
          null,
          2,
        ),
      );
    }
  } finally {
    await db.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
