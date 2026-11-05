import { cleanHtmlText } from '@bookjeok/core';

import {
  escapeLike,
  tokenize,
} from '@/features/book/providers/book-search-query';

export interface PreviewSqlQuery {
  sql: string;
  params: unknown[];
}

/** 미리보기 검색어 단어 수 상한. 단어마다 모든 필드를 훑으므로 조건 수를 묶는다 */
const MAX_TERMS = 5;

/** 판매글 미리보기에 보이는 상태. 판매완료는 찾아도 살 수 없다 */
export const PREVIEW_SALE_STATUSES = ['FOR_SALE', 'RESERVED'] as const;

/**
 * 검색어를 단어로 나눈다. 앞뒤 문장부호는 떼고(「한강,」→「한강」) 중복은 버린다.
 * 도서 검색의 `tokenize`와 같은 기준(공백 분리·8단어)을 따른 뒤 다시 줄인다.
 */
export function previewTerms(query: string): string[] {
  const terms: string[] = [];
  for (const { raw } of tokenize(query)) {
    const term = raw
      .normalize('NFC')
      .replace(/^[^\p{L}\p{Nd}]+|[^\p{L}\p{Nd}]+$/gu, '');
    if (term && !terms.some((t) => t.toLowerCase() === term.toLowerCase())) {
      terms.push(term);
    }
    if (terms.length === MAX_TERMS) break;
  }
  return terms;
}

/**
 * 리뷰 본문(HTML)을 검색용 순수 텍스트로. 태그를 공백으로 바꾸고 흔한 엔티티만 푼다.
 * `ILIKE`를 HTML에 바로 걸면 `strong`·`style`·`color` 같은 마크업이 걸린다
 * (2026-11-05 운영 실측: `strong` 62건 중 실제 글자 0건).
 * 엔티티를 푼 뒤 태그를 한 번 더 지운다. 붙여 넣은 마크업이 `&lt;span …&gt;`로 이스케이프돼
 * 본문에 남은 리뷰가 있다(78건 중 1건). 미리보기 문장을 만드는 `cleanHtmlText`와 결과를 맞춘다.
 */
export const REVIEW_TEXT_SQL = `regexp_replace(
      replace(replace(replace(replace(replace(
        regexp_replace(r.content, '<[^>]*>', ' ', 'g'),
        '&nbsp;', ' '), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&amp;', '&'),
      '<[^>]*>', ' ', 'g')`;

class Params {
  readonly values: unknown[] = [];
  add(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
}

/** 필드별 가중치. 앞쪽 필드에 걸릴수록 높다. 단어마다 가장 높은 필드 하나만 센다 */
type WeightedField = readonly [sql: string, weight: number];

/**
 * 모든 단어가 어느 필드에든 하나씩 걸려야 한다(AND). 점수는 단어별 최고 가중치의 합.
 */
function matchAndScore(
  terms: string[],
  fields: readonly WeightedField[],
  params: Params,
): { where: string; score: string } {
  // 단어가 없으면 조건이 비어 SQL이 깨진다. 부르는 쪽이 빈 결과로 처리해야 한다
  if (terms.length === 0) throw new Error('검색어 단어가 없습니다');
  const where: string[] = [];
  const score: string[] = [];
  for (const term of terms) {
    const pattern = params.add(`%${escapeLike(term)}%`);
    where.push(
      `(${fields.map(([sql]) => `${sql} ILIKE ${pattern}`).join(' OR ')})`,
    );
    score.push(
      `CASE ${fields
        .map(([sql, weight]) => `WHEN ${sql} ILIKE ${pattern} THEN ${weight}`)
        .join(' ')} ELSE 0 END`,
    );
  }
  return { where: where.join(' AND '), score: score.join(' + ') };
}

const REVIEW_FIELDS: readonly WeightedField[] = [
  ['doc.title', 8],
  ['doc."bookTitle"', 4],
  ['doc.tags', 3],
  ['doc.nickname', 2],
  ['doc.body', 1],
];

/**
 * 공개 리뷰 미리보기.
 * 태그는 조인 대신 하위 질의로 이어 붙인다. 조인하면 행이 태그 수만큼 불어나고
 * (74행 → 150행 실측) 검색 조건이 태그 목록까지 잘라 낸다.
 * 지금 규모(공개 74건)에선 본문 변환을 조회 때 하는 편이 낫다. 수천 건이 되면
 * 순수 텍스트 컬럼과 pg_trgm 인덱스로 옮긴다.
 */
export function buildReviewPreviewQuery(
  terms: string[],
  limit: number,
): PreviewSqlQuery {
  const params = new Params();
  const { where, score } = matchAndScore(terms, REVIEW_FIELDS, params);
  const sql = `WITH doc AS (
  SELECT r.id, r.title, r.rating, r."createdAt",
         coalesce(u.nickname, '') AS nickname,
         coalesce(b.title, '') AS "bookTitle",
         coalesce((SELECT string_agg(t.name, ' ')
                     FROM review_tags rt JOIN tags t ON t.id = rt."tagId"
                    WHERE rt."reviewId" = r.id), '') AS tags,
         ${REVIEW_TEXT_SQL} AS body
    FROM reviews r
    LEFT JOIN users u ON u.id = r."userId"
    LEFT JOIN books b ON b.isbn = r.isbn
   WHERE r."isPublic"
)
SELECT doc.id, doc.title, doc.rating, doc.nickname, doc."bookTitle", doc.body,
       count(*) OVER () AS total
  FROM doc
 WHERE ${where}
 ORDER BY (${score}) DESC, doc."createdAt" DESC, doc.id DESC
 LIMIT ${params.add(limit)}`;
  return { sql, params: params.values };
}

const SALE_FIELDS: readonly WeightedField[] = [
  ['s.title', 8],
  [`coalesce(b.title, '')`, 4],
  [`coalesce(b.author, '')`, 3],
  ['s.content', 1],
];

/** 판매중·예약중 판매글 미리보기. 같은 점수면 판매중을 먼저, 그다음 최신순 */
export function buildSalePreviewQuery(
  terms: string[],
  limit: number,
): PreviewSqlQuery {
  const params = new Params();
  const { where, score } = matchAndScore(terms, SALE_FIELDS, params);
  const statuses = PREVIEW_SALE_STATUSES.map((s) => params.add(s)).join(', ');
  const sql = `SELECT s.id, s.title, s.price, s.status::text AS status,
       s.city, s.district,
       coalesce(b.title, '') AS "bookTitle", b.image,
       count(*) OVER () AS total
  FROM used_book_sales s
  LEFT JOIN books b ON b.isbn = s.isbn
 WHERE s.status::text IN (${statuses}) AND ${where}
 ORDER BY (${score}) DESC, (s.status::text = 'FOR_SALE') DESC,
          s."createdAt" DESC, s.id DESC
 LIMIT ${params.add(limit)}`;
  return { sql, params: params.values };
}

/** 책별 공개 리뷰 수와 판매중·예약중 판매글 수. 두 테이블 모두 isbn 인덱스를 탄다 */
export function buildBookActivityQuery(isbns: string[]): PreviewSqlQuery {
  const params = new Params();
  const list = params.add(isbns);
  const statuses = PREVIEW_SALE_STATUSES.map((s) => params.add(s)).join(', ');
  const sql = `SELECT isbn, 'review' AS kind, count(*)::int AS count
  FROM reviews WHERE "isPublic" AND isbn = ANY(${list}) GROUP BY isbn
UNION ALL
SELECT isbn, 'sale' AS kind, count(*)::int AS count
  FROM used_book_sales WHERE status::text IN (${statuses}) AND isbn = ANY(${list})
 GROUP BY isbn`;
  return { sql, params: params.values };
}

const SNIPPET_LENGTH = 90;
const SNIPPET_LEAD = 18;

/**
 * 본문에서 처음 걸린 단어 앞뒤를 잘라 한 줄 미리보기로 만든다.
 * 걸린 단어가 본문에 없으면(제목·태그로 걸림) 첫머리를 쓴다.
 */
export function buildSnippet(body: string, terms: string[]): string {
  const text = cleanHtmlText(body).replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();
  const hits = terms
    .map((term) => lower.indexOf(term.toLowerCase()))
    .filter((index) => index >= 0);
  const at = hits.length > 0 ? Math.min(...hits) : 0;
  const start = Math.max(0, at - SNIPPET_LEAD);
  const end = Math.min(text.length, start + SNIPPET_LENGTH);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}
