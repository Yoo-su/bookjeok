import { BookSearchField, BookSortParam } from '@bookjeok/core';

/** 검색 대상이 될 수 있는 `books` 컬럼. */
export type BookSearchColumn = 'title' | 'author' | 'publisher';

const COLUMNS_BY_FIELD: Record<BookSearchField, readonly BookSearchColumn[]> = {
  Title: ['title'],
  Author: ['author'],
  Publisher: ['publisher'],
  // 통합 검색. 배열 순서가 곧 관련도 우선순위다. KEYWORD_RELEVANCE_ORDER 참조.
  Keyword: ['title', 'author', 'publisher'],
};

/**
 * 검색 필드에 따라 조회할 컬럼을 반환합니다.
 * 이 값을 무시하면 출판사 검색(도서 상세의 같은 출판사 책)이 통합 검색이 되어
 * 제목에 출판사명이 든 책까지 섞입니다.
 * @param field 검색 필드
 * @returns 조회 대상 컬럼 목록 (우선순위 순)
 */
export function searchColumnsFor(
  field: BookSearchField,
): readonly BookSearchColumn[] {
  return COLUMNS_BY_FIELD[field] ?? COLUMNS_BY_FIELD.Keyword;
}

/**
 * 검색어의 %와 _가 ILIKE 와일드카드로 동작하지 않도록 이스케이프합니다.
 * Postgres의 LIKE 기본 이스케이프 문자가 백슬래시라 별도 ESCAPE 절은 필요 없습니다.
 * @param value 사용자 검색어
 * @returns 이스케이프된 검색어
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** 검색어의 한 단어. `norm`은 공백·기호를 뺀 소문자, `raw`는 입력 그대로입니다. */
export interface SearchToken {
  raw: string;
  norm: string;
}

/** 단어 수 상한. 긴 문장을 붙여 넣어도 조건 수가 묶이도록 합니다. */
const MAX_TOKENS = 8;

/**
 * pg_trgm이 LIKE 패턴에서 트라이그램을 뽑으려면 3글자가 필요합니다.
 * 이보다 짧은 단어는 인덱스가 걸러 주지 못해 테이블을 훑습니다.
 */
export const TRIGRAM_MIN_LENGTH = 3;

/**
 * DB 정규화(`[^[:alnum:]]` 제거 + `lower`)를 앱에서 흉내 냅니다.
 * 운영 로케일(en_US.UTF-8)의 `[:alnum:]`은 글자와 십진 숫자만 남기고
 * ①·Ⅱ 같은 기호형 숫자는 지웁니다(2026-09-23 실측). 그래서 `\p{Nd}`만 씁니다.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{Nd}]+/gu, '');
}

/**
 * 검색어를 공백으로 나눠 단어 목록을 만듭니다. 정규화하면 비는 단어(기호뿐)와
 * 중복은 버립니다. 결과가 비면 검색하지 않습니다.
 */
export function tokenize(query: string): SearchToken[] {
  const tokens: SearchToken[] = [];
  const seen = new Set<string>();
  for (const raw of query.trim().split(/\s+/)) {
    const norm = normalizeForSearch(raw);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    tokens.push({ raw, norm });
    if (tokens.length === MAX_TOKENS) break;
  }
  return tokens;
}

const isShort = (token: SearchToken) =>
  [...token.norm].length < TRIGRAM_MIN_LENGTH;

/** 공백 없이 이어 붙인 검색어. "사탄 탱고" → "사탄탱고". */
export const joinedNorm = (tokens: SearchToken[]) =>
  tokens.map((t) => t.norm).join('');

/**
 * 짧은 단어로만 된 여러 단어 검색인지. "해리 포터"·"사탄 탱고"처럼 한국어에 흔합니다.
 * 이런 검색은 먼저 붙여 쓴 형태로 인덱스를 태워 보고, 없을 때만 단어별로 찾습니다.
 * 단어별 검색은 인덱스를 못 타 전체를 훑기 때문입니다(실측 43ms → 365ms).
 */
export function canMatchAdjacent(tokens: SearchToken[]): boolean {
  return (
    tokens.length > 1 &&
    tokens.every(isShort) &&
    [...joinedNorm(tokens)].length >= TRIGRAM_MIN_LENGTH
  );
}

/** 컬럼을 공백·기호 없는 소문자로 바꾸는 식. */
const normalizedColumnSql = (column: BookSearchColumn) =>
  `lower(regexp_replace(book.${column}, '[^[:alnum:]]+', '', 'g'))`;

/**
 * 운영 인덱스 `IDX_books_search_key_trgm`과 **문자 하나까지 같은 식**입니다.
 * 이 식을 조금이라도 바꾸면 플래너가 인덱스를 알아보지 못하고 전체를 훑습니다.
 * 인덱스 정의는 `docs/manual-ddl-log.md` 10절에 있습니다.
 *
 * 필드 사이에 공백을 두는 이유는 한 단어가 두 필드에 걸쳐 맞지 않게 하려는 것입니다.
 * 필드 안의 공백은 지워지므로 "사탄 탱고"와 "사탄탱고"가 같은 값이 됩니다.
 */
export const SEARCH_KEY_SQL = (['title', 'author', 'publisher'] as const)
  .map(normalizedColumnSql)
  .join(" || ' ' || ");

/** docs/ddl/2026-10-29-book-discovery-index.sql과 같은 식이어야 한다. */
export const SEARCH_DOCUMENT_SQL = (
  [
    ['title', 'A'],
    ['author', 'B'],
    ['publisher', 'C'],
    ['description', 'D'],
  ] as const
)
  .map(
    ([column, weight]) =>
      `setweight(to_tsvector('simple', coalesce(book.${column}, '')), '${weight}')`,
  )
  .join(' || ');

export const SEARCH_DOCUMENT_INDEX = 'IDX_books_search_document_gin';

const AUTHOR_NAMES_SQL =
  "regexp_split_to_array(lower(regexp_replace(regexp_replace(book.author, '\\([^)]*\\)', '', 'g'), '[^[:alnum:],;/]+', '', 'g')), '[,;/]+')";

/** 위치 매개변수($1, $2 …)를 모으는 도우미. */
class Params {
  readonly values: unknown[] = [];

  add(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
}

/**
 * 검색 조건. 모든 단어가 들어 있는 책만 남깁니다.
 * - 3글자 이상 단어: 정규화한 검색 키에 LIKE — 인덱스를 탑니다.
 * - 짧은 단어: 원래 입력 그대로 컬럼에 LIKE/ILIKE. 정규화하면 `c++`가 `c`가 되어
 *   수천 건이 걸리기 때문입니다(실측 7건 → 4,164건).
 * - adjacent: 붙여 쓴 형태 하나로만 찾습니다(canMatchAdjacent 참조).
 * 단일 필드 검색이면 검색 키로 좁힌 뒤 그 필드에 실제로 있는지 다시 봅니다.
 */
function matchConditions(
  tokens: SearchToken[],
  columns: readonly BookSearchColumn[],
  adjacent: boolean,
  params: Params,
): string[] {
  const singleColumn = columns.length === 1 ? columns[0] : null;
  const byKey = (norm: string) => {
    const conditions = [`(${SEARCH_KEY_SQL}) LIKE ${params.add(`%${norm}%`)}`];
    if (singleColumn) {
      conditions.push(
        `strpos(${normalizedColumnSql(singleColumn)}, ${params.add(norm)}) > 0`,
      );
    }
    return conditions;
  };

  if (adjacent) return byKey(joinedNorm(tokens));

  return tokens.flatMap((token) => {
    if (!isShort(token)) return byKey(token.norm);
    const like = params.add(`%${escapeLike(token.raw)}%`);
    // 한글·ASCII 숫자에는 대소문자가 없다. ILIKE의 행 전체 소문자 변환을 생략한다.
    // 영문·다른 문자·기호는 로케일별 대소문자와 원문 의미를 보존한다.
    const operator = /^[\p{Script=Hangul}0-9]+$/u.test(token.raw)
      ? 'LIKE'
      : 'ILIKE';
    return [
      `(${columns.map((c) => `book.${c} ${operator} ${like}`).join(' OR ')})`,
    ];
  });
}

/** 일치 강도. */
type MatchKind = 'exact' | 'prefix' | 'contains' | 'allTokens';

/**
 * 통합 검색의 관련도 순위. 앞에 올수록 상위이며, 비교는 정규화한 값끼리 합니다.
 *
 * **출판사 완전일치가 제목 접두·부분일치보다 위에 있는 것이 이 배열의 요점입니다.**
 * 근거는 `docs/book-data-migration-plan.md` 8-d에 있습니다.
 */
const KEYWORD_RELEVANCE_ORDER: ReadonlyArray<
  readonly [BookSearchColumn, MatchKind]
> = [
  ['title', 'exact'],
  // "민음사"처럼 출판사명을 그대로 친 검색은 그 출판사 책을 보려는 의도다.
  // 제목에 출판사명이 든 전집 세트가 카탈로그 전체를 밀어내면 안 된다.
  ['publisher', 'exact'],
  ['title', 'prefix'],
  ['title', 'contains'],
  // 단어가 제목에 흩어져 있는 경우("그리스 신화" → "그리스 로마 신화").
  ['title', 'allTokens'],
  // 저자는 승격하지 않는다. `김영하` / `김영하 (지은이)`로 표기가 섞여 있어
  // (괄호 13% · 다중저자 15%) 완전일치 티어가 한 저자의 책을 갈라놓는다.
  ['author', 'exact'],
  ['author', 'prefix'],
  ['author', 'contains'],
  ['publisher', 'prefix'],
  ['publisher', 'contains'],
];

const SINGLE_FIELD_KINDS: readonly MatchKind[] = [
  'exact',
  'prefix',
  'contains',
  'allTokens',
];

/**
 * 관련도 정렬용 CASE 식. 값이 낮을수록 상위입니다. 알라딘의 Sort=Accuracy를
 * 대신합니다. 정규화한 컬럼은 CTE에서 한 번만 계산해 둔 `hit.n_<컬럼>`을 씁니다.
 * 여러 단어 중 하나가 저자 이름과 정확히 맞고 나머지가 제목에 맞는 조합을
 * 제목 접두일치보다 먼저 평가합니다. 단순 저자 부분일치는 승격하지 않습니다.
 */
function relevanceCaseSql(
  tokens: SearchToken[],
  columns: readonly BookSearchColumn[],
  params: Params,
): string {
  const order =
    columns.length === 1
      ? SINGLE_FIELD_KINDS.map((kind) => [columns[0], kind] as const)
      : KEYWORD_RELEVANCE_ORDER.filter(([column]) => columns.includes(column));
  // 한 단어 검색에서 allTokens는 contains와 같아 뺍니다.
  const effective = order.filter(
    ([, kind]) => kind !== 'allTokens' || tokens.length > 1,
  );

  // 쓰지 않는 매개변수를 넘기면 Postgres가 타입을 못 정해 쿼리 전체가 실패합니다.
  const joined = params.add(joinedNorm(tokens));
  const tokenParams = effective.some(([, kind]) => kind === 'allTokens')
    ? tokens.map((t) => params.add(t.norm))
    : [];
  const test = (column: BookSearchColumn, kind: MatchKind) => {
    const value = `hit.n_${column}`;
    switch (kind) {
      case 'exact':
        return `${value} = ${joined}`;
      case 'prefix':
        return `starts_with(${value}, ${joined})`;
      case 'contains':
        return `strpos(${value}, ${joined}) > 0`;
      case 'allTokens':
        return tokenParams
          .map((p) => `strpos(${value}, ${p}) > 0`)
          .join(' AND ');
    }
  };

  const tests = effective.map(([column, kind]) => test(column, kind));
  if (
    tokens.length > 1 &&
    columns.includes('author') &&
    columns.includes('title')
  ) {
    const combinations = tokenParams.flatMap((author, index) => {
      if ([...tokens[index].norm].length < 2) return [];
      const title = tokenParams
        .filter((_, i) => i !== index)
        .map((p) => `strpos(hit.n_title, ${p}) > 0`)
        .join(' AND ');
      return [`(${author} = ANY(hit.author_names) AND ${title})`];
    });
    if (combinations.length > 0) {
      // 원문 제목·출판사 완전일치는 보존하고, 작가 이름을 언급한 해설서와 구분한다.
      const beforePrefix = effective.findIndex(
        ([column, kind]) => column === 'title' && kind === 'prefix',
      );
      tests.splice(beforePrefix, 0, combinations.join(' OR '));
    }
  }
  const branches = tests.map(
    (condition, rank) => `WHEN ${condition} THEN ${rank}`,
  );
  return `CASE ${branches.join(' ')} ELSE ${branches.length} END`;
}

/**
 * 아직 오지 않은 출간일을 뒤로 미는 정렬 키입니다.
 *
 * `books`에는 예약 판매 도서의 미래 출간일이 22건 있습니다(최대 2030-12-31).
 * 그냥 pubDate DESC로 두면 신간순 1페이지를 이것들이 통째로 차지합니다.
 * 걸러내지 않고 뒤로만 미는 이유는 예약 판매도 정상 도서라 검색 결과에서
 * 사라지면 안 되기 때문입니다.
 *
 * NULLS LAST를 빼면 pubDate가 없는 276건이 Postgres 기본값(DESC → NULLS FIRST)
 * 때문에 맨 앞으로 올라옵니다.
 */
const PUBLISHED_FIRST_SQL = 'hit."pubDate" <= CURRENT_DATE';

export interface SearchQueryOptions {
  tokens: SearchToken[];
  columns: readonly BookSearchColumn[];
  sort: BookSortParam;
  /** canMatchAdjacent이고 붙여 쓴 형태가 실제로 있을 때만 true. */
  adjacent: boolean;
  limit: number;
  offset: number;
  /** 원문을 보존한 채 요청 표현·조사를 완화한 서지 후보. */
  expandedTokens?: SearchToken[];
  /** ISBN 정확 후보를 더하되 같은 숫자가 든 기존 서지 결과도 유지한다. */
  exactIsbn?: string;
  /** 준비된 GIN 인덱스가 있을 때만 전달하는, 매개변수화한 tsquery. */
  discoveryQuery?: string;
}

export interface SqlQuery {
  sql: string;
  params: unknown[];
}

function metadataWhere(
  options: Pick<
    SearchQueryOptions,
    'tokens' | 'columns' | 'adjacent' | 'expandedTokens' | 'exactIsbn'
  >,
  params: Params,
): string {
  const original = matchConditions(
    options.tokens,
    options.columns,
    options.adjacent,
    params,
  ).join(' AND ');
  if (!options.expandedTokens?.length && !options.exactIsbn) return original;
  const candidates = [`SELECT book.isbn FROM books book WHERE ${original}`];
  if (options.expandedTokens?.length) {
    const expanded = matchConditions(
      options.expandedTokens,
      options.columns,
      false,
      params,
    ).join(' AND ');
    candidates.push(`SELECT book.isbn FROM books book WHERE ${expanded}`);
  }
  if (options.exactIsbn) {
    candidates.push(
      `SELECT book.isbn FROM books book WHERE book.isbn = ${params.add(options.exactIsbn)}`,
    );
  }
  // 인덱스를 타는 원문과 짧은 완화어를 OR로 묶으면 정규화 식까지 전체 스캔한다.
  return `book.isbn IN (${candidates.join('\nUNION\n')})`;
}

function candidateCte(
  where: string,
  discovery: string,
  identity: string,
  withSortFields = false,
): string {
  const query = `to_tsquery('simple', ${discovery})`;
  // 후보 수집 시 읽은 서지를 재사용해 후보마다 books를 PK로 다시 읽지 않는다.
  const fields = withSortFields
    ? 'book.isbn, book.author, book.publisher, book.title, book."salesPoint", book."pubDate"'
    : 'book.isbn, book.author, book.publisher';
  return `metadata AS MATERIALIZED (
  SELECT ${fields} FROM books book WHERE ${where}
), exact_entity AS MATERIALIZED (
  SELECT EXISTS (
    SELECT 1 FROM metadata book
    WHERE ${normalizedColumnSql('publisher')} = ${identity}
       OR ${identity} = ANY(${AUTHOR_NAMES_SQL})
  ) AS matched
), matched AS (
  SELECT ${withSortFields ? '*' : 'isbn'} FROM metadata
  UNION ALL
  SELECT ${withSortFields ? fields : 'book.isbn'}
    FROM books book WHERE NOT (SELECT matched FROM exact_entity)
      AND (${SEARCH_DOCUMENT_SQL}) @@ ${query}
      AND NOT EXISTS (SELECT 1 FROM metadata WHERE metadata.isbn = book.isbn)
)`;
}

/**
 * 한 페이지의 ISBN과 전체 건수를 한 번에 가져오는 쿼리.
 *
 * 걸린 행은 MATERIALIZED CTE에 담습니다. 물리화하지 않으면 플래너가 CTE를 펼쳐
 * 정렬 CASE 가지마다 정규화(regexp_replace)를 다시 계산합니다(1글자 검색 936ms →
 * 402ms). 건수는 `count(*) OVER ()`로 같은 스캔에서 셉니다. 따로 COUNT를 돌리면
 * 인덱스를 못 타는 짧은 검색어가 테이블을 두 번 훑습니다.
 *
 * 소개 검색의 관련도는 작은 scored CTE에 한 번 저장해 200권 선정과 최종 정렬에서
 * 재사용합니다. 정규화 문자열을 최종 창 함수까지 운반하지 않습니다.
 * 정렬 순서가 흔들리면 OFFSET 페이지네이션에서 중복과 누락이 생기므로 마지막
 * 키는 항상 isbn입니다. 소개 검색은 전체 후보를 유지하되, 서지 관련도·판매지수로
 * 고른 200권만 소개 점수를 다시 계산합니다. 나머지는 서지 관련도·판매지수 순입니다.
 */
export function buildSearchQuery(options: SearchQueryOptions): SqlQuery {
  const { tokens, columns, sort, adjacent, limit, offset } = options;
  const params = new Params();
  const where = metadataWhere(
    { ...options, tokens, columns, adjacent },
    params,
  );
  const discovery = options.discoveryQuery
    ? params.add(options.discoveryQuery)
    : undefined;
  const identity = discovery ? params.add(joinedNorm(tokens)) : undefined;

  const byDate = sort === 'date';
  let normalized = byDate
    ? ''
    : columns.map((c) => `, ${normalizedColumnSql(c)} AS n_${c}`).join('');
  if (
    !byDate &&
    tokens.length > 1 &&
    columns.includes('author') &&
    columns.includes('title')
  ) {
    normalized += `, ${AUTHOR_NAMES_SQL} AS author_names`;
  }
  const relevance = byDate ? [] : [relevanceCaseSql(tokens, columns, params)];
  if (!byDate && options.expandedTokens?.length) {
    relevance.push(relevanceCaseSql(options.expandedTokens, columns, params));
  }
  // 상위 200권 선정과 최종 정렬이 같은 관련도 값을 공유한다.
  const cacheRelevance = !byDate && !!discovery;
  const orderBy = byDate
    ? [
        `(${PUBLISHED_FIRST_SQL}) DESC NULLS LAST`,
        'hit."pubDate" DESC NULLS LAST',
      ]
    : relevance.map((sql, index) =>
        cacheRelevance ? `hit.relevance_${index}` : sql,
      );
  if (!byDate && options.exactIsbn) {
    orderBy.unshift(`(hit.isbn = ${params.add(options.exactIsbn)}) DESC`);
  }
  orderBy.push('hit."salesPoint" DESC NULLS LAST', 'hit.isbn ASC');

  // 후보·전체 건수는 자르지 않는다. 비싼 소개 재분석만 고정된 200권에 제한한다.
  const rerank =
    !byDate && discovery
      ? `, scored AS MATERIALIZED (
  SELECT hit.isbn, hit."salesPoint", ${relevance.map((sql, index) => `${sql} AS relevance_${index}`).join(', ')} FROM hit
), shortlist AS MATERIALIZED (
  SELECT hit.isbn FROM scored hit ORDER BY ${orderBy.join(', ')} LIMIT 200
), ranked AS MATERIALIZED (
  SELECT book.isbn, ts_rank_cd((${SEARCH_DOCUMENT_SQL}), to_tsquery('simple', ${discovery}), 32) AS content_score
  FROM books book JOIN shortlist ON shortlist.isbn = book.isbn
  WHERE NOT (SELECT matched FROM exact_entity)
)`
      : '';
  if (rerank) {
    orderBy.splice(
      orderBy.length - 2,
      0,
      '(ranked.isbn IS NULL) ASC',
      'ranked.content_score DESC NULLS LAST',
    );
  }

  const sql = `WITH ${discovery && identity ? `${candidateCte(where, discovery, identity, true)},\n` : ''}hit AS MATERIALIZED (
  SELECT book.isbn, book."salesPoint", book."pubDate"${normalized}
    FROM ${discovery ? 'matched' : 'books'} book
   ${discovery ? '' : `WHERE ${where}`}
)${rerank}
SELECT hit.isbn, count(*) OVER () AS total
  FROM ${cacheRelevance ? 'scored hit' : 'hit'}
  ${rerank ? 'LEFT JOIN ranked ON ranked.isbn = hit.isbn' : ''}
 ORDER BY ${orderBy.join(', ')}
 LIMIT ${params.add(limit)} OFFSET ${params.add(offset)}`;
  return { sql, params: params.values };
}

/** 페이지가 비었을 때만 쓰는 건수 쿼리. 마지막 페이지를 넘긴 요청에서 필요합니다. */
export function buildCountQuery(
  options: Pick<
    SearchQueryOptions,
    | 'tokens'
    | 'columns'
    | 'adjacent'
    | 'expandedTokens'
    | 'exactIsbn'
    | 'discoveryQuery'
  >,
): SqlQuery {
  const params = new Params();
  const where = metadataWhere(options, params);
  if (options.discoveryQuery) {
    const discovery = params.add(options.discoveryQuery);
    const identity = params.add(joinedNorm(options.tokens));
    return {
      sql: `WITH ${candidateCte(where, discovery, identity)} SELECT count(*) AS total FROM matched`,
      params: params.values,
    };
  }
  return {
    sql: `SELECT count(*) AS total FROM books book WHERE ${where}`,
    params: params.values,
  };
}

/** 붙여 쓴 형태가 하나라도 있는지. 인덱스로 한 행만 확인합니다. */
export function buildAdjacentProbe(
  tokens: SearchToken[],
  columns: readonly BookSearchColumn[],
): SqlQuery {
  const params = new Params();
  const where = matchConditions(tokens, columns, true, params).join(' AND ');
  return {
    sql: `SELECT 1 FROM books book WHERE ${where} LIMIT 1`,
    params: params.values,
  };
}
