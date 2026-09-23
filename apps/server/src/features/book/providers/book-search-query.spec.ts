import {
  buildAdjacentProbe,
  buildCountQuery,
  buildSearchQuery,
  canMatchAdjacent,
  escapeLike,
  normalizeForSearch,
  SEARCH_KEY_SQL,
  searchColumnsFor,
  tokenize,
} from './book-search-query';

const KEYWORD = searchColumnsFor('Keyword');

function page(
  query: string,
  overrides: Partial<Parameters<typeof buildSearchQuery>[0]> = {},
) {
  return buildSearchQuery({
    tokens: tokenize(query),
    columns: KEYWORD,
    sort: 'sim',
    adjacent: false,
    limit: 20,
    offset: 0,
    ...overrides,
  });
}

describe('book-search-query', () => {
  describe('SEARCH_KEY_SQL', () => {
    /**
     * 운영 인덱스 `IDX_books_search_key_trgm`과 같은 식이어야 플래너가 인덱스를 쓴다.
     * 한 글자라도 다르면 에러 없이 전체를 훑는다. 바꾸려면 인덱스도 다시 만들어야 한다.
     */
    it('운영 인덱스 식과 같다', () => {
      const column = (c: string) =>
        `lower(regexp_replace(book.${c}, '[^[:alnum:]]+', '', 'g'))`;
      expect(SEARCH_KEY_SQL).toBe(
        `${column('title')} || ' ' || ${column('author')} || ' ' || ${column('publisher')}`,
      );
    });
  });

  describe('searchColumnsFor', () => {
    it('Publisher 검색은 publisher 컬럼만 본다', () => {
      expect(searchColumnsFor('Publisher')).toEqual(['publisher']);
    });

    it('Title / Author는 해당 컬럼만 본다', () => {
      expect(searchColumnsFor('Title')).toEqual(['title']);
      expect(searchColumnsFor('Author')).toEqual(['author']);
    });

    it('Keyword와 모르는 값은 세 컬럼을 통합해서 본다', () => {
      expect(KEYWORD).toEqual(['title', 'author', 'publisher']);
      expect(
        searchColumnsFor('Unknown' as Parameters<typeof searchColumnsFor>[0]),
      ).toEqual(['title', 'author', 'publisher']);
    });
  });

  describe('escapeLike', () => {
    /** 이스케이프하지 않으면 "50%"가 "50으로 시작하는 모든 것"이 된다. */
    it('와일드카드 문자를 무력화한다', () => {
      expect(escapeLike('50%')).toBe('50\\%');
      expect(escapeLike('a_b')).toBe('a\\_b');
      expect(escapeLike('back\\slash')).toBe('back\\\\slash');
    });
  });

  describe('normalizeForSearch', () => {
    it('공백·기호를 지우고 소문자로 바꾼다 — DB 정규화와 같은 규칙', () => {
      expect(normalizeForSearch('사탄 탱고!(2025) Harry-Potter')).toBe(
        '사탄탱고2025harrypotter',
      );
    });

    /** 운영 로케일의 [:alnum:]은 ①·Ⅱ를 지운다(2026-09-23 실측). */
    it('기호형 숫자는 지우고 한글 자모는 남긴다', () => {
      expect(normalizeForSearch('① Ⅱ ㄱ')).toBe('ㄱ');
    });
  });

  describe('tokenize', () => {
    it('공백으로 나누고 단어마다 원문과 정규화 값을 둔다', () => {
      expect(tokenize('  라슬로   사탄 ')).toEqual([
        { raw: '라슬로', norm: '라슬로' },
        { raw: '사탄', norm: '사탄' },
      ]);
      expect(tokenize('c++')).toEqual([{ raw: 'c++', norm: 'c' }]);
    });

    /** 기호뿐인 단어를 남기면 LIKE '%%'가 되어 모든 도서가 걸린다. */
    it('기호뿐인 단어와 중복은 버린다', () => {
      expect(tokenize('!!! - &')).toEqual([]);
      expect(tokenize('사탄 사탄 ~')).toEqual([{ raw: '사탄', norm: '사탄' }]);
    });

    it('단어는 8개까지만 쓴다', () => {
      expect(tokenize('가 나 다 라 마 바 사 아 자 차')).toHaveLength(8);
    });
  });

  describe('canMatchAdjacent', () => {
    it('짧은 단어로만 된 여러 단어 검색에서만 켠다', () => {
      expect(canMatchAdjacent(tokenize('해리 포터'))).toBe(true);
      expect(canMatchAdjacent(tokenize('사탄'))).toBe(false);
      expect(canMatchAdjacent(tokenize('소년이 온다'))).toBe(false);
      // 이어 붙여도 2글자면 인덱스를 못 탄다
      expect(canMatchAdjacent(tokenize('a b'))).toBe(false);
    });
  });

  describe('검색 조건', () => {
    /** 띄어쓰기가 달라도("사탄 탱고" vs 『사탄탱고』) 같은 검색 키로 비교해야 찾는다. */
    it('3글자 이상 단어는 정규화한 검색 키로 찾는다 — 인덱스를 탄다', () => {
      const { sql, params } = page('라슬로 사탄탱고');
      expect(sql).toContain(`(${SEARCH_KEY_SQL}) LIKE $1`);
      expect(sql).toContain(`(${SEARCH_KEY_SQL}) LIKE $2`);
      expect(params.slice(0, 2)).toEqual(['%라슬로%', '%사탄탱고%']);
    });

    /** 정규화하면 "c++"가 "c"가 되어 수천 건이 걸린다(실측 7건 → 4,164건). */
    it('짧은 단어는 원문 그대로 컬럼에 ILIKE — 이스케이프한다', () => {
      const { sql, params } = page('c++ 50%');
      expect(sql).toContain(
        '(book.title ILIKE $1 OR book.author ILIKE $1 OR book.publisher ILIKE $1)',
      );
      expect(params.slice(0, 2)).toEqual(['%c++%', '%50\\%%']);
    });

    it('adjacent면 붙여 쓴 형태 하나로만 찾는다', () => {
      const { sql, params } = page('해리 포터', { adjacent: true });
      expect(sql).toContain(`(${SEARCH_KEY_SQL}) LIKE $1`);
      expect(sql).not.toContain('ILIKE');
      expect(params[0]).toBe('%해리포터%');
    });

    /** 출판사 검색은 검색 키로 좁히되, 제목에만 그 말이 있는 책은 빼야 한다. */
    it('단일 필드 검색은 그 필드에 실제로 있는지 다시 본다', () => {
      const { sql, params } = page('문학동네', {
        columns: searchColumnsFor('Publisher'),
      });
      expect(sql).toContain(`(${SEARCH_KEY_SQL}) LIKE $1`);
      expect(sql).toContain(
        "strpos(lower(regexp_replace(book.publisher, '[^[:alnum:]]+', '', 'g')), $2) > 0",
      );
      expect(params.slice(0, 2)).toEqual(['%문학동네%', '문학동네']);

      const short = page('창비', { columns: searchColumnsFor('Publisher') });
      expect(short.sql).toContain('(book.publisher ILIKE $1)');
      expect(short.sql).not.toContain('book.title ILIKE');
    });
  });

  describe('관련도 정렬', () => {
    const rankOf = (sql: string, test: string) => {
      const match = sql.match(
        new RegExp(
          `WHEN ${test.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} THEN (\\d+)`,
        ),
      );
      return match ? Number(match[1]) : null;
    };

    /**
     * "민음사"를 치면 제목에 그 말이 든 전집 세트 12권이 아니라 그 출판사 책이
     * 나와야 한다. 운영 실측에서 세트(지수 203)가 싯다르타(319,512)를 눌렀다.
     */
    it('출판사 완전일치가 제목 접두·부분일치보다 앞선다', () => {
      const { sql } = page('민음사');
      const joined = '$2';
      expect(rankOf(sql, `hit.n_title = ${joined}`)).toBe(0);
      expect(rankOf(sql, `hit.n_publisher = ${joined}`)).toBe(1);
      expect(rankOf(sql, `starts_with(hit.n_title, ${joined})`)).toBe(2);
      expect(rankOf(sql, `strpos(hit.n_title, ${joined}) > 0`)).toBe(3);
    });

    /** 저자는 표기가 섞여 있어(`김영하` / `김영하 (지은이)`) 승격하지 않는다. */
    it('저자 완전일치는 제목 부분일치보다 뒤에 둔다', () => {
      const { sql } = page('김영하');
      expect(rankOf(sql, 'hit.n_author = $2')).toBe(4);
      expect(sql).toContain('ELSE 9 END');
    });

    it('여러 단어면 제목에 흩어진 경우를 저자보다 앞에 둔다', () => {
      const { sql, params } = page('그리스 신화');
      // $1·$2: 조건, $3: 붙인 값, $4·$5: 단어
      expect(params.slice(2, 5)).toEqual(['그리스신화', '그리스', '신화']);
      expect(
        rankOf(
          sql,
          'strpos(hit.n_title, $4) > 0 AND strpos(hit.n_title, $5) > 0',
        ),
      ).toBe(4);
      expect(rankOf(sql, 'hit.n_author = $3')).toBe(5);
    });

    it('정규화 값은 CTE에서 한 번만 계산한다', () => {
      const { sql } = page('사랑');
      expect(sql).toContain('WITH hit AS MATERIALIZED');
      expect(sql).toContain(
        "lower(regexp_replace(book.title, '[^[:alnum:]]+', '', 'g')) AS n_title",
      );
    });

    it('단일 필드 검색은 그 필드 안에서만 순위를 매긴다', () => {
      const { sql } = page('문학동네', {
        columns: searchColumnsFor('Publisher'),
      });
      expect(rankOf(sql, 'hit.n_publisher = $3')).toBe(0);
      expect(rankOf(sql, 'starts_with(hit.n_publisher, $3)')).toBe(1);
      expect(sql).toContain('ELSE 3 END');
      expect(sql).not.toContain('n_title');
    });

    /**
     * 흔한 키워드는 대부분 하나의 관련도 버킷에 뭉쳐 두 번째 정렬 키가 체감 순서를
     * 정한다. 전에 쓰던 viewCount는 도서의 75%가 0이라 스테디셀러가 바닥에 깔렸다.
     */
    it('관련도 다음은 판매지수, 마지막은 isbn이다', () => {
      const { sql } = page('사랑');
      expect(sql).toMatch(
        /END, hit\."salesPoint" DESC NULLS LAST, hit\.isbn ASC\s+LIMIT/,
      );
      expect(sql).not.toContain('viewCount');
    });
  });

  describe('신간순', () => {
    it('예약 판매를 뒤로 보내고 출간일 → 판매지수 → isbn 순이다', () => {
      const { sql } = page('사랑', { sort: 'date' });
      expect(sql).toContain(
        'ORDER BY (hit."pubDate" <= CURRENT_DATE) DESC NULLS LAST, hit."pubDate" DESC NULLS LAST, hit."salesPoint" DESC NULLS LAST, hit.isbn ASC',
      );
      expect(sql).not.toContain('CASE');
      expect(sql).not.toContain('n_title');
    });
  });

  describe('매개변수', () => {
    /**
     * 쓰지 않는 매개변수를 넘기면 Postgres가 "could not determine data type of
     * parameter"로 쿼리 전체를 거절한다. 단위 테스트가 SQL을 실행하지 않아 놓치기 쉽다.
     */
    it.each([
      ['해리포터', 'Keyword', 'sim', false],
      ['그리스 로마 신화', 'Keyword', 'sim', false],
      ['해리 포터', 'Keyword', 'sim', true],
      ['c++ 프로그래밍', 'Keyword', 'sim', false],
      ['문학동네', 'Publisher', 'sim', false],
      ['창비 문학', 'Publisher', 'sim', false],
      ['사랑', 'Keyword', 'date', false],
    ] as const)(
      '%s (%s·%s)는 넘긴 매개변수를 전부 쓴다',
      (query, field, sort, adjacent) => {
        const { sql, params } = page(query, {
          columns: searchColumnsFor(field),
          sort,
          adjacent,
        });
        const used = new Set(
          [...sql.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])),
        );
        expect([...used].sort((a, b) => a - b)).toEqual(
          params.map((_, i) => i + 1),
        );
      },
    );
  });

  describe('페이지와 건수', () => {
    it('한 쿼리에서 한 페이지와 전체 건수를 함께 가져온다', () => {
      const { sql, params } = page('사랑', { limit: 10, offset: 30 });
      expect(sql).toContain('count(*) OVER () AS total');
      expect(params.slice(-2)).toEqual([10, 30]);
    });

    it('건수·존재 확인 쿼리는 같은 조건을 쓴다', () => {
      const tokens = tokenize('해리 포터');
      const count = buildCountQuery({
        tokens,
        columns: KEYWORD,
        adjacent: true,
      });
      const probe = buildAdjacentProbe(tokens, KEYWORD);
      expect(count.sql).toContain(`(${SEARCH_KEY_SQL}) LIKE $1`);
      expect(probe.sql).toMatch(/LIKE \$1 LIMIT 1$/);
      expect(count.params).toEqual(['%해리포터%']);
      expect(probe.params).toEqual(['%해리포터%']);
    });
  });
});
