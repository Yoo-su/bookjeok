/**
 * 북적 책동산: 모든 공개 독서 기록을 한데 쌓은 높이와, 그 옆에 세울 이정표.
 * 서버는 넘은 이정표를 기록하고, 웹은 다음 목표를 세운다.
 */
export type MountainLandmarkId =
  | "emperor"
  | "hoop"
  | "giraffe"
  | "cheomseongdae"
  | "seokgatap"
  | "yisunsin"
  | "liberty"
  | "namsanTower"
  | "building63"
  | "lotteTower"
  | "hallasan"
  | "baekdusan"
  | "everest";

export interface MountainLandmark {
  id: MountainLandmarkId;
  /** 바닥에서 재는 곳까지(mm). 흔히 소개되는 대략값이라 화면은 '약'으로 적는다 */
  heightMm: number;
}

/**
 * 낮은 것부터. 앞의 셋은 독서 키재기 사물 사다리(웹 `objects.ts`)와 같은 값이다.
 * 한 권이 평균 2cm 남짓이라 낮은 쪽을 촘촘히 뒀다(2026-09-30 기준 약 4m, 주 25cm 안팎).
 */
export const MOUNTAIN_LANDMARKS: readonly MountainLandmark[] = [
  { id: "emperor", heightMm: 1150 },
  // 림 높이
  { id: "hoop", heightMm: 3050 },
  { id: "giraffe", heightMm: 5000 },
  { id: "cheomseongdae", heightMm: 9170 },
  // 불국사 삼층석탑
  { id: "seokgatap", heightMm: 10750 },
  // 광화문 이순신 장군 동상, 기단 포함
  { id: "yisunsin", heightMm: 17000 },
  // 받침대 포함, 지면부터 횃불 끝까지
  { id: "liberty", heightMm: 93000 },
  // 타워 자체(해발 아님)
  { id: "namsanTower", heightMm: 236700 },
  { id: "building63", heightMm: 249600 },
  { id: "lotteTower", heightMm: 555000 },
  { id: "hallasan", heightMm: 1947000 },
  { id: "baekdusan", heightMm: 2744000 },
  { id: "everest", heightMm: 8849000 },
];

/** 쌓은 높이 바로 위의 이정표. 다 넘었으면 null */
export function nextMountainLandmark(totalMm: number): MountainLandmark | null {
  return MOUNTAIN_LANDMARKS.find((l) => l.heightMm > totalMm) ?? null;
}

/** 책동산 꼭대기에 보여 줄 최근 기록 수 */
export const MOUNTAIN_PEAK_COUNT = 8;

/** 지층 띠 최대 개수. 넘으면 이웃한 책을 묶어 한 띠로 보낸다 */
export const MOUNTAIN_MAX_BANDS = 240;

/** 「이번 주」로 치는 기간(일) */
export const MOUNTAIN_WEEK_DAYS = 7;
