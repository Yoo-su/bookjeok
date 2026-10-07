import { buildArt } from "./figure-art";
import { drawObject } from "./figure-objects";
import { buildAuthorFigure } from "./figure-person";
import { buildReaderFigure } from "./figure-reader";
import { OBJECT_ART } from "./objects";
import type {
  Mood,
  SceneColors,
  SceneItem,
  StackCharacter,
  StackObject,
} from "./types";

/**
 * 연필로 그린 사람. 300×1000 단위로 그리고 (fx, fy)에서 k배로 늘린다.
 *
 * boil이면 흔들림이 다른 세 벌을 만든다. 화면이 번갈아 보여 선이 살짝 떨리게 한다.
 * 공유 이미지는 한 벌만 그린다.
 */
export function buildFigure(opts: {
  fx: number;
  fy: number;
  k: number;
  colors: SceneColors;
  u: number;
  mood: Mood;
  character: StackCharacter;
  heldColor: string;
  boil: boolean;
  /** 작가만. `buildAuthorFigure` 참고 */
  arm?: "wave" | "heart";
  /** 작가만. `buildAuthorFigure` 참고 */
  peek?: boolean;
}): SceneItem[] {
  const { character, mood, arm, peek, ...person } = opts;
  if (character === "M" || character === "F")
    return buildReaderFigure({ ...person, character, mood });
  return buildAuthorFigure({ ...person, author: character, arm, peek });
}

/**
 * 사물 사다리의 사물. 캐릭터와 같은 연필로 그린다. 세로 0~1000 단위를 (fx, fy)에서 k배로 늘리고,
 * 가로는 `OBJECT_ART`의 범위를 쓴다. boil이면 캐릭터처럼 세 벌을 번갈아 보인다.
 */
export function buildObject(opts: {
  fx: number;
  fy: number;
  k: number;
  colors: SceneColors;
  u: number;
  object: StackObject;
  heldColor: string;
  boil: boolean;
}): SceneItem[] {
  const { object, heldColor, ...rest } = opts;
  return buildArt({
    ...rest,
    box: OBJECT_ART[object].x,
    draw: (p) => drawObject(p, { object, heldColor }),
  });
}
