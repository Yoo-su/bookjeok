export interface CameoSceneProps {
  /** 장면을 그려 넣을 자리. 산책은 상단바 알약, 빼꼼은 body */
  host: HTMLElement;
  rand: () => number;
  /** 장면이 끝나면(누른 뒤 도망친 경우 포함) 한 번 부른다 */
  onDone: () => void;
}
