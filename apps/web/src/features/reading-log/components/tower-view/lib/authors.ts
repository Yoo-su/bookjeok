import type { TowerAuthor } from "./types";

export const TOWER_AUTHORS: Record<
  TowerAuthor,
  { heightCm: number; source: string }
> = {
  camus: { heightCm: 176, source: "https://www.imdb.com/name/nm0133411/bio/" },
  sartre: { heightCm: 153, source: "https://www.imdb.com/name/nm0765683/bio/" },
  kundera: {
    heightCm: 185,
    source: "https://www.imdb.com/name/nm0475081/bio/",
  },
  kafka: { heightCm: 182, source: "https://www.spisovatele.cz/franz-kafka" },
  woolf: { heightCm: 170, source: "https://www.imdb.com/name/nm0941173/bio/" },
};

// 전기·웹 자료가 서로 달라 검증된 실측으로 취급하지 않는다. UI와 공유 모두 '약' 표기.
export const TOWER_AUTHOR_IDS = Object.keys(TOWER_AUTHORS) as TowerAuthor[];
