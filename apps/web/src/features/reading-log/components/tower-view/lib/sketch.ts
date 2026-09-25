/**
 * 손그림 선을 만드는 도구. 경로를 촘촘히 점으로 풀어 흔든 뒤 다시 잇는다.
 * 경로 명령은 SVG와 같은 문자·숫자 배열(`["M", x, y, "C", ...]`)이다.
 */
export type Cmds = (string | number)[];
export type Pt = [number, number];

export const f1 = (v: number) => v.toFixed(1);

/** 시드가 같으면 같은 수열을 낸다. 다시 그려도 선 모양이 바뀌지 않게 한다 */
export function rng(seed: number) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 문자열 → 32비트 정수. 책마다 고정된 흔들림을 주는 시드로 쓴다 */
export function hashSeed(text: string) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 경로를 하위 경로별 점 목록으로 푼다(M마다 새 하위 경로) */
export function samplePath(
  cmds: Cmds,
  T: (x: number, y: number) => Pt,
): Pt[][] {
  const subs: Pt[][] = [];
  let pts: Pt[] = [];
  let cx = 0;
  let cy = 0;
  let i = 0;
  const num = () => cmds[i++] as number;
  const push = (x: number, y: number) => pts.push(T(x, y));
  while (i < cmds.length) {
    const c = cmds[i++];
    if (c === "M") {
      cx = num();
      cy = num();
      pts = [];
      subs.push(pts);
      push(cx, cy);
    } else if (c === "L") {
      const x = num();
      const y = num();
      const n = Math.max(3, Math.ceil(Math.hypot(x - cx, y - cy) / 6));
      for (let s = 1; s <= n; s++)
        push(cx + ((x - cx) * s) / n, cy + ((y - cy) * s) / n);
      cx = x;
      cy = y;
    } else if (c === "C") {
      const [x1, y1, x2, y2, x, y] = [num(), num(), num(), num(), num(), num()];
      const len =
        Math.hypot(x1 - cx, y1 - cy) +
        Math.hypot(x2 - x1, y2 - y1) +
        Math.hypot(x - x2, y - y2);
      const n = Math.max(4, Math.ceil(len / 6));
      for (let s = 1; s <= n; s++) {
        const t = s / n;
        const m = 1 - t;
        push(
          m * m * m * cx +
            3 * m * m * t * x1 +
            3 * m * t * t * x2 +
            t * t * t * x,
          m * m * m * cy +
            3 * m * m * t * y1 +
            3 * m * t * t * y2 +
            t * t * t * y,
        );
      }
      cx = x;
      cy = y;
    } else if (c === "Q") {
      const [x1, y1, x, y] = [num(), num(), num(), num()];
      const n = Math.max(
        4,
        Math.ceil(
          (Math.hypot(x1 - cx, y1 - cy) + Math.hypot(x - x1, y - y1)) / 6,
        ),
      );
      for (let s = 1; s <= n; s++) {
        const t = s / n;
        const m = 1 - t;
        push(
          m * m * cx + 2 * m * t * x1 + t * t * x,
          m * m * cy + 2 * m * t * y1 + t * t * y,
        );
      }
      cx = x;
      cy = y;
    }
  }
  return subs;
}

/** 점 목록을 저주파로 흔들어 다시 잇는다. amp는 px */
export function wobble(
  subs: Pt[][],
  seed: number,
  amp: number,
  closed: boolean,
) {
  const r = rng(seed);
  return subs
    .map((pts) => {
      const ph = [r(), r(), r(), r()].map((v) => v * 6.283);
      let L = 0;
      let d = "";
      pts.forEach((p, i) => {
        if (i) L += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
        const x =
          p[0] +
          amp *
            (Math.sin(L / 21 + ph[0]) * 0.65 +
              Math.sin(L / 8.3 + ph[1]) * 0.35);
        const y =
          p[1] +
          amp *
            (Math.sin(L / 17 + ph[2]) * 0.65 +
              Math.sin(L / 7.1 + ph[3]) * 0.35);
        d += `${i ? " L" : "M"}${f1(x)},${f1(y)}`;
      });
      return d + (closed ? " Z" : "");
    })
    .join(" ");
}

export function rectCorners(
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
): Pt[] {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return (
    [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ] as Pt[]
  ).map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

export const lerp = (a: Pt, b: Pt, t: number): Pt => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

export const poly = (pts: Pt[]) =>
  "M" + pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(" L") + " Z";

/** 모서리와 변 가운데를 살짝 흔든 사각형. 책 윤곽선에 쓴다 */
export function sketchPoly(pts: Pt[], j: number[], amp: number) {
  const q = pts.map((p, i) => [
    p[0] + (j[i] - 0.5) * amp,
    p[1] + (j[(i + 3) % 8] - 0.5) * amp,
  ]);
  let d = `M${f1(q[0][0])},${f1(q[0][1])}`;
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const mx = (a[0] + b[0]) / 2 + (j[(i + 4) % 8] - 0.5) * amp * 1.6;
    const my = (a[1] + b[1]) / 2 + (j[(i + 5) % 8] - 0.5) * amp * 1.6;
    d += ` Q${f1(mx)},${f1(my)} ${f1(b[0])},${f1(b[1])}`;
  }
  return d + " Z";
}
