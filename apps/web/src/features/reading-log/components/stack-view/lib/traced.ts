import type { Pt } from "./sketch";
import type { GroupItem, PathItem } from "./types";

/**
 * 연필 시안을 potrace로 딴 그림. 좌표는 캐릭터 단위(300×1000)의 2배 정수다.
 * `sil`은 피부색으로 까는 실루엣, `levels`는 옅은 층부터 진한 층까지 겹쳐 칠해 연필 농도를 낸다(evenodd)
 */
export interface TracedArt {
  sil: string;
  /** 옅은 원화에서 실루엣 추출이 비워 둔 내부를 불투명하게 메운다. 윤곽과 별도로 칠한다 */
  backing?: string;
  levels: string[];
}

/** 작가 전신. `book`은 손에 든 책 표지의 보이는 면(손에 가린 곳 제외)으로, 표지색을 칠한다 */
export interface AuthorArt extends TracedArt {
  book: string;
}

/** 층별 농도. 옅은 층부터 */
const LEVEL_OPACITY = [0.3, 0.42, 0.78];

/** 원화 경로를 다시 쓰지 않고 SVG와 Canvas가 같은 행렬로 배치한다 */
function placed(
  items: PathItem[],
  T: (x: number, y: number) => Pt,
): GroupItem[] {
  const [x, y] = T(0, 0);
  const [xx, xy] = T(1, 0);
  const [yx, yy] = T(0, 1);
  return [
    {
      k: "g",
      cls: "traced-art",
      transform: [(xx - x) / 2, (xy - y) / 2, (yx - x) / 2, (yy - y) / 2, x, y],
      children: items,
    },
  ];
}

// 원화와 색이 같으면 자식 노드도 재사용한다. 글꼴 재측정·높이 변경 때 큰 d를 다시 비교하지 않는다.
const cache = new WeakMap<TracedArt, { key: string; items: PathItem[] }>();
function nativeItems(
  art: TracedArt,
  skin: string,
  line: string,
  book?: { d: string; fill: string },
): PathItem[] {
  const key = [skin, line, book?.fill].join(":");
  const hit = cache.get(art);
  if (hit?.key === key) return hit.items;
  const items: PathItem[] = [
    ...(art.backing ? [{ k: "p" as const, d: art.backing, fill: skin }] : []),
    { k: "p", d: art.sil, fill: skin },
    ...(book ? [{ k: "p" as const, ...book, rule: "evenodd" as const }] : []),
    ...art.levels.map(
      (d, i): PathItem => ({
        k: "p",
        d,
        fill: line,
        rule: "evenodd",
        op: LEVEL_OPACITY[i],
      }),
    ),
  ];
  cache.set(art, { key, items });
  return items;
}

export function tracedItems(
  art: TracedArt,
  T: (x: number, y: number) => Pt,
  o: { skin: string; line: string },
): GroupItem[] {
  return placed(nativeItems(art, o.skin, o.line), T);
}

/** 작가 전신. 종이색 실루엣 → 책 표지색 → 연필 층 */
export function authorArtItems(
  art: AuthorArt,
  T: (x: number, y: number) => Pt,
  o: { paper: string; line: string; held: string },
): GroupItem[] {
  return placed(
    nativeItems(art, o.paper, o.line, { d: art.book, fill: o.held }),
    T,
  );
}
