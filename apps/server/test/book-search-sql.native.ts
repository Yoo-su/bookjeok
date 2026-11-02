import { deepStrictEqual, equal, ok } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  after as afterAll,
  before as beforeAll,
  describe,
  it,
} from 'node:test';

import { BookSearchField } from '@bookjeok/core';
import { PGlite } from '@electric-sql/pglite';

import { planBookSearch } from '@/features/book/providers/book-search-plan';
import {
  buildCountQuery,
  buildSearchQuery,
  canMatchAdjacent,
  escapeLike,
  searchColumnsFor,
  tokenize,
} from '@/features/book/providers/book-search-query';

void describe('도서 검색 SQL (실제 PostgreSQL 실행)', () => {
  let db: PGlite;
  beforeAll(
    async () => {
      db = new PGlite();
      await db.exec(`CREATE TABLE books (
      isbn varchar PRIMARY KEY, title text NOT NULL, author text NOT NULL,
      publisher text NOT NULL, description text NOT NULL,
      "salesPoint" integer, "pubDate" date
    )`);
      const fixtures = [
        ['novel', '채식주의자', '한강', '창비', '소설', 100],
        [
          'commentary',
          '한강 채식주의자 다시 읽기',
          '양관수',
          '계간문예',
          '해설서',
          1000,
        ],
        ['roles', '채식주의자 큰글자도서', '한강 (지은이)', '창비', '소설', 20],
        [
          'partial-author',
          '채식주의자에 관한 이야기',
          '정한강',
          '다른출판사',
          '소설',
          10000,
        ],
        [
          'psychology',
          '마음의 지도',
          '김작가',
          '민음사',
          '불안을 이해하는 심리학 입문 안내서',
          200,
        ],
        [
          'irrelevant',
          '경제의 지도',
          '이작가',
          '다른출판사',
          '불안한 시장을 이해하는 경제학',
          10000,
        ],
        [
          'ai-title',
          '인공지능 시대의 선택',
          '박작가',
          '다른출판사',
          '기술의 윤리적 문제',
          100,
        ],
        [
          'ai-description',
          '사회와 기술',
          '최작가',
          '다른출판사',
          '인공지능과 윤리적 책임을 다룬다',
          80,
        ],
        ['cpp', 'C++ 프로그래밍', '개발자', '기술출판', '개발 입문', 10],
        ['c', 'C 프로그래밍', '개발자', '기술출판', '개발 입문', 1000],
        [
          'literal-title',
          '불안을 다루는 심리학 책',
          '저자',
          '다른출판사',
          '원문 제목',
          1,
        ],
        [
          'publisher-mention',
          '출판 이야기',
          '저자',
          '다른출판사',
          '민음사의 출판에 관한 책',
          1000,
        ],
        ['writer', '작가의 시간', '김영하 (지은이)', '다른출판사', '소설', 100],
        [
          'writer-mention',
          '문학 이야기',
          '다른작가',
          '다른출판사',
          '김영하의 문학을 다룬다',
          1000,
        ],
        ['9788936434595', 'ISBN으로 찾는 책', '작가', '출판사', '', 1],
        ['isbn-in-title', '9788936434595 해설', '작가', '출판사', '', 100],
        ['number-title', '0000000000 이야기', '작가', '출판사', '', 100],
      ];
      for (const values of fixtures) {
        await db.query(
          'INSERT INTO books (isbn,title,author,publisher,description,"salesPoint") VALUES ($1,$2,$3,$4,$5,$6)',
          values,
        );
      }
      const ddl = readFileSync(
        resolve(
          __dirname,
          '..',
          '..',
          '..',
          'docs/ddl/2026-10-29-book-discovery-index.sql',
        ),
        'utf8',
      );
      // 단일 연결 임베디드 DB에서 운영과 동일한 인덱스 식을 검증한다.
      await db.exec(ddl.replace('CREATE INDEX CONCURRENTLY', 'CREATE INDEX'));
    },
    { timeout: 30000 },
  );
  afterAll(async () => {
    await db?.close();
  });

  const optionsFor = (
    query: string,
    field: BookSearchField = 'Keyword',
    offset = 0,
  ) => ({
    ...planBookSearch(query, field),
    columns: searchColumnsFor(field),
    sort: 'sim' as const,
    adjacent: false,
    limit: 10,
    offset,
  });
  const search = async (query: string, field?: BookSearchField, offset = 0) => {
    const options = optionsFor(query, field, offset);
    const built = buildSearchQuery(options);
    return db.query<{ isbn: string; total: number }>(built.sql, built.params);
  };

  void it('소개에만 있는 주제와 제목·소개에 나뉜 단서를 함께 찾는다', async () => {
    const result = await search('인공지능 윤리');
    deepStrictEqual(result.rows.map((row) => row.isbn).sort(), [
      'ai-description',
      'ai-title',
    ]);
  });

  void it('요청 표현·조사를 완화하되 원문 제목을 먼저 보여준다', async () => {
    const result = await search('불안을 다루는 심리학 책');
    equal(result.rows[0].isbn, 'literal-title');
    ok(result.rows.some((row) => row.isbn === 'psychology'));
    ok(result.rows.every((row) => row.isbn !== 'irrelevant'));
  });

  for (const query of ['한강 채식주의자', '채식주의자 한강'])
    void it(query + '는 실제 작가의 작품을 해설서보다 앞에 둔다', async () => {
      const ids = (await search(query)).rows.map((row) => row.isbn);
      for (const id of ['novel', 'roles', 'commentary', 'partial-author'])
        ok(ids.includes(id));
      ok(ids.indexOf('novel') < ids.indexOf('commentary'));
      ok(ids.indexOf('roles') < ids.indexOf('commentary'));
      ok(ids.indexOf('novel') < ids.indexOf('partial-author'));
    });

  void it('필드 지정 검색에 소개나 다른 필드의 언급을 섞지 않는다', async () => {
    const result = await search('민음사', 'Publisher');
    deepStrictEqual(
      result.rows.map((row) => row.isbn),
      ['psychology'],
    );
  });

  void it('정확한 저자·출판사명은 소개 언급으로 넓히거나 소개 점수로 재정렬하지 않는다', async () => {
    deepStrictEqual(
      (await search('민음사')).rows.map((row) => row.isbn),
      ['psychology'],
    );
    deepStrictEqual(
      (await search('김영하')).rows.map((row) => row.isbn),
      ['writer'],
    );
  });

  void it('기호가 있는 언어명을 일반 알파벳 검색으로 넓히지 않는다', async () => {
    const result = await search('c++ 프로그래밍');
    deepStrictEqual(
      result.rows.map((row) => row.isbn),
      ['cpp'],
    );
  });

  void it('짧은 한글·숫자·영문·기호 검색은 원문 ILIKE의 후보를 그대로 유지한다', async () => {
    await db.exec(`INSERT INTO books (isbn,title,author,publisher,description) VALUES
      ('mixed-case', 'ABC 사랑 12 SF C++ 50% A_B', 'ㄱ 한강', '출판 Q&A', ''),
      ('lower-case', 'abc 사랑 12 sf c++ 50% a_b', 'ㄱ 한강', '출판 q&a', ''),
      ('literal-symbols', '50점 A-B C 언어', '작가', '출판', '')`);
    for (const query of [
      '사랑',
      '한강',
      'ㄱ',
      '12',
      'SF',
      'c++',
      '50%',
      'A_B',
      'Q&A',
      '사랑 SF',
    ]) {
      const tokens = tokenize(query);
      for (const field of [
        'Keyword',
        'Title',
        'Author',
        'Publisher',
      ] as const) {
        const columns = searchColumnsFor(field);
        const original = await db.query<{ isbn: string }>(
          `SELECT isbn FROM books book WHERE ${tokens.map((_, index) => `(${columns.map((column) => `book.${column} ILIKE $${index + 1}`).join(' OR ')})`).join(' AND ')} ORDER BY isbn`,
          tokens.map((token) => `%${escapeLike(token.raw)}%`),
        );
        const built = buildSearchQuery({
          tokens,
          columns,
          adjacent: false,
          sort: 'sim',
          limit: 1000,
          offset: 0,
        });
        const actual = await db.query<{ isbn: string; total: number }>(
          built.sql,
          built.params,
        );
        deepStrictEqual(
          actual.rows.map((row) => row.isbn).sort(),
          original.rows.map((row) => row.isbn),
        );
        if (actual.rows.length)
          equal(Number(actual.rows[0].total), original.rows.length);
      }
    }
  });

  void it('ISBN 정확 후보를 더해도 숫자로 찾던 제목을 누락하지 않는다', async () => {
    const exactIsbn = '9788936434595';
    const options = {
      ...optionsFor(exactIsbn),
      exactIsbn,
      discoveryQuery: undefined,
    };
    const built = buildSearchQuery(options);
    const result = await db.query<{ isbn: string; total: number }>(
      built.sql,
      built.params,
    );
    deepStrictEqual(
      result.rows.map((row) => row.isbn),
      [exactIsbn, 'isbn-in-title'],
    );
    equal(Number(result.rows[0].total), 2);
    for (const query of ['978-89-364-3459-5', '0000000000']) {
      const options = {
        ...optionsFor(query),
        exactIsbn: query.replace(/-/g, ''),
        discoveryQuery: undefined,
      };
      const count = buildCountQuery(options);
      const counted = await db.query<{ total: number }>(
        count.sql,
        count.params,
      );
      equal(Number(counted.rows[0].total), query.startsWith('978') ? 2 : 1);
      const byDate = buildSearchQuery({ ...options, sort: 'date' });
      const dated = await db.query(byDate.sql, byDate.params);
      equal(dated.rows.length, Number(counted.rows[0].total));
    }
  });

  void it('원문 조건으로 찾던 ISBN 집합을 확장·소개 검색에서도 모두 유지한다', async () => {
    const queries = [
      '채식주의자',
      '한강 채식주의자',
      '채식주의자 한강',
      '한강의 채식주의자',
      '불안을 다루는 심리학 책',
      '인공지능 윤리',
      '민음사',
      '김영하',
      'C++ 프로그래밍',
      'C 프로그래밍',
      'Q&A',
      '책',
      '0000000000',
    ];
    const fields: BookSearchField[] = [
      'Keyword',
      'Title',
      'Author',
      'Publisher',
    ];
    for (const query of queries) {
      for (const field of fields) {
        const planned = optionsFor(query, field);
        const adjacentModes = canMatchAdjacent(planned.tokens)
          ? [false, true]
          : [false];
        for (const adjacent of adjacentModes) {
          const original = buildSearchQuery({
            ...planned,
            adjacent,
            limit: 1000,
            expandedTokens: undefined,
            discoveryQuery: undefined,
          });
          const before = await db.query<{ isbn: string }>(
            original.sql,
            original.params,
          );
          for (const useDiscovery of [false, true]) {
            const improved = buildSearchQuery({
              ...planned,
              adjacent,
              limit: 1000,
              discoveryQuery: useDiscovery ? planned.discoveryQuery : undefined,
            });
            const after = await db.query<{ isbn: string }>(
              improved.sql,
              improved.params,
            );
            const ids = new Set(after.rows.map((row) => row.isbn));
            for (const row of before.rows) {
              ok(ids.has(row.isbn), `${field} / ${query} / ${row.isbn}`);
            }
          }
        }
      }
    }
  });

  void it('서지·소개가 모두 맞아도 중복 없이 세고 페이지 밖 건수도 일치한다', async () => {
    await db.exec('BEGIN');
    try {
      await db.exec(`INSERT INTO books (isbn,title,author,publisher,description)
        VALUES ('ai-both','인공지능 윤리','작가','출판사','인공지능과 윤리적 책임을 다룬다')`);
      const options = optionsFor('인공지능 윤리', 'Keyword', 20);
      const page = buildSearchQuery(options);
      const count = buildCountQuery(options);
      deepStrictEqual((await db.query(page.sql, page.params)).rows, []);
      const counted = await db.query<{ total: number }>(
        count.sql,
        count.params,
      );
      equal(Number(counted.rows[0].total), 3);
      const result = await search('인공지능 윤리');
      equal(result.rows.length, 3);
      equal(new Set(result.rows.map((row) => row.isbn)).size, 3);
      equal(Number(result.rows[0].total), 3);
      equal(result.rows.filter((row) => row.isbn === 'ai-both').length, 1);
    } finally {
      await db.exec('ROLLBACK');
    }
  });

  void it('신간순에서도 소개 후보를 포함하고 순위 점수용 매개변수를 남기지 않는다', async () => {
    const built = buildSearchQuery({
      ...optionsFor('인공지능 윤리'),
      sort: 'date',
    });
    const result = await db.query<{ isbn: string; total: number }>(
      built.sql,
      built.params,
    );
    deepStrictEqual(result.rows.map((row) => row.isbn).sort(), [
      'ai-description',
      'ai-title',
    ]);
    equal(Number(result.rows[0].total), 2);
  });

  void it('소개 재정렬 범위를 넘어도 전체 후보와 페이지 순서를 유지한다', async () => {
    for (let index = 0; index < 220; index++) {
      await db.query(
        "INSERT INTO books (isbn,title,author,publisher,description,\"salesPoint\") VALUES ($1,$2,'작가','출판사','시간 여행을 하는 이야기',$3)",
        [`travel-${index}`, `기록 ${index}`, index],
      );
    }
    const options = optionsFor('시간 여행');
    const all = buildSearchQuery({ ...options, limit: 220 });
    const full = await db.query<{ isbn: string; total: number }>(
      all.sql,
      all.params,
    );
    equal(full.rows.length, 220);
    equal(Number(full.rows[0].total), 220);
    const page = await search('시간 여행', 'Keyword', 195);
    deepStrictEqual(
      page.rows.map((row) => row.isbn),
      full.rows.slice(195, 205).map((row) => row.isbn),
    );
  });
});
