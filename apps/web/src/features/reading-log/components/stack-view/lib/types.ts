/**
 * 독서 키재기 장면을 이루는 도형 목록. 한 번 만든 목록을 화면(SVG)과 공유 이미지(Canvas)가
 * 같이 그린다. 일반 도형은 px 좌표이며, 큰 원화 경로는 그룹의 아핀 변환으로 배치한다.
 */
export type FontRole = "hand" | "ui";

interface ItemBase {
  /** 화면의 React key. 눈금 수가 바뀌어도 뒤쪽 노드가 밀리지 않게 한다 */
  id?: string;
}

export interface PathItem extends ItemBase {
  k: "p";
  d: string;
  fill?: string;
  stroke?: string;
  sw?: number;
  cap?: "round" | "butt";
  join?: "round" | "miter";
  dash?: number[];
  op?: number;
  cls?: string;
  /** 구멍이 있는 면. 시안에서 딴 머리처럼 윤곽 안쪽을 비워야 할 때 */
  rule?: "evenodd";
}

export interface TextItem extends ItemBase {
  k: "t";
  x: number;
  y: number;
  t: string;
  size: number;
  weight: number;
  fam: FontRole;
  fill: string;
  anchor?: "start" | "middle" | "end";
  rot?: number;
  op?: number;
  /** 글자 뒤에 까는 테두리색. 선이나 책 위에 겹쳐도 읽히게 한다 */
  halo?: string;
  hw?: number;
}

export interface GroupItem extends ItemBase {
  k: "g";
  cls: string;
  children: SceneItem[];
  /** SVG/Canvas 공통 아핀 변환(a, b, c, d, e, f). 큰 원화 경로는 그대로 두고 배치만 바꾼다 */
  transform?: [number, number, number, number, number, number];
}

export type SceneItem = PathItem | TextItem | GroupItem;

export interface SceneColors {
  paper: string;
  ink: string;
  pen: string;
  muted: string;
  faint: string;
}

export type Mood = "calm" | "happy" | "yay" | "wow";

export type StackReaderCharacter = "M" | "F";
export type StackAuthor = "camus" | "sartre" | "kundera" | "woolf" | "kafka";
export type StackCharacter = StackReaderCharacter | StackAuthor;
/** 사물 사다리의 사물. 쌓은 높이에 따라 자동으로 다음 목표가 된다 */
export type StackObject =
  | "sugar"
  | "eraser"
  | "egg"
  | "hamster"
  | "pencil"
  | "soju"
  | "dachshund"
  | "bowlingPin"
  | "extinguisher"
  | "adelie"
  | "emperor"
  | "hoop"
  | "giraffe";

/** 텍스트 폭 측정(px). 말풍선과 책 제목 줄임에 쓴다 */
export type MeasureText = (
  text: string,
  size: number,
  weight: number,
  fam: FontRole,
) => number;
