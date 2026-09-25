import type { Mood } from "./types";

/**
 * 키 대비 몸 부위 높이. 캐릭터도 이 비율로 그려서 책탑 꼭대기가
 * 몸의 어디쯤인지 그림과 말이 맞는다.
 */
export const BODY_PARTS = [
  { ratio: 0.05, key: "ankle" },
  { ratio: 0.28, key: "knee" },
  { ratio: 0.6, key: "waist" },
  { ratio: 0.72, key: "chest" },
  { ratio: 0.82, key: "shoulder" },
  { ratio: 0.93, key: "eyes" },
  { ratio: 1, key: "head" },
] as const;

export type BodyPart = (typeof BODY_PARTS)[number]["key"];

/** 진행 막대에 눈금으로 보여줄 부위 */
export const TRACK_PARTS: BodyPart[] = ["knee", "waist", "shoulder", "head"];

export interface TowerStatus {
  /** 책탑 높이 ÷ 키 */
  ratio: number;
  passed: BodyPart | null;
  next: BodyPart | null;
  /** 다음 부위까지 남은 cm(올림) */
  toNextCm: number;
  /** 키를 넘은 cm(반올림). 넘지 않았으면 0 */
  overCm: number;
  mood: Mood;
}

export function towerStatus(towerMm: number, userMm: number): TowerStatus {
  const ratio = userMm > 0 ? towerMm / userMm : 0;
  const passed =
    [...BODY_PARTS].reverse().find((p) => p.ratio <= ratio)?.key ?? null;
  const nextPart = BODY_PARTS.find((p) => p.ratio > ratio) ?? null;
  const toNextCm = nextPart
    ? Math.max(1, Math.ceil((nextPart.ratio * userMm - towerMm) / 10))
    : 0;
  const mood: Mood =
    ratio >= 1
      ? "wow"
      : ratio >= 0.93
        ? "yay"
        : ratio >= 0.6
          ? "happy"
          : "calm";
  return {
    ratio,
    passed,
    next: nextPart?.key ?? null,
    toNextCm,
    overCm: ratio >= 1 ? Math.round((towerMm - userMm) / 10) : 0,
    mood,
  };
}
