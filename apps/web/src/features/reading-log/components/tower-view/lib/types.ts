/**
 * 책탑 장면을 이루는 도형 목록. 한 번 만든 목록을 화면(SVG)과 공유 이미지(Canvas)가
 * 같이 그린다. 그래서 좌표는 전부 px로 굳혀 두고 변환을 중첩하지 않는다.
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

export type TowerReaderCharacter = "M" | "F";
export type TowerAuthor = "camus" | "sartre" | "kundera" | "woolf" | "kafka";
export type TowerCharacter = TowerReaderCharacter | TowerAuthor;

/** 텍스트 폭 측정(px). 말풍선과 책 제목 줄임에 쓴다 */
export type MeasureText = (
  text: string,
  size: number,
  weight: number,
  fam: FontRole,
) => number;
