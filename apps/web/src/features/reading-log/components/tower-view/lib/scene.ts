import {
  fallbackCoverColor,
  inkColorFor,
  type ReadingTowerBook,
} from "@bookjeok/core";

import { buildFigure } from "./figure";
import {
  f1,
  hashSeed,
  lerp,
  poly,
  rectCorners,
  rng,
  sketchPoly,
} from "./sketch";
import type { TowerStatus } from "./status";
import type {
  GroupItem,
  MeasureText,
  PathItem,
  SceneColors,
  SceneItem,
  TextItem,
  TowerCharacter,
} from "./types";

/** 책을 칠할 색. 표지색이 없으면(10/30 이후 신간 등) ISBN으로 고른 옅은 색 */
export const bookColor = (b: Pick<ReadingTowerBook, "isbn" | "coverColor">) =>
  b.coverColor ?? fallbackCoverColor(b.isbn);

export interface SceneLabels {
  /** 눈금자 옆 "내 키 172cm" */
  myHeight: string;
  /** 남은 칸 "78cm 남음" */
  remain: string;
  /** 남은 칸 둘째 줄 "약 38권" */
  approxBooks: string;
  /** 탑 꼭대기 "94.9cm" */
  towerHeight: string;
  /** 말풍선 두 줄 */
  bubble: [string, string];
}

export interface SceneOptions {
  width: number;
  height: number;
  books: ReadingTowerBook[];
  towerMm: number;
  userMm: number;
  character: TowerCharacter;
  status: TowerStatus;
  labels: SceneLabels;
  colors: SceneColors;
  measure: MeasureText;
  /** 선 굵기·글자 크기 배율. 공유 이미지는 2배 안팎 */
  u?: number;
  /** 캐릭터 선 떨림용으로 세 벌 그릴지 */
  boil?: boolean;
  /** false면 캐릭터·키 주석·말풍선 없이 책탑만 그린다(공개 프로필). 축척도 탑에 맞춘다 */
  figure?: boolean;
}

export interface SceneResult {
  items: SceneItem[];
  /** 책탑이 차지하는 영역. 화면에서 클릭 영역으로 쓴다 */
  tower: { left: number; right: number; top: number; bottom: number };
}

function fitText(
  text: string,
  maxW: number,
  size: number,
  measure: MeasureText,
) {
  if (measure(text, size, 700, "hand") <= maxW) return text;
  let s = text;
  while (s.length > 1 && measure(`${s}…`, size, 700, "hand") > maxW)
    s = s.slice(0, -1);
  return s.length > 1 ? `${s.trim()}…` : "";
}

function bubbleItem(
  cx: number,
  bottom: number,
  lines: [string, string],
  C: SceneColors,
  u: number,
  width: number,
  minX: number,
  measure: MeasureText,
): GroupItem {
  const size = 16 * u;
  const lh = 19 * u;
  const w =
    Math.max(...lines.map((t) => measure(t, size, 700, "hand"))) + 24 * u;
  const h = lines.length * lh + 14 * u;
  const x = Math.max(
    minX,
    Math.min(width - w - 3 * u, Math.round(cx - w * 0.62)),
  );
  const y = Math.max(3 * u, bottom - h - 12 * u);
  const r = 12 * u;
  const tx = Math.max(x + 16 * u, Math.min(x + w - 16 * u, cx - 6 * u));
  const B = y + h;
  const d =
    `M${f1(x + r)},${f1(y)} L${f1(x + w - r)},${f1(y)} Q${f1(x + w)},${f1(y)} ${f1(x + w)},${f1(y + r)} ` +
    `L${f1(x + w)},${f1(B - r)} Q${f1(x + w)},${f1(B)} ${f1(x + w - r)},${f1(B)} ` +
    `L${f1(tx + 7 * u)},${f1(B)} L${f1(tx + 2 * u)},${f1(B + 11 * u)} L${f1(tx - 5 * u)},${f1(B)} ` +
    `L${f1(x + r)},${f1(B)} Q${f1(x)},${f1(B)} ${f1(x)},${f1(B - r)} L${f1(x)},${f1(y + r)} Q${f1(x)},${f1(y)} ${f1(x + r)},${f1(y)} Z`;
  const children: SceneItem[] = [
    { k: "p", d, fill: C.paper, stroke: C.ink, sw: 1.7 * u, join: "round" },
  ];
  lines.forEach((t, i) =>
    children.push({
      k: "t",
      x: x + w / 2,
      y: y + 7 * u + lh * (i + 0.5),
      t,
      size,
      weight: 700,
      fam: "hand",
      fill: i ? C.pen : C.ink,
      anchor: "middle",
    }),
  );
  return { k: "g", id: "bubble", cls: "tower-bubble", children };
}

/**
 * 책탑 장면. 책탑과 캐릭터를 같은 축척(px/mm)으로 놓는다.
 * books는 완독일 오름차순이어야 한다(바닥부터 쌓는다).
 */
export function buildTowerScene(o: SceneOptions): SceneResult {
  const {
    width: W,
    height: H,
    books,
    towerMm,
    userMm,
    character,
    status,
    labels,
    colors: C,
    measure,
  } = o;
  const u = o.u ?? 1;
  const figure = o.figure !== false;
  const padTop = 74 * u;
  const floorPad = 30 * u;
  const rulerW = 46 * u;
  // 캐릭터가 없으면 몇 권짜리 탑도 바닥에 붙지 않게 탑 높이로 잡는다
  const maxMm = figure
    ? Math.max(towerMm, userMm, 1000) * 1.04
    : Math.max(towerMm, 400) * 1.12;
  const s = (H - padTop - floorPad) / maxMm;
  const floorY = H - floorPad;
  const aW = W - rulerW;
  const tcx = rulerW + aW * (figure ? 0.3 : 0.5);
  const figH = userMm * s;
  const k = figH / 1000;
  const figW = 300 * k;
  const fcx = Math.min(rulerW + aW * 0.72, W - figW / 2 - 4 * u);
  const fx = fcx - 150 * k;
  const fy = floorY - figH;

  const out: SceneItem[] = [];
  const P = (d: string, a: Omit<PathItem, "k" | "d">) =>
    out.push({ k: "p", d, ...a });
  const T = (item: Omit<TextItem, "k">) => out.push({ k: "t", ...item });

  // 눈금자
  const rx = rulerW - 12 * u;
  P(`M${f1(rx)},${f1(floorY)} L${f1(rx)},${f1(floorY - maxMm * s)}`, {
    id: "ruler",
    stroke: C.muted,
    sw: 1.2 * u,
    cap: "round",
  });
  const labelEvery =
    (figure ? [500, 1000] : [100, 500, 1000]).find((v) => v * s >= 26 * u) ??
    1000;
  for (let mm = 100; mm <= maxMm; mm += 100) {
    const y = floorY - mm * s;
    const major = mm % 500 === 0;
    if (!major && 100 * s < 5 * u) continue;
    P(`M${f1(rx)},${f1(y)} L${f1(rx + (major ? 9 : 4.5) * u)},${f1(y)}`, {
      id: `tick-${mm}`,
      stroke: C.muted,
      sw: (major ? 1.3 : 1) * u,
      cap: "round",
    });
    if (mm % labelEvery === 0) {
      T({
        id: `tick-label-${mm}`,
        x: rx - 5 * u,
        y,
        t: String(mm / 10),
        size: 15 * u,
        weight: 700,
        fam: "hand",
        fill: C.faint,
        anchor: "end",
        halo: C.paper,
        hw: 4 * u,
      });
    }
  }

  // 바닥
  P(
    `M0,${f1(floorY)} Q${f1(W * 0.5)},${f1(floorY + 1.4 * u)} ${f1(W)},${f1(floorY - 0.4 * u)}`,
    { id: "floor", stroke: C.ink, sw: 1.9 * u, cap: "round" },
  );
  P(
    `M${f1(W * 0.05)},${f1(floorY + 4.5 * u)} Q${f1(W * 0.35)},${f1(floorY + 5.5 * u)} ${f1(W * 0.6)},${f1(floorY + 4 * u)}`,
    { id: "floor-2", stroke: C.ink, sw: 1 * u, cap: "round", op: 0.3 },
  );

  // 책탑 발밑 그림자
  const maxBookH = Math.max(210, ...books.map((b) => b.height));
  const tw0 = maxBookH * s;
  let shadow = "";
  for (let x = -tw0 * 0.62; x <= tw0 * 0.62; x += 4.2 * u) {
    const e = 1 - (x / (tw0 * 0.65)) ** 2;
    shadow += `M${f1(tcx + x)},${f1(floorY + 1.2 * u)} L${f1(tcx + x + 2.6 * u * e + 0.8 * u)},${f1(floorY + 2.2 * u + 4.2 * u * e)} `;
  }
  P(shadow, {
    id: "tower-shadow",
    stroke: C.ink,
    sw: 1 * u,
    cap: "round",
    op: 0.4,
  });

  // 책. 눕혀 쌓으므로 가로가 책의 세로, 높이가 두께다
  let y = floorY;
  let left = W;
  let right = 0;
  books.forEach((b) => {
    const r = rng(hashSeed(`${b.isbn}:${b.logId}`));
    const jx = r() - 0.5;
    const jr = r() - 0.5;
    const jj = Array.from({ length: 8 }, r);
    const w = b.height * s;
    const h = Math.max(1, b.depth * s);
    y -= h;
    const cx = tcx + jx * 12 * s;
    const cy = y + h / 2;
    const rot = (jr * (h > 6 ? 2.4 : 1.4) * Math.PI) / 180;
    const cs = rectCorners(cx, cy, w, h, rot);
    cs.forEach((p) => {
      left = Math.min(left, p[0]);
      right = Math.max(right, p[0]);
    });
    const color = bookColor(b);
    const ch: SceneItem[] = [];
    if (h >= 4.5 * u) {
      // 색면을 윤곽선에서 살짝 어긋나게 찍는다(리소 인쇄 느낌)
      ch.push({
        k: "p",
        d: poly(cs.map((p) => [p[0] - 1.7 * u, p[1] - 1.3 * u])),
        fill: color,
      });
      ch.push({
        k: "p",
        d: sketchPoly(cs, jj, Math.min(0.9 * u, h * 0.12)),
        stroke: C.ink,
        sw: 1.15 * u,
        join: "round",
      });
      if (h >= 7 * u) {
        for (const t of [0.09, 0.91]) {
          const a = lerp(lerp(cs[0], cs[1], t), lerp(cs[3], cs[2], t), 0.24);
          const c = lerp(lerp(cs[0], cs[1], t), lerp(cs[3], cs[2], t), 0.76);
          ch.push({
            k: "p",
            d: `M${f1(a[0])},${f1(a[1])} L${f1(c[0])},${f1(c[1])}`,
            stroke: C.ink,
            sw: 0.9 * u,
            cap: "round",
            op: 0.55,
          });
        }
      }
      if (h >= 12 * u) {
        const size = Math.min(h * 0.7, 18 * u);
        const t = fitText(b.title, w * 0.72, size, measure);
        if (t) {
          ch.push({
            k: "t",
            x: cx,
            y: cy + size * 0.04,
            t,
            size,
            weight: 700,
            fam: "hand",
            fill: inkColorFor(color),
            anchor: "middle",
            rot: (rot * 180) / Math.PI,
          });
        }
      }
    } else {
      ch.push({ k: "p", d: poly(cs), fill: color });
      ch.push({
        k: "p",
        d: `M${f1(cs[3][0])},${f1(cs[3][1])} L${f1(cs[2][0])},${f1(cs[2][1])} M${f1(cs[0][0])},${f1(cs[0][1])} L${f1(cs[3][0])},${f1(cs[3][1])} M${f1(cs[1][0])},${f1(cs[1][1])} L${f1(cs[2][0])},${f1(cs[2][1])}`,
        stroke: C.ink,
        sw: 0.95 * u,
        cap: "round",
      });
    }
    out.push({
      k: "g",
      id: `book-${b.logId}`,
      cls: "tower-book",
      children: ch,
    });
  });
  const topY = y;
  if (!books.length) {
    left = tcx - 20 * u;
    right = tcx + 20 * u;
  }

  // 캐릭터. 왼손에 가장 최근에 읽은 책
  if (figure) {
    const held = books.length ? bookColor(books[books.length - 1]) : "#E7E5E4";
    out.push({
      k: "g",
      id: "character",
      cls: "tower-character",
      children: buildFigure({
        fx,
        fy,
        k,
        colors: C,
        u,
        mood: status.mood,
        character,
        heldColor: held,
        boil: o.boil ?? false,
      }),
    });
  }

  // 주석
  const ann: SceneItem[] = [];
  const A = (d: string, a: Omit<PathItem, "k" | "d">) =>
    ann.push({ k: "p", d, ...a });
  const AT = (item: Omit<TextItem, "k" | "halo" | "hw">) =>
    ann.push({ k: "t", halo: C.paper, hw: 5 * u, ...item });
  if (figure) {
    A(`M${f1(rx)},${f1(fy)} L${f1(fx + 92 * k)},${f1(fy)}`, {
      stroke: C.pen,
      sw: 1.6 * u,
      dash: [5 * u, 4 * u],
      cap: "round",
    });
    out.push({
      k: "t",
      id: "my-height",
      x: rx + 6 * u,
      y: fy - 11 * u,
      t: labels.myHeight,
      size: 16 * u,
      weight: 700,
      fam: "hand",
      fill: C.pen,
      anchor: "start",
      halo: C.paper,
      hw: 5 * u,
    });
  }

  if (books.length) {
    const ly = figure && Math.abs(topY - fy) < 20 * u ? topY + 20 * u : topY;
    AT({
      x: left - 9 * u,
      y: ly,
      t: labels.towerHeight,
      size: 16 * u,
      weight: 700,
      fam: "hand",
      fill: C.ink,
      anchor: "end",
    });
    A(`M${f1(left - 7 * u)},${f1(topY)} L${f1(left - 2 * u)},${f1(topY)}`, {
      stroke: C.ink,
      sw: 1.4 * u,
      cap: "round",
    });
  }
  const gap = topY - fy;
  if (figure && gap > 34 * u) {
    const x = tcx;
    const y1 = topY - 6 * u;
    const y2 = fy + 6 * u;
    A(`M${f1(x)},${f1(y1)} L${f1(x)},${f1(y2)}`, {
      stroke: C.pen,
      sw: 1.6 * u,
      dash: [4 * u, 4 * u],
      cap: "round",
    });
    A(
      `M${f1(x - 4.5 * u)},${f1(y2 + 6 * u)} L${f1(x)},${f1(y2)} L${f1(x + 4.5 * u)},${f1(y2 + 6 * u)} M${f1(x - 4.5 * u)},${f1(y1 - 6 * u)} L${f1(x)},${f1(y1)} L${f1(x + 4.5 * u)},${f1(y1 - 6 * u)}`,
      { stroke: C.pen, sw: 1.6 * u, cap: "round", join: "round" },
    );
    const two = gap > 80 * u;
    const bw =
      Math.max(
        measure(labels.remain, 16 * u, 700, "hand"),
        two ? measure(labels.approxBooks, 14 * u, 700, "hand") : 0,
      ) +
      10 * u;
    const bh = (two ? 38 : 20) * u;
    const my = (y1 + y2) / 2;
    A(
      `M${f1(x - bw / 2)},${f1(my - bh / 2)} h${f1(bw)} v${f1(bh)} h${f1(-bw)} Z`,
      { fill: C.paper },
    );
    AT({
      x,
      y: two ? my - 8 * u : my,
      t: labels.remain,
      size: 16 * u,
      weight: 700,
      fam: "hand",
      fill: C.pen,
      anchor: "middle",
    });
    if (two)
      AT({
        x,
        y: my + 10 * u,
        t: labels.approxBooks,
        size: 14 * u,
        weight: 700,
        fam: "hand",
        fill: C.pen,
        anchor: "middle",
        op: 0.8,
      });
    // 책탑 꼭대기가 몸의 어디쯤인지 잇는 점선
    const bx = fx + 8 * k;
    if (books.length && bx - right > 14 * u) {
      A(`M${f1(right + 5 * u)},${f1(topY)} L${f1(bx)},${f1(topY)}`, {
        stroke: C.muted,
        sw: 1.2 * u,
        dash: [1.5 * u, 3.5 * u],
        cap: "round",
      });
    }
  }
  // 키를 넘은 높이는 말풍선이 말한다
  out.push({
    k: "g",
    id: "annotations",
    cls: "tower-annotations",
    children: ann,
  });
  if (figure) {
    out.push(
      bubbleItem(
        fcx,
        fy + 6 * u,
        labels.bubble,
        C,
        u,
        W,
        rulerW + 4 * u,
        measure,
      ),
    );
  }

  return { items: out, tower: { left, right, top: topY, bottom: floorY } };
}
