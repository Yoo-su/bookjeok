export const getPromptText = (
  title: string,
  author: string,
  description?: string,
) => {
  const baseInfo = `'${title}'(저자: ${author})`;
  const context = description
    ? `\n\n책 소개:\n${description}\n\n위 책 소개를 바탕으로`
    : '';

  return `${baseInfo}${context} 이 책에 대한 정보를 다음 JSON 형식으로 생성해줘. 응답은 오직 JSON만 반환해야 해.

  {
    "summary": "책의 핵심 내용을 2~3문장으로 요약 (존댓말)",
    "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
    "targetAudience": "이 책을 좋아할 만한 독자 유형 (1문장)",
    "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
  }`;
};
