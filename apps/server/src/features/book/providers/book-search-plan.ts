import { BookSearchField } from '@bookjeok/core';

import { normalizeForSearch, SearchToken, tokenize } from './book-search-query';

// 요청 표현만 제거한다. 장르·주제·독자·수준은 검색의 필수 조건으로 남긴다.
const REQUEST_WORDS = new Set([
  '책',
  '도서',
  '추천',
  '추천해줘',
  '추천해주세요',
  '추천해',
  '부탁해',
  '부탁합니다',
  '알려줘',
  '알려주세요',
  '찾아줘',
  '찾아주세요',
  '관련',
  '관한',
  '대한',
  '다룬',
  '다루는',
  '대해서',
  '관해서',
]);

// 형태소 분석기가 아니다. 해석한 값은 원문 검색을 대체하지 않는 확장 후보다.
const PARTICLE =
  /(?:에서|에게|으로|까지|부터|처럼|보다|에는|을|를|은|는|의|에)$/u;

export interface BookSearchPlan {
  tokens: SearchToken[];
  expandedTokens?: SearchToken[];
  discoveryQuery?: string;
}

export function planBookSearch(
  query: string,
  field: BookSearchField,
): BookSearchPlan {
  const tokens = tokenize(query);
  if (field !== 'Keyword' || tokens.length === 0) return { tokens };

  const meaningful = query
    .trim()
    .split(/\s+/)
    .slice(0, 32)
    .filter((word) => !REQUEST_WORDS.has(normalizeForSearch(word)));
  const core = tokenize(meaningful.join(' '));
  if (core.length === 0) return { tokens };

  const expanded = core.map((token) => {
    if (!/^[가-힣]+$/u.test(token.raw)) return token;
    const stem = token.raw.replace(PARTICLE, '');
    return stem.length >= 2
      ? { raw: stem, norm: normalizeForSearch(stem) }
      : token;
  });
  const changed =
    expanded.map((token) => token.raw).join(' ') !==
    tokens.map((token) => token.raw).join(' ');
  const plan: BookSearchPlan = {
    tokens,
    expandedTokens: changed ? expanded : undefined,
  };

  // 기호의 의미를 잃거나 한 글자 접두어로 카탈로그 전체를 넓히지 않는다.
  if (
    core.some((token) => /[+#&%_\\]/u.test(token.raw)) ||
    expanded.some((token) => [...token.norm].length < 2) ||
    (expanded.length === 1 && [...expanded[0].norm].length < 3)
  )
    return plan;

  plan.discoveryQuery = core
    .map((token, index) => {
      const variants = [...new Set([token.norm, expanded[index].norm])];
      const expressions = variants.map((value) => `'${value}':*`);
      return expressions.length === 1
        ? expressions[0]
        : `(${expressions.join(' | ')})`;
    })
    .join(' & ');
  return plan;
}
