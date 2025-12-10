import { ArtDomain, CityCode, Genre, PrfState } from "./types";

export const DEFAULT_ROWS = "100";
export const DEFAULT_PAGE = "1";
export const DEFAULT_GENRE: Genre = "AAAA";
export const DEFAULT_PRFSTATE: PrfState = "01";
export const DEFAULT_CITY_CODE: CityCode = "11";

export const MAIN_ARTS: Array<ArtDomain> = [
  { genreCode: "AAAA", title: "연극" },
  { genreCode: "BBBC", title: "서양/한국 무용" },
  { genreCode: "BBBE", title: "대중무용" },
  { genreCode: "CCCA", title: "서양음악" },
  { genreCode: "CCCD", title: "대중음악" },
];

/**
 * @description 시도 코드에 대한 설명을 제공하는 맵
 */
export const CITY_CODE_MAP: Record<CityCode, string> = {
  "11": "서울",
  "28": "인천",
  "30": "대전",
  "27": "대구",
  "29": "광주",
  "26": "부산",
  "31": "울산",
  "36": "세종",
  "41": "경기",
  "43": "충청",
  "44": "충청",
  "47": "경상",
  "48": "경상",
  "45": "전라",
  "46": "전라",
  "51": "강원",
  "50": "제주",
  UNI: "대학로",
};
