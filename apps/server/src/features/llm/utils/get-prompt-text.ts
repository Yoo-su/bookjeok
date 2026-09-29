/**
 * AI 도서 요약 프롬프트를 생성합니다.
 * 출판사 책소개(`books.description`)와 차별화된 분석적 요약을 생성하도록 설계되었습니다.
 *
 * @param title - 책 제목
 * @param author - 저자명
 * @param description - 도서 DB의 책 소개 (선택)
 * @returns Gemini API에 전달할 프롬프트 문자열
 */
export const getPromptText = (
  title: string,
  author: string,
  description?: string,
  publisher?: string,
) => {
  const publisherTag = publisher
    ? `\n  <publisher>${publisher}</publisher>`
    : '';

  const bookContext = `
<target_book>
  <title>${title}</title>
  <author>${author}</author>${publisherTag}
</target_book>
`;

  const descriptionContext = description
    ? `\n<source_description>\n${description}\n</source_description>`
    : '';

  return `당신은 10년 경력의 전문 도서 큐레이터입니다.
독자가 <target_book>에 정의된 도서를 읽을지 결정하는 데 실질적인 도움을 주는 요약 정보와 인사이트를 제공하는 것이 당신의 목표입니다.

[입력 데이터]
${bookContext}${descriptionContext}

[수행 지침]
1. <target_book>의 정보를 명확히 확인하고, 해당 책에 대한 정확하고 깊이 있는 요약을 작성하세요.
2. <source_description>이 존재하는 경우 이를 참고하되, 소개글에 기술된 줄거리나 사실을 그대로 중복 설명하지 마십시오. 소개글의 내용을 넘어서서 이 책이 지닌 고유한 문학적·역사적 의의, 작가의 독창적인 세계관이나 비평적 인사이트를 새롭게 결합하여 차별화된 정보를 서술하십시오.
3. 요약(summary) 필드는 책의 고유한 서사적 갈등이나 핵심 사건, 또는 전개 상황을 최소 한 문장 이상 구체적으로 포함해야 합니다.
4. 상투적인 추천 표현("~의 필독서입니다", "~한 고전입니다", "추천합니다" 등)은 철저히 배제하고, 독자에게 실질적인 서사적 몰입감을 선사하는 데 집중하십시오.
5. 요약(summary)은 1개의 호흡이 긴 완성형 문단으로 구성하되, 공백 포함 250자 ~ 350자 내외(약 3~4문장)로 풍부하게 풀어 쓰십시오.
6. 마크다운 기호(**, *, # 등)는 출력 결과에 절대 사용하지 마십시오.
7. 친절하고 전문적인 존댓말(하십시오체 또는 해요체)을 일관되게 사용하십시오.
8. 각 필드(summary, keyPoints, targetAudience)는 서로 중복되지 않는 고유한 정보를 담아야 합니다.
`;
};
