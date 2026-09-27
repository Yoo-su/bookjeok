import {
  fallbackCoverColor,
  inkColorFor,
  type ReadingStackBook,
} from "@bookjeok/core";

import { buildFigure, buildObject } from "./figure";
import { OBJECT_ART, objectArtHeightMm, type StackObjectSpec } from "./objects";
import {
  type Cmds,
  f1,
  hashSeed,
  lerp,
  poly,
  rectCorners,
  rng,
  samplePath,
  sketchPoly,
  wobble,
} from "./sketch";
import type { StackStatus } from "./status";
import type {
  GroupItem,
  MeasureText,
  PathItem,
  SceneColors,
  SceneItem,
  StackCharacter,
  TextItem,
} from "./types";

/** 책을 칠할 색. 표지색이 없으면(10/30 이후 신간 등) ISBN으로 고른 옅은 색 */
export const bookColor = (b: Pick<ReadingStackBook, "isbn" | "coverColor">) =>
  b.coverColor ?? fallbackCoverColor(b.isbn);

export interface SceneLabels {
  /** 눈금자 옆 "내 키 172cm". 사물이면 "닥스훈트 약 30cm" */
  myHeight: string;
  /** myHeight가 말풍선과 부딪힐 때 대신 쓰는 짧은 이름표 "약 30cm". 사물만 */
  myHeightShort?: string;
  /** 남은 칸 "78cm 남음" */
  remain: string;
  /** 남은 칸 둘째 줄 "약 38권" */
  approxBooks: string;
  /** 쌓은 책 꼭대기 "94.9cm" */
  stackHeight: string;
  /** 말풍선 두 줄 */
  bubble: [string, string];
}

export interface SceneOptions {
  width: number;
  height: number;
  books: ReadingStackBook[];
  stackMm: number;
  userMm: number;
  character: StackCharacter;
  status: StackStatus;
  labels: SceneLabels;
  colors: SceneColors;
  measure: MeasureText;
  /** 선 굵기·글자 크기 배율. 공유 이미지는 2배 안팎 */
  u?: number;
  /** 캐릭터 선 떨림용으로 세 벌 그릴지 */
  boil?: boolean;
  /** false면 캐릭터·키 주석·말풍선 없이 쌓은 책만 그린다(공개 프로필). 축척도 쌓은 높이에 맞춘다 */
  figure?: boolean;
  /**
   * 있으면 캐릭터 대신 이 사물을 세운다. 축척을 쌓은 책과 사물에 맞춰 키보다 크게 확대하고,
   * 말풍선은 사물이 말한다
   */
  object?: StackObjectSpec;
}

export interface SceneResult {
  items: SceneItem[];
  /** 쌓은 책이 차지하는 영역. 화면에서 클릭 영역으로 쓴다 */
  stack: { left: number; right: number; top: number; bottom: number };
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

/** 말풍선의 왼쪽 끝과 폭(px). 이름표가 부딪히는지 미리 볼 때도 쓴다 */
function bubbleSpan(
  cx: number,
  lines: [string, string],
  u: number,
  width: number,
  minX: number,
  measure: MeasureText,
) {
  const w =
    Math.max(...lines.map((t) => measure(t, 16 * u, 700, "hand"))) + 24 * u;
  const x = Math.max(
    minX,
    Math.min(width - w - 3 * u, Math.round(cx - w * 0.62)),
  );
  return { x, w };
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
  boil: boolean,
): GroupItem {
  const size = 16 * u;
  const lh = 19 * u;
  const { x, w } = bubbleSpan(cx, lines, u, width, minX, measure);
  const h = lines.length * lh + 14 * u;
  const y = Math.max(3 * u, bottom - h - 12 * u);
  const r = 12 * u;
  const tx = Math.max(x + 16 * u, Math.min(x + w - 16 * u, cx - 6 * u));
  const B = y + h;
  // 선만 연필로 긋는다. 캐릭터와 같이 세 벌을 번갈아 보여 떨리게 한다
  const shape: Cmds = [
    "M",
    x + r,
    y,
    "L",
    x + w - r,
    y,
    "Q",
    x + w,
    y,
    x + w,
    y + r,
    "L",
    x + w,
    B - r,
    "Q",
    x + w,
    B,
    x + w - r,
    B,
    "L",
    tx + 7 * u,
    B,
    "L",
    tx + 2 * u,
    B + 11 * u,
    "L",
    tx - 5 * u,
    B,
    "L",
    x + r,
    B,
    "Q",
    x,
    B,
    x,
    B - r,
    "L",
    x,
    y + r,
    "Q",
    x,
    y,
    x + r,
    y,
  ];
  const outline = samplePath(shape, (px, py) => [px, py]);
  const children: SceneItem[] = [
    { k: "p", d: wobble(outline, 41, 0.3 * u, true), fill: C.paper },
  ];
  for (const v of boil ? [0, 1, 2] : [0]) {
    const seed = 41 + v * 53;
    children.push({
      k: "g",
      cls: boil ? `stack-boil stack-boil-${v}` : "stack-bubble-line",
      children: [
        {
          k: "p",
          d: wobble(outline, seed, 0.55 * u, true),
          stroke: C.ink,
          sw: 1.7 * u,
          join: "round",
          op: 0.92,
        },
        {
          k: "p",
          d: wobble(outline, seed + 1, 0.95 * u, true),
          stroke: C.ink,
          sw: 0.8 * u,
          join: "round",
          op: 0.35,
        },
      ],
    });
  }
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
  return { k: "g", id: "bubble", cls: "stack-bubble", children };
}

/** 사물 모드 위아래 여백(px, u=1). 말풍선 자리와 바닥 아래 */
const OBJECT_PAD = { top: 74, floor: 30 };

/** 빈 무대(쌓은 책 없음)에서 사물을 키우는 한도(px, u=1). 폭이 남아도 무대만 하게 키우지 않는다 */
const OBJECT_EMPTY_MAX_PX = 128;
/**
 * 사물 무대의 가로 여백(px, u=1)과 폭을 채우는 비율. 넓은 화면은 사람 무대처럼 좌우를 넉넉히 비우고,
 * 좁은 화면은 폭이 귀해 여백을 줄인다. 작은 사물이라 사람 무대보다는 조금 더 확대돼 보인다
 */
const OBJECT_SPACING = {
  wide: { right: 32, gap: 40, fill: 0.84 },
  narrow: { right: 18, gap: 18, fill: 0.96 },
};
/** 사물 무대의 말풍선이 무대 오른쪽 끝에서 떨어지는 거리(px, u=1) */
const OBJECT_BUBBLE_PAD = 12;

/**
 * 사물 모드의 축척과 가로 배치. 사람 무대처럼 눈금자 · (쌓은 높이 이름표) · 쌓은 책 · 사물 · 여백 순으로
 * 자리를 나누고, 폭을 다 채우지 않고 좌우에 숨 쉴 자리를 둔다. 쌓은 책은 눕혀 쌓아 가로가 책의 세로
 * (약 21cm)라 좁은 화면에서는 높이보다 폭이 축척을 정한다.
 */
function objectFit(o: {
  width: number;
  books: ReadingStackBook[];
  stackMm: number;
  object: StackObjectSpec;
  u: number;
}) {
  const { u, width } = o;
  const box = OBJECT_ART[o.object.id].x;
  const artMm = objectArtHeightMm(o.object);
  const objWmm = (artMm * (box[1] - box[0])) / 1000;
  // 아직 쌓은 책이 없으면 자리를 비워 두지 않는다. 사물만 가운데 선다
  const empty = o.books.length === 0;
  const stackWmm = empty
    ? 0
    : Math.max(210, ...o.books.map((b) => b.height)) * 1.12;
  // 쌓은 높이("26.4cm")를 쌓은 책 왼쪽에 적을 자리. 눈금자에 겹치지 않게 미리 비워 둔다
  const labelPad = empty
    ? 0
    : (`${(o.stackMm / 10).toFixed(1)}cm`.length * 8.5 + 12) * u;
  const sp = OBJECT_SPACING[width < 480 * u ? "narrow" : "wide"];
  const gap = sp.gap * u;
  const start = 46 * u + labelPad;
  const inner = width - start - sp.right * u;
  const fill = sp.fill;
  const s = empty
    ? Math.min((inner - gap) / objWmm, (OBJECT_EMPTY_MAX_PX * u) / artMm)
    : (inner * fill - gap) / (stackWmm + objWmm);
  return {
    box,
    artMm,
    objWmm,
    stackWmm,
    gap,
    start,
    inner,
    s,
    maxMm: Math.max(o.stackMm, artMm) * 1.08,
  };
}

/**
 * 사물 모드 무대에 알맞은 높이(px). 폭이 축척을 정하면 위가 비므로 무대를 내용만큼 줄인다.
 * maxHeight를 넘지 않고, 너무 납작해지지 않게 minHeight 아래로도 줄이지 않는다.
 */
export function objectSceneHeight(o: {
  width: number;
  books: ReadingStackBook[];
  stackMm: number;
  object: StackObjectSpec;
  minHeight: number;
  maxHeight: number;
  u?: number;
}) {
  const u = o.u ?? 1;
  const f = objectFit({ ...o, u });
  const fit = f.maxMm * f.s + (OBJECT_PAD.top + OBJECT_PAD.floor) * u;
  return Math.round(Math.max(o.minHeight, Math.min(o.maxHeight, fit)));
}

/**
 * 독서 키재기 장면. 쌓은 책과 캐릭터를 같은 축척(px/mm)으로 놓는다.
 * books는 완독일 오름차순이어야 한다(바닥부터 쌓는다).
 */
export function buildStackScene(o: SceneOptions): SceneResult {
  const {
    width: W,
    height: H,
    books,
    stackMm,
    userMm,
    character,
    status,
    labels,
    colors: C,
    measure,
  } = o;
  const u = o.u ?? 1;
  const obj = o.object;
  const figure = !obj && o.figure !== false;
  // 쌓은 책 옆에 무언가(캐릭터·사물)를 세우는지
  const target = figure || Boolean(obj);
  const padTop = 74 * u;
  const floorPad = 30 * u;
  const rulerW = 46 * u;
  const floorY = H - floorPad;
  const aW = W - rulerW;
  const maxBookH = Math.max(210, ...books.map((b) => b.height));

  let maxMm: number;
  let s: number;
  let tcx: number;
  let fcx: number;
  let k: number;
  // 세운 것의 가로 범위(단위), 재는 높이와 그림 전체 높이(mm)
  let box: [number, number] = [0, 300];
  let targetMm = userMm;
  let artMm = userMm;
  if (obj) {
    const f = objectFit({ width: W, books, stackMm, object: obj, u });
    box = f.box;
    targetMm = obj.heightMm;
    artMm = f.artMm;
    s = Math.min(f.s, (H - padTop - floorPad) / f.maxMm);
    maxMm = (H - padTop - floorPad) / s;
    // 쌓은 책과 사물을 한 묶음으로 남는 폭 가운데에 둔다
    const groupW = (f.stackWmm + f.objWmm) * s + f.gap;
    const x0 = f.start + Math.max(0, (f.inner - groupW) / 2);
    tcx = x0 + (f.stackWmm * s) / 2;
    fcx = x0 + f.stackWmm * s + f.gap + (f.objWmm * s) / 2;
    k = (artMm * s) / 1000;
  } else {
    // 캐릭터가 없으면 몇 권만 쌓아도 바닥에 붙지 않게 쌓은 높이로 잡는다
    maxMm = figure
      ? Math.max(stackMm, userMm, 1000) * 1.04
      : Math.max(stackMm, 400) * 1.12;
    s = (H - padTop - floorPad) / maxMm;
    tcx = rulerW + aW * (figure ? 0.3 : 0.5);
    k = (userMm * s) / 1000;
    fcx = Math.min(rulerW + aW * 0.72, W - (300 * k) / 2 - 4 * u);
  }
  const fx = fcx - ((box[0] + box[1]) / 2) * k;
  // 말풍선이 넘지 않을 오른쪽 끝. 사물 무대는 끝에서 조금 띄운다(캐릭터 무대는 그대로)
  const bubbleW = obj ? W - (OBJECT_BUBBLE_PAD - 3) * u : W;
  const fy = floorY - targetMm * s;
  // 그림 꼭대기. 농구 골대처럼 재는 곳 위로 더 있으면 fy보다 위다
  const artTop = floorY - artMm * s;
  // 세운 것의 왼쪽 끝(px)
  const targetLeft = fx + box[0] * k;

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
  // 사물은 확대해 보므로 1cm 눈금까지 긋는다
  const minor = obj && 10 * s >= 5 * u ? 10 : 100;
  const majorEvery = minor === 10 ? 50 : 500;
  const labelEvery =
    (figure
      ? [500, 1000]
      : obj
        ? [10, 50, 100, 500, 1000]
        : [100, 500, 1000]
    ).find((v) => v * s >= 26 * u) ?? 1000;
  for (let mm = minor; mm <= maxMm; mm += minor) {
    const y = floorY - mm * s;
    const major = mm % majorEvery === 0;
    if (!major && minor * s < 5 * u) continue;
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

  // 쌓은 책 발밑 그림자. 사물 무대는 책이 없으면 자리를 비워 두지 않으므로 긋지 않는다
  if (!obj || books.length) {
    const tw0 = maxBookH * s;
    let shadow = "";
    for (let x = -tw0 * 0.62; x <= tw0 * 0.62; x += 4.2 * u) {
      const e = 1 - (x / (tw0 * 0.65)) ** 2;
      shadow += `M${f1(tcx + x)},${f1(floorY + 1.2 * u)} L${f1(tcx + x + 2.6 * u * e + 0.8 * u)},${f1(floorY + 2.2 * u + 4.2 * u * e)} `;
    }
    P(shadow, {
      id: "stack-shadow",
      stroke: C.ink,
      sw: 1 * u,
      cap: "round",
      op: 0.4,
    });
  }

  // 책. 눕혀 쌓으므로 가로가 책의 세로, 높이가 두께다
  let y = floorY;
  let left = W;
  let right = 0;
  // 한 권이 1px보다 얇으면 1px로 올려 보이게 하되, 그러면 쌓은 높이가 눈금보다 커지는
  // 다독(한 권 평균 1px 미만)일 때는 실제 두께 그대로 그린다
  const minBookPx = stackMm * s >= books.length ? 1 : 0;
  books.forEach((b) => {
    const r = rng(hashSeed(`${b.isbn}:${b.logId}`));
    const jx = r() - 0.5;
    const jr = r() - 0.5;
    const jj = Array.from({ length: 8 }, r);
    const w = b.height * s;
    const h = Math.max(minBookPx, b.depth * s);
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
      cls: "stack-book",
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
      cls: "stack-character",
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

  // 사물. 캐릭터처럼 가장 최근에 읽은 책 색을 한 군데 쓴다
  if (obj) {
    const held = books.length ? bookColor(books[books.length - 1]) : "#E7E5E4";
    out.push({
      k: "g",
      id: "object",
      cls: "stack-character",
      children: buildObject({
        fx,
        fy: artTop,
        k,
        colors: C,
        u,
        object: obj.id,
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
  let heightLabel = labels.myHeight;
  if (target) {
    const lineEnd = figure ? fx + 92 * k : targetLeft + 4 * u;
    A(`M${f1(rx)},${f1(fy)} L${f1(lineEnd)},${f1(fy)}`, {
      stroke: C.pen,
      sw: 1.6 * u,
      dash: [5 * u, 4 * u],
      cap: "round",
    });
    // 사물은 쌓은 책과 겹치지 않게 늘 점선 위에 두고, 말풍선과 부딪히면 짧은 이름표로 바꾼다
    if (obj && labels.myHeightShort) {
      const bubble = bubbleSpan(
        fcx,
        labels.bubble,
        u,
        bubbleW,
        rulerW + 4 * u,
        measure,
      );
      const right = rx + 6 * u + measure(heightLabel, 16 * u, 700, "hand");
      if (right > bubble.x - 4 * u) heightLabel = labels.myHeightShort;
    }
    out.push({
      k: "t",
      id: "my-height",
      x: rx + 6 * u,
      // 좁은 화면의 캐릭터는 말풍선이 위를 차지해 아래에 둔다
      y: fy + (figure && W < 360 * u ? 13 : -11) * u,
      t: heightLabel,
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
    // 쌓은 책 왼쪽에 적되, 눈금자에 걸치지 않게 눈금자 오른쪽으로 민다
    const labelW = measure(labels.stackHeight, 16 * u, 700, "hand");
    const lx = Math.max(left - 9 * u, rulerW + 4 * u + labelW);
    // 쌓은 책 꼭대기 눈금 옆에 적는다. 목표 이름표와 겹칠 때만 비키되,
    // 이름표가 점선 위에 있으면 그 아래로 딱 비킬 만큼만 내린다(멀리 떨어지면 어느 높이인지 헷갈린다).
    // 점선 아래에 이름표를 두는 좁은 화면의 캐릭터 무대는 전처럼 20px 내린다
    const targetRight = rx + 6 * u + measure(heightLabel, 16 * u, 700, "hand");
    const clash =
      target &&
      Math.abs(topY - fy) < 20 * u &&
      (!obj || lx - labelW < targetRight + 6 * u);
    const targetBelow = figure && W < 360 * u;
    const ly = !clash
      ? topY
      : targetBelow
        ? topY + 20 * u
        : Math.min(Math.max(topY, fy + 6 * u), floorY - 4 * u);
    AT({
      x: lx,
      y: ly,
      t: labels.stackHeight,
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
  if (target && gap > 34 * u) {
    const two = gap > 80 * u;
    const bw =
      Math.max(
        measure(labels.remain, 16 * u, 700, "hand"),
        two ? measure(labels.approxBooks, 14 * u, 700, "hand") : 0,
      ) +
      10 * u;
    // 글자 상자(종이색)가 눈금자를 덮지 않게 눈금자 오른쪽으로 민다
    const x = Math.max(tcx, rulerW + 6 * u + bw / 2);
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
    // 쌓은 책 꼭대기가 몸의 어디쯤인지 잇는 점선
    const bx = figure ? fx + 8 * k : targetLeft - 3 * u;
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
    cls: "stack-annotations",
    children: ann,
  });
  if (target) {
    out.push(
      bubbleItem(
        fcx,
        Math.min(fy, artTop) + 6 * u,
        labels.bubble,
        C,
        u,
        bubbleW,
        rulerW + 4 * u,
        measure,
        o.boil ?? false,
      ),
    );
  }

  return {
    items: out,
    stack: { left: Math.max(0, left), right, top: topY, bottom: floorY },
  };
}
