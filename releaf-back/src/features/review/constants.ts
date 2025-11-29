export const BOOK_DOMAINS = [
  '소설',
  '에세이',
  '자기계발',
  '인문',
  '경제/경영',
  '과학',
  '예술',
  '역사',
  '철학',
  '종교',
  '만화',
  '기타',
] as const;

export type BookDomain = (typeof BOOK_DOMAINS)[number];
