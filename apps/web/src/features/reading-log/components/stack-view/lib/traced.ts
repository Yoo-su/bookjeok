import { f1, type Pt } from "./sketch";
import type { PathItem } from "./types";

/**
 * 연필 시안을 potrace로 딴 그림. 좌표는 캐릭터 단위(300×1000)의 2배 정수다.
 * `sil`은 피부색으로 까는 실루엣, `levels`는 옅은 층부터 진한 층까지 겹쳐 칠해 연필 농도를 낸다(evenodd)
 */
export interface TracedArt {
  sil: string;
  levels: string[];
}

/** 작가 전신. `book`은 손에 든 책 표지의 보이는 면(손에 가린 곳 제외)으로, 표지색을 칠한다 */
export interface AuthorArt extends TracedArt {
  book: string;
}

/** 층별 농도. 옅은 층부터 */
const LEVEL_OPACITY = [0.3, 0.42, 0.78];

/** 단위×2 정수 경로를 장면 px로 옮긴다 */
function place(d: string, T: (x: number, y: number) => Pt) {
  let out = "";
  let x = 0;
  let i = 0;
  for (const tok of d.match(/[MLCZ]|-?\d+/g) ?? []) {
    if (tok >= "A") {
      out += tok;
      i = 0;
    } else if (i++ % 2 === 0) {
      x = Number(tok) / 2;
    } else {
      const [a, b] = T(x, Number(tok) / 2);
      out += `${f1(a)},${f1(b)} `;
    }
  }
  return out;
}

export function tracedItems(
  art: TracedArt,
  T: (x: number, y: number) => Pt,
  o: { skin: string; line: string },
): PathItem[] {
  return [
    { k: "p", d: place(art.sil, T), fill: o.skin },
    ...art.levels.map(
      (d, i): PathItem => ({
        k: "p",
        d: place(d, T),
        fill: o.line,
        rule: "evenodd",
        op: LEVEL_OPACITY[i],
      }),
    ),
  ];
}

/** 작가 전신. 종이색 실루엣 → 책 표지색 → 연필 층 순서로 겹친다 */
export function authorArtItems(
  art: AuthorArt,
  T: (x: number, y: number) => Pt,
  o: { paper: string; line: string; held: string },
): PathItem[] {
  const [sil, ...levels] = tracedItems(art, T, {
    skin: o.paper,
    line: o.line,
  });
  return [
    sil,
    { k: "p", d: place(art.book, T), fill: o.held, rule: "evenodd" },
    ...levels,
  ];
}
