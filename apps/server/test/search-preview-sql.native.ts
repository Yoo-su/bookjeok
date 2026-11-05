import { deepStrictEqual, equal } from 'node:assert/strict';
import {
  after as afterAll,
  before as beforeAll,
  describe,
  it,
} from 'node:test';

import { PGlite } from '@electric-sql/pglite';

import {
  buildBookActivityQuery,
  buildReviewPreviewQuery,
  buildSalePreviewQuery,
  previewTerms,
} from '@/features/search/utils/search-preview-sql';

void describe('통합 검색 미리보기 SQL (실제 PostgreSQL 실행)', () => {
  let db: PGlite;

  beforeAll(
    async () => {
      db = new PGlite();
      await db.exec(`
CREATE TABLE users (id serial PRIMARY KEY, nickname varchar NOT NULL);
CREATE TABLE books (isbn varchar PRIMARY KEY, title varchar NOT NULL,
  author varchar NOT NULL, image varchar);
CREATE TABLE reviews (id serial PRIMARY KEY, title varchar NOT NULL,
  content text NOT NULL, rating float NOT NULL DEFAULT 0,
  "userId" int NOT NULL REFERENCES users(id), isbn varchar,
  "isPublic" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL);
CREATE TABLE tags (id serial PRIMARY KEY, name varchar UNIQUE NOT NULL);
CREATE TABLE review_tags ("reviewId" int NOT NULL, "tagId" int NOT NULL,
  PRIMARY KEY ("reviewId", "tagId"));
CREATE TYPE used_book_sales_status_enum AS ENUM ('FOR_SALE', 'RESERVED', 'SOLD');
CREATE TABLE used_book_sales (id serial PRIMARY KEY, title varchar NOT NULL,
  price int NOT NULL, city varchar NOT NULL, district varchar NOT NULL,
  content text NOT NULL, isbn varchar NOT NULL,
  status used_book_sales_status_enum NOT NULL DEFAULT 'FOR_SALE',
  "createdAt" timestamptz NOT NULL);

INSERT INTO users (nickname) VALUES ('새벽독서'), ('책먼지'), ('한강러버');
INSERT INTO books VALUES
  ('b-boy', '소년이 온다', '한강', 'cover-boy'),
  ('b-demian', '데미안', '헤르만 헤세', 'cover-demian'),
  ('b-white', '흰', '한강', NULL);
INSERT INTO tags (name) VALUES ('노벨상'), ('소설'), ('고전');
`);
      const reviews: [string, string, number, string, boolean, string][] = [
        // id 1: 제목에 한강
        [
          '한강을 처음 읽다',
          '<p>조용한 <strong>문장</strong>이 오래 남는다.</p>',
          1,
          'b-boy',
          true,
          '2026-10-01',
        ],
        // id 2: 본문에만 한강, 마크업에 style·color
        [
          '오래 남은 책',
          '<p><span style="color: red">한강</span>의 소설은 무겁다.</p>',
          2,
          'b-white',
          true,
          '2026-10-05',
        ],
        // id 3: 비공개
        ['한강 비공개 리뷰', '<p>한강</p>', 1, 'b-boy', false, '2026-10-06'],
        // id 4: 태그만 맞음(노벨상), 태그 둘
        [
          '데미안 다시 읽기',
          '<p>싱클레어의 불안&nbsp;이 보였다 &amp; 좋았다</p>',
          2,
          'b-demian',
          true,
          '2026-10-02',
        ],
        // id 5: 작성자 닉네임에만 한강
        ['그냥 일기', '<p>오늘은 비</p>', 3, 'b-demian', true, '2026-10-07'],
        // id 6: 와일드카드 문자 그대로
        [
          '100% 추천',
          '<p>정말 100%_추천합니다</p>',
          2,
          'b-demian',
          true,
          '2026-10-03',
        ],
        // id 7: 붙여 넣은 마크업이 이스케이프돼 본문에 남음(운영 1건)
        [
          '자유에 관하여',
          '<p><strong>&lt;span style="background-color: #EEE"&gt;순응&lt;/span&gt;</strong></p>',
          2,
          'b-demian',
          true,
          '2026-09-01',
        ],
      ];
      for (const [
        title,
        content,
        userId,
        isbn,
        isPublic,
        createdAt,
      ] of reviews) {
        await db.query(
          'INSERT INTO reviews (title, content, "userId", isbn, "isPublic", "createdAt", rating) VALUES ($1,$2,$3,$4,$5,$6,4.5)',
          [title, content, userId, isbn, isPublic, createdAt],
        );
      }
      await db.exec(`INSERT INTO review_tags VALUES (4, 1), (4, 3), (2, 2);`);
      const sales: [string, string, string, string, string][] = [
        [
          '소년이 온다 밑줄 없음',
          '상태 좋아요',
          'b-boy',
          'FOR_SALE',
          '2026-10-01',
        ],
        ['민음사 세계문학', '한 번 읽음', 'b-demian', 'RESERVED', '2026-10-05'],
        ['헤세 전집 일부', '데미안 포함', 'b-demian', 'FOR_SALE', '2026-10-02'],
        ['소년이 온다 팝니다', '판매완료', 'b-boy', 'SOLD', '2026-10-06'],
      ];
      for (const [title, content, isbn, status, createdAt] of sales) {
        await db.query(
          `INSERT INTO used_book_sales (title, price, city, district, content, isbn, status, "createdAt")
           VALUES ($1, 9000, '서울', '마포구', $2, $3, $4, $5)`,
          [title, content, isbn, status, createdAt],
        );
      }
    },
    { timeout: 30000 },
  );
  afterAll(async () => {
    await db?.close();
  });

  const reviews = async (query: string, limit = 10) => {
    const { sql, params } = buildReviewPreviewQuery(previewTerms(query), limit);
    const result = await db.query<{ id: number; total: string; body: string }>(
      sql,
      params,
    );
    return result.rows;
  };
  const sales = async (query: string, limit = 10) => {
    const { sql, params } = buildSalePreviewQuery(previewTerms(query), limit);
    const result = await db.query<{
      id: number;
      status: string;
      total: string;
    }>(sql, params);
    return result.rows;
  };
  const ids = (rows: { id: number }[]) => rows.map((row) => Number(row.id));

  void it('제목 → 책 제목 → 태그 → 닉네임 → 본문 순으로 앞에 둔다. 비공개는 빠진다', async () => {
    // 1: 제목, 5: 닉네임(한강러버), 2: 본문
    deepStrictEqual(ids(await reviews('한강')), [1, 5, 2]);
  });

  void it('HTML 마크업에는 걸리지 않는다', async () => {
    deepStrictEqual(ids(await reviews('strong')), []);
    deepStrictEqual(ids(await reviews('color')), []);
    deepStrictEqual(ids(await reviews('style')), []);
    deepStrictEqual(ids(await reviews('문장')), [1]);
    // 이스케이프된 마크업도 태그로 보고 지운다
    deepStrictEqual(ids(await reviews('background')), []);
    deepStrictEqual(ids(await reviews('순응')), [7]);
  });

  void it('엔티티를 풀어서 찾고 본문을 순수 텍스트로 돌려준다', async () => {
    const rows = await reviews('불안 좋았다');
    deepStrictEqual(ids(rows), [4]);
    equal(rows[0].body.includes('<p>'), false);
    equal(rows[0].body.includes('&amp;'), false);
  });

  void it('여러 단어는 필드가 달라도 모두 맞아야 한다', async () => {
    // 2: 본문 「한강」 + 태그 「소설」
    deepStrictEqual(ids(await reviews('한강 소설')), [2]);
    // 5는 닉네임(한강러버)·책 제목(데미안)으로 두 단어가 다 맞는다
    deepStrictEqual(ids(await reviews('한강 데미안')), [5]);
    deepStrictEqual(ids(await reviews('한강 고전')), []);
  });

  void it('태그 조인으로 행이 불어나지 않는다', async () => {
    const rows = await reviews('데미안');
    // 4(제목, 태그 둘), 5·6·7(책 제목, 최신순) — 4가 한 번만
    deepStrictEqual(ids(rows), [4, 5, 6, 7]);
    equal(Number(rows[0].total), 4);
    deepStrictEqual(ids(await reviews('노벨상')), [4]);
  });

  void it('단어 안의 %·_는 와일드카드가 아니라 글자로 찾는다', async () => {
    deepStrictEqual(ids(await reviews('0%_추')), [6]);
    // 이스케이프하지 않으면 「0」 뒤 아무 두 글자로 1(…)·6이 걸린다
    deepStrictEqual(ids(await reviews('0%_천')), []);
  });

  void it('앞뒤 기호만 있는 검색어는 단어가 남지 않는다', () => {
    deepStrictEqual(previewTerms('%_ ,'), []);
    deepStrictEqual(previewTerms('「한강」, 소설!'), ['한강', '소설']);
  });

  void it('LIMIT 밖의 건수도 total에 담는다', async () => {
    const rows = await reviews('데미안', 1);
    equal(rows.length, 1);
    equal(Number(rows[0].total), 4);
  });

  void it('판매글은 판매완료를 빼고 판매중을 예약중보다 앞에 둔다', async () => {
    deepStrictEqual(ids(await sales('소년이')), [1]);
    // 2·3 모두 책 제목(데미안)으로 같은 점수 → 판매중(3) 먼저. 3은 본문에도 걸리지만 최고 가중치만 센다
    deepStrictEqual(ids(await sales('데미안')), [3, 2]);
    deepStrictEqual(ids(await sales('헤세')), [3, 2]);
    deepStrictEqual(ids(await sales('한강 밑줄')), [1]);
  });

  void it('책별 공개 리뷰·판매중 판매글 수를 센다', async () => {
    const { sql, params } = buildBookActivityQuery([
      'b-boy',
      'b-demian',
      'none',
    ]);
    const result = await db.query<{
      isbn: string;
      kind: string;
      count: number;
    }>(sql, params);
    const counts = Object.fromEntries(
      result.rows.map((row) => [`${row.kind}:${row.isbn}`, Number(row.count)]),
    );
    deepStrictEqual(counts, {
      'review:b-boy': 1,
      'review:b-demian': 4,
      'sale:b-boy': 1,
      'sale:b-demian': 2,
    });
  });
});
