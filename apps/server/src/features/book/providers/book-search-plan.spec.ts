import { planBookSearch } from './book-search-plan';

describe('planBookSearch', () => {
  it('원문을 유지하면서 문장형 검색의 핵심 단서를 만든다', () => {
    const plan = planBookSearch('불안을 다루는 심리학 책', 'Keyword');
    expect(plan.tokens.map((token) => token.raw)).toEqual([
      '불안을',
      '다루는',
      '심리학',
      '책',
    ]);
    expect(plan.expandedTokens?.map((token) => token.raw)).toEqual([
      '불안',
      '심리학',
    ]);
    expect(plan.discoveryQuery).toBe("('불안을':* | '불안':*) & '심리학':*");
  });

  it('정상 제목과 장르·수준·대상 독자 같은 의미 있는 제약은 보존한다', () => {
    const plan = planBookSearch('어린이 철학 입문 소설', 'Keyword');
    expect(plan.discoveryQuery).toContain("'입문':*");
    expect(plan.discoveryQuery).toContain("'소설':*");
    expect(plan.tokens.map((token) => token.raw)).toEqual([
      '어린이',
      '철학',
      '입문',
      '소설',
    ]);
  });

  it('기호 포함 검색과 짧은 한 단어는 소개 검색으로 넓히지 않는다', () => {
    for (const query of ['c++', 'C# 책', 'Q&A', '50%', '사랑', '책 추천']) {
      expect(planBookSearch(query, 'Keyword').discoveryQuery).toBeUndefined();
    }
  });

  it('필드를 지정하면 입력을 해석하거나 소개로 넓히지 않는다', () => {
    const plan = planBookSearch('한강의 책', 'Author');
    expect(plan.expandedTokens).toBeUndefined();
    expect(plan.discoveryQuery).toBeUndefined();
  });

  it('긴 문장 앞의 요청 표현 때문에 뒤의 핵심 단어가 잘리지 않는다', () => {
    const plan = planBookSearch(
      '추천 부탁해 책 도서 추천해줘 알려줘 찾아줘 다루는 인공지능 윤리',
      'Keyword',
    );
    expect(plan.discoveryQuery).toContain("'인공지능':*");
    expect(plan.discoveryQuery).toContain("'윤리':*");
  });
});
