import type {
  LoungeMountainBand,
  MountainLandmark,
  MountainLandmarkId,
} from "@bookjeok/core";

import { buildArt } from "./figure";
import { drawLandmark, LANDMARK_ART } from "./figure-landmarks";
import { CLOUDS, drawCloud } from "./figure-sky";
import {
  clipSlab,
  insidePoly,
  MOUNTAIN_GULLIES,
  MOUNTAIN_OUTLINE,
  MOUNTAIN_SPINE,
  MOUNTAIN_SUMMIT_INDEX,
  MOUNTAIN_SUMMIT_X,
  outlineX,
} from "./mountain-shape";
import { createPencil } from "./pencil";
import { bubbleItem, bubbleRect } from "./scene";
import { type Cmds, f1, hashSeed, poly, type Pt, rng } from "./sketch";
import type {
  MeasureText,
  PathItem,
  SceneColors,
  SceneItem,
  TextItem,
} from "./types";

export interface MountainLabels {
  /** 꼭대기 옆 "3.86m" */
  total: string;
  /** 목표 점선 "기린 약 5m" */
  target: string;
  /** 남은 칸 "1.14m 남음" · "약 52권" */
  remain: string;
  approxBooks: string;
  /** 이번 주 괄호 "+25cm" · "이번 주" */
  week: string;
  weekSub: string;
  bubble: [string, string];
  /** 넘은 이정표 깃발 이름 */
  flags: Partial<Record<MountainLandmarkId, string>>;
}

export interface MountainSceneOptions {
  width: number;
  minHeight: number;
  maxHeight: number;
  /** 바닥부터 */
  bands: LoungeMountainBand[];
  totalMm: number;
  weekMm: number;
  /** 옆에 세울 이정표. 다 넘었으면 가장 높은 것 */
  target: MountainLandmark;
  /** 넘은 이정표. 산비탈에 깃발로 꽂는다 */
  passed: MountainLandmark[];
  /** 꼭대기 깃발·이정표 그림에 쓰는 한 가지 유채색(가장 최근에 올린 책) */
  heldColor: string;
  labels: MountainLabels;
  colors: SceneColors;
  measure: MeasureText;
  u?: number;
  boil?: boolean;
}

export interface MountainSceneResult {
  items: SceneItem[];
  /** 무대 높이(px). 폭이 축척을 정하므로 내용만큼 줄인다 */
  height: number;
}

/** 여백(px, u=1). 위는 말풍선 자리 */
const PAD = { top: 78, floor: 30, ruler: 46, left: 10, right: 14 };

/** 눈금 간격 후보(mm). 이름표끼리 28px 넘게 떨어지는 가장 작은 것을 쓴다 */
const RULER_STEPS = [
  100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000, 200_000,
  500_000, 1_000_000, 2_000_000, 5_000_000,
];

const rulerLabel = (mm: number) =>
  mm >= 1e6 ? `${mm / 1e6}km` : mm >= 1000 ? `${mm / 1000}m` : `${mm / 10}cm`;

/**
 * 산 너비(mm). 한 줄로 쌓으면 탑이 되므로 높이보다 넓은 산으로 그린다.
 * 너비는 뜻이 없는 값이고 높이만 실제다. 좁은 화면은 폭이 축척을 정해 조금 가파르게 둔다
 */
const baseWidthMm = (totalMm: number, narrow: boolean) =>
  Math.max(totalMm * (narrow ? 1.35 : 1.7), 800);

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const hits = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** 표지색에 종이색을 섞어 누그러뜨린다. 수백 권의 가는 띠가 원색 그대로면 바코드처럼 번쩍인다 */
const mute = (hex: string, paper = 0.18) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((n >> shift) & 255) * (1 - paper) + 255 * paper)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};

/** 높이 tw~꼭대기 사이에서 오른쪽 비탈이 가장 멀리 나간 곳(산 반폭 배수). 이번 주 괄호가 여기 선다 */
const weekReach = (tw: number) =>
  Math.max(
    ...Array.from({ length: 11 }, (_, i) =>
      outlineX(Math.min(0.999, tw + ((1 - tw) * i) / 10), 1),
    ),
  );

/**
 * 북적 책동산 장면. 모든 공개 기록의 두께를 더한 높이의 산을 권마다 표지색 띠로 쌓고,
 * 옆에 다음 이정표를 같은 축척으로 세운다. 화면만 그리므로(공유 이미지 없음) 한 벌로 끝난다.
 */
export function buildMountainScene(
  o: MountainSceneOptions,
): MountainSceneResult {
  const { width: W, totalMm, weekMm, target, labels, colors: C, measure } = o;
  const u = o.u ?? 1;
  const boil = o.boil ?? false;
  const art = LANDMARK_ART[target.id];
  const artMm = art
    ? (target.heightMm * 1000) / (1000 - (art.mark ?? 0))
    : target.heightMm;
  const artWmm = art ? (artMm * (art.x[1] - art.x[0])) / 1000 : 0;
  const baseMm = baseWidthMm(totalMm, W < 480 * u);

  const hand = (t: string, size: number) => measure(t, size, 700, "hand");
  const weekOn = weekMm > 0 && totalMm > 0;
  const weekW = weekOn
    ? Math.max(hand(labels.week, 16 * u), hand(labels.weekSub, 13 * u)) + 18 * u
    : 0;
  const start = PAD.ruler * u + PAD.left * u;
  const inner = W - start - PAD.right * u;
  const narrow = W < 480 * u;
  // 폰은 말풍선·목표 이름이 위를 다 차지하므로 구름 몫의 하늘을 따로 둔다
  const skyPad = narrow ? 36 * u : 0;
  const pads = (PAD.top + PAD.floor) * u + skyPad;
  const fitMm = Math.max(totalMm, artMm) * 1.06;
  const scale = (gap: number) =>
    Math.max(
      1e-6,
      Math.min((o.maxHeight - pads) / fitMm, (inner - gap) / (baseMm + artWmm)),
    );
  // 이번 주 이름표는 꼭대기 오른쪽 하늘에 선다. 산이 좁아 이정표까지 닿으면 그만큼 벌린다
  let gap = 18 * u;
  if (weekW) {
    const tw = Math.max(0, (totalMm - weekMm) / totalMm);
    // 괄호는 이번 주 띠의 가장 바깥 비탈 옆에 서므로, 그 비탈이 산 반폭의 몇 배인지로 이름표 끝을 잰다
    const slope = weekReach(tw) - 1;
    for (let i = 0; i < 2; i++) {
      const B0 = (baseMm * scale(gap)) / 2;
      gap = Math.max(18 * u, B0 * slope + weekW + 10 * u);
    }
  }
  const s = scale(gap);
  const height = Math.round(
    Math.max(o.minHeight, Math.min(o.maxHeight, fitMm * s + pads)),
  );
  const floorY = height - PAD.floor * u;
  const maxMm = (height - pads) / s;

  // 산과 이정표를 한 묶음으로 남는 폭 가운데에 둔다
  const groupW = baseMm * s + gap + artWmm * s;
  const x0 = start + Math.max(0, (inner - groupW) / 2);
  const B = (baseMm * s) / 2;
  const mcx = x0 + B;
  const artLeft = x0 + baseMm * s + gap;
  const lcx = artLeft + (artWmm * s) / 2;
  const k = (artMm * s) / 1000;
  const artTop = floorY - artMm * s;
  const markY = floorY - target.heightMm * s;

  const hPx = totalMm * s;
  const summitY = floorY - hPx;
  // 정규화 윤곽(-1~1, 0~1)을 px로
  const X = (nx: number) => mcx + nx * B;
  const Y = (t: number) => floorY - t * hPx;
  /** 높이 t의 가장 바깥 비탈 x(px) */
  const edge = (t: number, side: -1 | 1) => X(outlineX(t, side));
  const peakX = X(MOUNTAIN_SUMMIT_X);

  const out: SceneItem[] = [];
  const P = (d: string, a: Omit<PathItem, "k" | "d">) =>
    out.push({ k: "p", d, ...a });
  const halo = (item: Omit<TextItem, "k" | "halo">): TextItem => ({
    k: "t",
    halo: C.paper,
    hw: 5 * u,
    ...item,
  });

  // 눈금자
  const rx = PAD.ruler * u - 12 * u;
  P(`M${f1(rx)},${f1(floorY)} L${f1(rx)},${f1(floorY - maxMm * s)}`, {
    id: "ruler",
    stroke: C.muted,
    sw: 1.2 * u,
    cap: "round",
  });
  const step =
    RULER_STEPS.find((v) => v * s >= 28 * u) ??
    RULER_STEPS[RULER_STEPS.length - 1];
  const minor = step / 5;
  for (let mm = minor; mm <= maxMm; mm += minor) {
    const major = Math.round(mm / minor) % 5 === 0;
    if (!major && minor * s < 5 * u) continue;
    const y = floorY - mm * s;
    P(`M${f1(rx)},${f1(y)} L${f1(rx + (major ? 9 : 4.5) * u)},${f1(y)}`, {
      id: `tick-${mm}`,
      stroke: C.muted,
      sw: (major ? 1.3 : 1) * u,
      cap: "round",
    });
    if (major)
      out.push(
        halo({
          id: `tick-label-${mm}`,
          x: rx - 5 * u,
          y,
          t: rulerLabel(Math.round(mm)),
          size: 14 * u,
          weight: 700,
          fam: "hand",
          fill: C.faint,
          anchor: "end",
          hw: 4 * u,
        }),
      );
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

  // 글자 자리. 깃발 이름이 꼭대기 높이·목표 이름과 겹치면 적지 않는다
  const size = 16 * u;
  const totalW = hand(labels.total, 18 * u);
  const totalX = Math.max(rx + 8 * u + totalW, edge(0.96, -1) - 8 * u);
  const totalY = summitY - 4 * u;
  // 목표 이름은 점선 위에 두되, 꼭대기 높이 이름표나 말풍선에 부딪히면 점선 아래로 비킨다
  const bubbleBox: Box | null = art
    ? (() => {
        const b = bubbleRect(
          lcx,
          artTop + 6 * u,
          labels.bubble,
          u,
          W - 9 * u,
          PAD.ruler * u + 4 * u,
          measure,
        );
        return { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h + 11 * u };
      })()
    : null;
  const targetBox = (y: number): Box => ({
    x0: rx + 4 * u,
    y0: y - 10 * u,
    x1: rx + 8 * u + hand(labels.target, size),
    y1: y + 10 * u,
  });
  const nearSummit =
    totalMm > 0 && Math.abs(summitY - (markY - 11 * u)) < 18 * u;
  const underBubble =
    bubbleBox !== null && hits(targetBox(markY - 11 * u), bubbleBox);
  const targetY = nearSummit || underBubble ? markY + 13 * u : markY - 11 * u;
  const taken: Box[] = [
    {
      x0: totalX - totalW - 2 * u,
      y0: totalY - 11 * u,
      x1: totalX + 2 * u,
      y1: totalY + 11 * u,
    },
    targetBox(targetY),
  ];

  // 남은 높이 화살표(꼭대기 깃발 위에서 점선까지)와 이번 주 이름표 자리. 구름이 피해 가야 해서 먼저 잰다
  const ry1 = summitY - 26 * u;
  const ry2 = markY + 6 * u;
  const remainOn = totalMm > 0 && ry1 - ry2 > 30 * u;
  const remainTwo = ry1 - ry2 > 70 * u;
  const remainW =
    Math.max(
      hand(labels.remain, size),
      remainTwo ? hand(labels.approxBooks, 14 * u) : 0,
    ) +
    10 * u;
  const remainH = (remainTwo ? 38 : 20) * u;
  const remainMid = (ry1 + ry2) / 2;
  const weekTw = totalMm > 0 ? Math.max(0, (totalMm - weekMm) / totalMm) : 1;
  const weekYA = floorY - weekTw * hPx;
  const weekX = X(weekReach(weekTw)) + 7 * u;
  const weekY = Math.min(floorY - 26 * u, (weekYA + summitY) / 2);

  // 구름. 산보다 먼저 그려 산 뒤로 숨고, 이정표·말풍선·글자와는 겹치지 않는 하늘에만 띄운다.
  // 위치는 고정 시드라 다시 그려도 제자리다
  const clouds: SceneItem[] = [];
  const cr = rng(hashSeed("bookjeok-mountain-clouds"));
  const cloudN = narrow ? 2 : 3;
  const drift = (narrow ? 6 : 14) * u;
  const skyL = rx + 34 * u;
  const skyR = W - 16 * u;
  const skyTop = 12 * u;
  // 폰은 위쪽을 말풍선·목표 이름이 차지해 조금 더 아래까지 띄운다
  const skyBottom = Math.max(skyTop + 40 * u, floorY * (narrow ? 0.62 : 0.45));
  const avoid: Box[] = [
    ...taken,
    // 꼭대기 깃발, 남은 높이 화살표·글자 상자, 이번 주 이름표
    ...(totalMm > 0
      ? [
          {
            x0: peakX - 8 * u,
            y0: (remainOn ? ry2 : summitY - 24 * u) - 2 * u,
            x1: peakX + 16 * u,
            y1: summitY,
          },
        ]
      : []),
    ...(remainOn
      ? [
          {
            x0: peakX - remainW / 2,
            y0: remainMid - remainH / 2,
            x1: peakX + remainW / 2,
            y1: remainMid + remainH / 2,
          },
        ]
      : []),
    ...(weekOn
      ? [
          {
            x0: weekX - 6 * u,
            y0: weekY - 20 * u,
            x1: weekX + weekW,
            y1: weekY + 20 * u,
          },
        ]
      : []),
    ...(bubbleBox ? [bubbleBox] : []),
    ...(art
      ? [
          {
            x0: artLeft - 6 * u,
            y0: artTop - 6 * u,
            x1: artLeft + artWmm * s + 6 * u,
            y1: floorY,
          },
        ]
      : []),
  ];
  for (let i = 0; i < cloudN; i++) {
    const variant = (i + Math.floor(cr() * CLOUDS.length)) % CLOUDS.length;
    const cw = (narrow ? 64 : 112) * u * (0.8 + cr() * 0.4);
    // 그림 단위가 300×100이라 높이는 폭의 1/3
    const kk = cw / 300;
    const ch = 100 * kk;
    const slot = (skyR - skyL) / cloudN;
    // 흘러가는 폭만큼 좌우를 넉넉히 잡는다(폰은 조금만 겹쳐도 둔다). 제 칸에서 몇 자리를 대 보고 비어 있는 첫 자리에 둔다. 없으면 이 구름은 뺀다
    let spot: { cx: number; cy: number; box: Box } | null = null;
    for (let tries = 0; tries < 8 && !spot; tries++) {
      const cx = skyL + slot * i + cw / 2 + cr() * Math.max(0, slot - cw);
      const cy = skyTop + ch / 2 + cr() * Math.max(0, skyBottom - skyTop - ch);
      const box = {
        x0: cx - cw / 2 - drift,
        y0: cy - ch / 2,
        x1: cx + cw / 2 + drift,
        y1: cy + ch / 2 + 2 * u,
      };
      if (box.x1 <= skyR && !avoid.some((b) => hits(box, b)))
        spot = { cx, cy, box };
    }
    if (!spot) continue;
    avoid.push(spot.box);
    const { cx, cy } = spot;
    const p = createPencil({
      T: (x, y) => [cx + (x - 150) * kk, cy + (y - 50) * kk],
      C,
      u,
      seed: 811 + i * 37,
    });
    drawCloud(p, variant);
    clouds.push({
      k: "g",
      id: `cloud-${i}`,
      cls: `mountain-cloud mountain-cloud-${i}`,
      children: p.items,
    });
  }
  out.push({ k: "g", id: "sky", cls: "mountain-sky", children: clouds });

  const mountain: SceneItem[] = [];
  if (totalMm > 0) {
    const outline: Pt[] = MOUNTAIN_OUTLINE.map(([nx, t]) => [X(nx), Y(t)]);
    // 지층. 권마다(많으면 몇 권씩) 표지색 띠 하나를 윤곽으로 잘라 칠한다
    let cum = 0;
    o.bands.forEach((b, i) => {
      const yBottom = Y(cum / totalMm);
      cum += b.mm;
      const yTop = Y(cum / totalMm);
      // 이웃 띠와 살짝 겹쳐 틈(흰 머리카락 선)이 보이지 않게 한다
      const slab = clipSlab(outline, yTop, yBottom + (i > 0 ? 0.6 : 0));
      if (slab.length >= 3)
        mountain.push({
          k: "p",
          id: `band-${i}`,
          d: poly(slab),
          fill: mute(b.color),
        });
    });

    // 오른쪽 면 그늘: 등성이에서 오른쪽 비탈까지 옅은 먹 한 겹과 해칭
    const spine: Pt[] = MOUNTAIN_SPINE.map(([nx, t]) => [X(nx), Y(t)]);
    const face: Pt[] = [
      ...spine,
      ...outline.slice(MOUNTAIN_SUMMIT_INDEX).reverse(),
    ];
    mountain.push({
      k: "p",
      id: "shade-face",
      d: poly(face),
      fill: C.ink,
      op: 0.1,
    });
    const hr = rng(hashSeed("bookjeok-mountain-hatch"));
    const hatchCmds: Cmds = [];
    const hs = 7 * u;
    for (let y = summitY + 10 * u; y < floorY - 4 * u; y += hs * 1.2)
      for (let x = peakX; x < X(1); x += hs) {
        const a: Pt = [x + (hr() - 0.5) * 3 * u, y + (hr() - 0.5) * 3 * u];
        const b: Pt = [a[0] + 5 * u, a[1] - 5 * u];
        if (hr() < 0.35 || !insidePoly(face, a) || !insidePoly(face, b))
          continue;
        hatchCmds.push("M", a[0], a[1], "L", b[0], b[1]);
      }

    // 윤곽·등성이·골짜기. 사물처럼 세 벌을 번갈아 보여 떨리게 한다
    const ridge: Cmds = outline.flatMap(([x, y], i) => [i ? "L" : "M", x, y]);
    const spineCmds: Cmds = spine.flatMap(([x, y], i) => [i ? "L" : "M", x, y]);
    const gullies: Cmds = MOUNTAIN_GULLIES.flatMap((g) =>
      g.flatMap(([nx, t], i) => [i ? "L" : "M", X(nx), Y(t)]),
    );
    for (const v of boil ? [0, 1, 2] : [0]) {
      const p = createPencil({
        T: (x, y) => [x, y],
        C,
        u,
        seed: 613 + v * 53,
      });
      if (v === 0 && hatchCmds.length) p.hatch(hatchCmds, { op: 0.26, w: 0.8 });
      p.pen(gullies, { w: 1, light: false, op: 0.35 });
      p.pen(spineCmds, { w: 1.2, light: false, op: 0.6 });
      p.pen(ridge, { w: 1.9, a: 1.1 });
      mountain.push({
        k: "g",
        id: `ridge-${v}`,
        cls: boil ? `stack-boil stack-boil-${v}` : "stack-figure",
        children: p.items,
      });
    }

    // 깃발. 연필로 그린 깃대와 바람에 휜 깃. 꼭대기는 가장 최근에 올린 책 색, 넘은 이정표는 흰 깃
    const flag = (
      id: string,
      x: number,
      y: number,
      h: number,
      dir: -1 | 1,
      color: string,
    ): SceneItem => {
      const p = createPencil({
        T: (px, py) => [px, py],
        C,
        u,
        seed: hashSeed(id) % 997,
      });
      const top = y - h;
      const w = h * 0.72 * dir;
      const cloth: Cmds = [
        "M",
        x,
        top,
        "C",
        x + w * 0.35,
        top - h * 0.08,
        x + w * 0.6,
        top + h * 0.1,
        x + w,
        top + h * 0.12,
        "C",
        x + w * 0.62,
        top + h * 0.3,
        x + w * 0.35,
        top + h * 0.34,
        x,
        top + h * 0.42,
        "Z",
      ];
      p.fill(cloth, color);
      p.pen(cloth, { closed: true, w: 1.2, light: false });
      p.pen(["M", x, y + 1 * u, "L", x, top - 1.5 * u], {
        w: 1.4,
        light: false,
      });
      return { k: "g", id, cls: "stack-figure", children: p.items };
    };
    mountain.push(flag("summit-flag", peakX, summitY, 20 * u, 1, o.heldColor));

    // 넘은 이정표 깃발. 왼쪽 비탈에 꽂고 이름은 눈금자와 겹치지 않을 때만 적는다
    let lastLabelY = Infinity;
    o.passed.forEach((l) => {
      if (l.heightMm > totalMm) return;
      const t = l.heightMm / totalMm;
      const y = floorY - l.heightMm * s;
      const x = edge(t, -1) + 2 * u;
      const top = y - 16 * u;
      // 꼭대기 높이·목표 이름에 깃대가 걸리면 깃발째 뺀다
      const pole = { x0: x - 12 * u, y0: top, x1: x + 1 * u, y1: y };
      if (taken.some((b) => hits(pole, b))) return;
      mountain.push(flag(`flag-${l.id}`, x, y, 16 * u, -1, C.paper));
      const name = labels.flags[l.id];
      const lx = x - 13 * u;
      const ly = top + 3 * u;
      const w = name ? hand(name, 13 * u) : 0;
      const box = {
        x0: lx - w - 2 * u,
        y0: ly - 9 * u,
        x1: lx,
        y1: ly + 9 * u,
      };
      if (
        name &&
        box.x0 > rx + 11 * u &&
        lastLabelY - ly > 15 * u &&
        !taken.some((b) => hits(box, b))
      ) {
        mountain.push(
          halo({
            id: `flag-label-${l.id}`,
            x: lx,
            y: ly,
            t: name,
            size: 13 * u,
            weight: 700,
            fam: "hand",
            fill: C.muted,
            anchor: "end",
            hw: 4 * u,
          }),
        );
        lastLabelY = ly;
      }
    });
  }
  out.push({
    k: "g",
    id: "mountain",
    cls: "mountain-rise",
    children: mountain,
  });

  // 이정표
  if (art)
    out.push({
      k: "g",
      id: "landmark",
      cls: "stack-character",
      children: buildArt({
        fx: artLeft - art.x[0] * k,
        fy: artTop,
        k,
        colors: C,
        u,
        box: art.x,
        draw: (p) =>
          drawLandmark(p, { landmark: target.id, heldColor: o.heldColor }),
        boil,
      }),
    });

  // 주석
  const ann: SceneItem[] = [];
  const lineEnd = art ? artLeft + 4 * u : W - PAD.right * u;
  ann.push({
    k: "p",
    d: `M${f1(rx)},${f1(markY)} L${f1(lineEnd)},${f1(markY)}`,
    stroke: C.pen,
    sw: 1.6 * u,
    dash: [5 * u, 4 * u],
    cap: "round",
  });
  ann.push(
    halo({
      id: "target",
      x: rx + 6 * u,
      y: targetY,
      t: labels.target,
      size,
      weight: 700,
      fam: "hand",
      fill: C.pen,
      anchor: "start",
    }),
  );

  if (totalMm > 0) {
    ann.push(
      halo({
        id: "total",
        x: totalX,
        y: totalY,
        t: labels.total,
        size: 18 * u,
        weight: 700,
        fam: "hand",
        fill: C.ink,
        anchor: "end",
      }),
    );

    // 남은 높이. 꼭대기 깃발 위에서 점선까지
    if (remainOn) {
      const y1 = ry1;
      const y2 = ry2;
      const two = remainTwo;
      const bw = remainW;
      const bh = remainH;
      const my = remainMid;
      ann.push(
        {
          k: "p",
          d: `M${f1(peakX)},${f1(y1)} L${f1(peakX)},${f1(y2)}`,
          stroke: C.pen,
          sw: 1.6 * u,
          dash: [4 * u, 4 * u],
          cap: "round",
        },
        {
          k: "p",
          d: `M${f1(peakX - 4.5 * u)},${f1(y2 + 6 * u)} L${f1(peakX)},${f1(y2)} L${f1(peakX + 4.5 * u)},${f1(y2 + 6 * u)}`,
          stroke: C.pen,
          sw: 1.6 * u,
          cap: "round",
          join: "round",
        },
        {
          k: "p",
          d: `M${f1(peakX - bw / 2)},${f1(my - bh / 2)} h${f1(bw)} v${f1(bh)} h${f1(-bw)} Z`,
          fill: C.paper,
        },
        halo({
          x: peakX,
          y: two ? my - 8 * u : my,
          t: labels.remain,
          size,
          weight: 700,
          fam: "hand",
          fill: C.pen,
          anchor: "middle",
        }),
      );
      if (two)
        ann.push(
          halo({
            x: peakX,
            y: my + 10 * u,
            t: labels.approxBooks,
            size: 14 * u,
            weight: 700,
            fam: "hand",
            fill: C.pen,
            anchor: "middle",
            op: 0.8,
          }),
        );
    }

    // 이번 주 올라간 만큼 꼭대기 오른쪽에 괄호
    if (weekOn) {
      const yA = weekYA;
      const xb = weekX;
      const wy = weekY;
      const tall = yA - summitY >= 3 * u;
      ann.push({
        k: "p",
        id: "week-bracket",
        d: tall
          ? `M${f1(xb - 4 * u)},${f1(yA)} L${f1(xb)},${f1(yA)} L${f1(xb)},${f1(summitY)} L${f1(xb - 4 * u)},${f1(summitY)}`
          : `M${f1(xb - 4 * u)},${f1(summitY)} L${f1(xb + 2 * u)},${f1(summitY)}`,
        stroke: C.pen,
        sw: 1.5 * u,
        cap: "round",
        join: "round",
      });
      ann.push(
        halo({
          id: "week",
          x: xb + 6 * u,
          y: wy - 8 * u,
          t: labels.week,
          size,
          weight: 700,
          fam: "hand",
          fill: C.pen,
          anchor: "start",
        }),
        halo({
          id: "week-sub",
          x: xb + 6 * u,
          y: wy + 9 * u,
          t: labels.weekSub,
          size: 13 * u,
          weight: 700,
          fam: "hand",
          fill: C.muted,
          anchor: "start",
        }),
      );
    }
  }
  out.push({
    k: "g",
    id: "annotations",
    cls: "stack-annotations",
    children: ann,
  });

  if (art)
    out.push(
      bubbleItem(
        lcx,
        artTop + 6 * u,
        labels.bubble,
        C,
        u,
        W - 9 * u,
        PAD.ruler * u + 4 * u,
        measure,
        boil,
      ),
    );

  return { items: out, height };
}
