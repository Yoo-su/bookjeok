import { spriteFrame } from "../sprite-frames";
import atlas from "./walk.json";

/**
 * 산책 스프라이트 한 벌. 칸 크기·바닥(y=145)은 지금 그림과 같아야 한다.
 */
export const WALK_CROP = { x: 16, y: 24, width: 164, height: 125, ground: 145 };

export interface WalkSprite {
  image: string;
  sheetWidth: number;
  sheetHeight: number;
  frames: { x: number; y: number; w: number; h: number }[];
  durationsMs: number[];
  /** 걸음 한 바퀴에 쓰는 앞쪽 프레임 수 */
  walkFrames: number;
  /** 멈춰 섰을 때 쓰는 프레임. 걸음 안에 있으면 그 프레임에서 걸음을 시작한다 */
  restFrame: number;
  /** 한 바퀴에 몸이 나아가는 거리(칸 px). 있으면 디딘 발이 미끄러지지 않게 이동 속도를 맞춘다 */
  stride?: number;
  /** 정지 프레임의 눈(칸 px). 있으면 멈춰 있는 동안 털색 눈꺼풀로 눈을 깜빡인다 */
  restEye?: { cx: number; cy: number; rx: number; ry: number };
}

export const WALK_SPRITE: WalkSprite = {
  image: "/cat-cameo/walk.png",
  ...atlas,
};

/** 걸음 순서(프레임 번호) */
function cycleOrder(sprite: WalkSprite) {
  const n = sprite.walkFrames;
  const start = sprite.restFrame < n ? sprite.restFrame : 0;
  return Array.from({ length: n }, (_, i) => (start + i) % n);
}

/** 걸음 한 바퀴 시간(ms) */
export function cycleMs(sprite: WalkSprite) {
  return cycleOrder(sprite).reduce((t, i) => t + sprite.durationsMs[i], 0);
}

/** 걸음 cycles바퀴를 한 애니메이션으로 이은 키프레임. 이동과 같은 easing을 걸면 발이 땅에 붙는다 */
export function walkKeyframes(sprite: WalkSprite, cycles = 1): Keyframe[] {
  const order = cycleOrder(sprite);
  const total = cycleMs(sprite) * cycles;
  const list: Keyframe[] = [];
  let elapsed = 0;
  for (let c = 0; c < cycles; c++)
    for (const i of order) {
      list.push(spriteFrame(sprite.frames[i], elapsed / total));
      elapsed += sprite.durationsMs[i];
    }
  return [...list, { ...list[0], offset: 1 }];
}
