import {
  buildReviewPreviewQuery,
  buildSnippet,
  previewTerms,
} from './search-preview-sql';

describe('previewTerms', () => {
  it('앞뒤 문장부호를 떼고 대소문자 중복을 버린다', () => {
    expect(previewTerms('「한강」, 소설! Clean clean')).toEqual([
      '한강',
      '소설',
      'Clean',
    ]);
  });

  it('다섯 단어까지만 쓴다', () => {
    expect(previewTerms('가가 나나 다다 라라 마마 바바')).toHaveLength(5);
  });
});

describe('buildSnippet', () => {
  const body =
    '처음 몇 문장은 그냥 지나갔다. 그런데 중반부터 한강의 문장이 조용히 따라오기 시작했고 끝까지 놓지 않았다. 마지막 장을 덮고도 한참을 앉아 있었다. 다음 날 아침에도 그 장면이 머릿속에서 떠나지 않아 출근길에 다시 펼쳐 읽었다.';

  it('처음 걸린 단어 앞부터 자르고 잘린 쪽에 말줄임표를 붙인다', () => {
    const snippet = buildSnippet(body, ['한강']);
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet).toContain('한강의 문장');
    expect(snippet.endsWith('…')).toBe(true);
  });

  it('본문에 없는 단어로 걸렸으면 첫머리를 쓴다', () => {
    expect(buildSnippet(body, ['노벨상']).startsWith('처음 몇 문장')).toBe(
      true,
    );
  });

  it('남은 엔티티를 풀고 공백을 하나로 줄인다', () => {
    expect(buildSnippet('좋았다 &amp;   &#39;또&#39;', ['좋았다'])).toBe(
      "좋았다 & '또'",
    );
  });
});

describe('buildReviewPreviewQuery', () => {
  it('단어마다 같은 파라미터를 조건과 점수에 함께 쓴다', () => {
    const { sql, params } = buildReviewPreviewQuery(['한강', '50%'], 3);
    expect(params).toEqual(['%한강%', String.raw`%50\%%`, 3]);
    expect(sql.match(/\$1/g)?.length).toBe(10);
  });

  it('단어가 없으면 SQL을 만들지 않는다', () => {
    expect(() => buildReviewPreviewQuery([], 3)).toThrow();
  });
});
