import type { StackObject } from "./types";

/**
 * 사물마다 그리는 영역. 세로는 모두 0(꼭대기)~1000(바닥) 단위이고 무대가 사물 높이에 맞춰 늘린다.
 * x는 가로 범위, mark는 높이를 재는 곳의 세로 단위(기본 0, 꼭대기). 농구 골대는 백보드가 아니라 림에서 잰다.
 */
export const OBJECT_ART: Record<
  StackObject,
  { x: [number, number]; mark?: number }
> = {
  sugar: { x: [50, 1000] },
  eraser: { x: [30, 500] },
  egg: { x: [30, 570] },
  hamster: { x: [40, 800] },
  pencil: { x: [-4, 84] },
  soju: { x: [10, 310] },
  dachshund: { x: [30, 762] },
  bowlingPin: { x: [-8, 328] },
  extinguisher: { x: [60, 410] },
  adelie: { x: [0, 500] },
  emperor: { x: [30, 440] },
  hoop: { x: [-4, 460], mark: 236 },
  giraffe: { x: [36, 616] },
};

export interface StackObjectSpec {
  id: StackObject;
  /** 바닥에서 재는 곳까지(mm). 자주 소개되는 대략값이라 화면은 '약'으로 적는다 */
  heightMm: number;
}

/** 사물 사다리. 낮은 것부터, 대략 1.2~2.6배 간격이라 몇 권마다 하나씩 넘는다 */
export const STACK_OBJECTS: readonly StackObjectSpec[] = [
  { id: "sugar", heightMm: 16 },
  // 세워 둔 지우개
  { id: "eraser", heightMm: 50 },
  // 달걀 받침에 세운 달걀
  { id: "egg", heightMm: 75 },
  // 앞발을 들고 선 햄스터
  { id: "hamster", heightMm: 110 },
  // 깎아 둔 새 연필(지우개 달린 것)
  { id: "pencil", heightMm: 175 },
  { id: "soju", heightMm: 210 },
  // 앉은 닥스훈트의 머리 꼭대기
  { id: "dachshund", heightMm: 300 },
  { id: "bowlingPin", heightMm: 380 },
  // 3.3kg 분말 소화기
  { id: "extinguisher", heightMm: 480 },
  { id: "adelie", heightMm: 700 },
  { id: "emperor", heightMm: 1150 },
  // 림 높이
  { id: "hoop", heightMm: 3050 },
  { id: "giraffe", heightMm: 5000 },
];

/** 그림 전체 높이(mm). 높이를 꼭대기가 아닌 곳에서 재는 사물(농구 골대 림)은 재는 곳보다 크다 */
export function objectArtHeightMm(o: StackObjectSpec) {
  return (o.heightMm * 1000) / (1000 - (OBJECT_ART[o.id].mark ?? 0));
}

export interface ObjectLadder {
  /** 가장 최근에 넘은 사물. 아직 없으면 null */
  passed: StackObjectSpec | null;
  /** 다음 목표. 다 넘었으면 null */
  next: StackObjectSpec | null;
}

export function objectLadder(stackMm: number): ObjectLadder {
  const i = STACK_OBJECTS.findIndex((o) => o.heightMm > stackMm);
  const passedIdx = i === -1 ? STACK_OBJECTS.length - 1 : i - 1;
  return {
    passed: passedIdx >= 0 ? STACK_OBJECTS[passedIdx] : null,
    next: i === -1 ? null : STACK_OBJECTS[i],
  };
}

/** 무대에 세울 사물. 다 넘었으면 가장 큰 사물을 세워 얼마나 넘었는지 보여 준다 */
export function stageObject(stackMm: number): StackObjectSpec {
  return objectLadder(stackMm).next ?? STACK_OBJECTS[STACK_OBJECTS.length - 1];
}

/** 이번에 쌓은 책으로 새로 넘은 사물들(낮은 것부터) */
export function objectsPassedBetween(beforeMm: number, afterMm: number) {
  return STACK_OBJECTS.filter(
    (o) => o.heightMm > beforeMm && o.heightMm <= afterMm,
  );
}
