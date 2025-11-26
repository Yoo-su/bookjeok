export const getPromptText = (title: string, author: string) => {
  return `'${title}'(저자: ${author}) 책의 핵심 내용을 2~3문장으로 요약하고, 어떤 점이 이 책의 매력 포인트고, 어떤 주제와 스토리를 좋아하는 독자들이 이 책을 좋아할 것 같은지 추측해서 500자 내외로 생성해줘.`;
};
