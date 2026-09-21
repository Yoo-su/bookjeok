/** 리뷰 하나에 붙일 수 있는 태그 수. 작성 폼과 서버 DTO가 함께 지킨다. */
export const REVIEW_TAG_MAX_COUNT = 5;

/** 태그 한 개의 최대 길이. 운영 최장이 8자라 여유를 두되 본문 붙여넣기는 막는다. */
export const REVIEW_TAG_MAX_LENGTH = 20;

/** 태그 자동완성이 한 번에 제안하는 개수. */
export const TAG_SUGGESTION_LIMIT = 8;

export const BOOK_DOMAINS = [
  "소설",
  "에세이",
  "자기계발",
  "인문",
  "경제/경영",
  "과학",
  "예술",
  "역사",
  "철학",
  "종교",
  "만화",
  "기타",
] as const;

export type BookDomain = (typeof BOOK_DOMAINS)[number];

export const CATEGORY_MAP: Record<string, string> = {
  소설: "novel",
  에세이: "essay",
  자기계발: "self_help",
  인문: "humanities",
  "경제/경영": "economy",
  과학: "science",
  예술: "art",
  역사: "history",
  철학: "philosophy",
  종교: "religion",
  만화: "comic",
  기타: "others",
};
