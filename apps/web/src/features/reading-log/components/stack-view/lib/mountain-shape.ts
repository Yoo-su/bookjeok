import type { Pt } from "./sketch";

/**
 * 책동산 윤곽. x는 산 반폭의 배수(-1~1), y는 바닥 0~꼭대기 1.
 * 왼쪽에 어깨, 오른쪽에 낮은 둘째 봉우리를 둬 원뿔 더미로 보이지 않게 한 손그림 윤곽이다
 */
const OUTLINE_KEYS: Pt[] = [
  [-1, 0],
  [-0.88, 0.07],
  [-0.77, 0.15],
  [-0.68, 0.25],
  [-0.6, 0.33],
  [-0.52, 0.365],
  [-0.44, 0.41],
  [-0.33, 0.55],
  [-0.21, 0.72],
  [-0.11, 0.87],
  [-0.04, 0.97],
  [0, 1],
  [0.05, 0.975],
  [0.11, 0.9],
  [0.19, 0.78],
  [0.27, 0.69],
  [0.35, 0.655],
  [0.42, 0.675],
  [0.49, 0.64],
  [0.57, 0.53],
  [0.67, 0.38],
  [0.78, 0.22],
  [0.9, 0.08],
  [1, 0],
];

/** 오른쪽 비탈을 그늘로 나누는 등성이. 꼭대기에서 오른쪽 아래로 */
const SPINE_KEYS: Pt[] = [
  [0, 1],
  [0.04, 0.84],
  [0.1, 0.66],
  [0.17, 0.47],
  [0.25, 0.27],
  [0.31, 0.1],
  [0.34, 0],
];

/** 등성이에서 흘러내리는 골짜기 몇 줄. 왼쪽 면에만 */
export const MOUNTAIN_GULLIES: Pt[][] = [
  [
    [-0.03, 0.86],
    [-0.08, 0.76],
    [-0.15, 0.66],
  ],
  [
    [-0.07, 0.56],
    [-0.15, 0.45],
    [-0.26, 0.33],
  ],
  [
    [-0.02, 0.36],
    [-0.08, 0.24],
    [-0.16, 0.13],
  ],
  [
    [-0.47, 0.34],
    [-0.55, 0.24],
    [-0.62, 0.16],
  ],
];

/** 키 점 사이를 부드럽게 잇는다(Catmull-Rom). 높이는 0~1을 넘지 않게 자른다 */
function smooth(points: Pt[], seg: number): Pt[] {
  const out: Pt[] = [];
  const at = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < seg; s++) {
      const t = s / seg;
      const f = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] +
          (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t);
      out.push([f(0), Math.max(0, Math.min(1, f(1)))]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** 왼쪽 바닥 → 꼭대기 → 오른쪽 바닥 */
export const MOUNTAIN_OUTLINE = smooth(OUTLINE_KEYS, 8);
export const MOUNTAIN_SPINE = smooth(SPINE_KEYS, 6);
export const MOUNTAIN_SUMMIT_INDEX = MOUNTAIN_OUTLINE.reduce(
  (best, p, i, a) => (p[1] > a[best][1] ? i : best),
  0,
);
export const MOUNTAIN_SUMMIT_X = MOUNTAIN_OUTLINE[MOUNTAIN_SUMMIT_INDEX][0];

/** 높이 t에서 윤곽이 지나는 가장 바깥 x. side -1이면 왼쪽 끝, 1이면 오른쪽 끝 */
export function outlineX(t: number, side: -1 | 1): number {
  let best = MOUNTAIN_SUMMIT_X;
  let found = false;
  for (let i = 0; i < MOUNTAIN_OUTLINE.length - 1; i++) {
    const [x1, y1] = MOUNTAIN_OUTLINE[i];
    const [x2, y2] = MOUNTAIN_OUTLINE[i + 1];
    if ((y1 - t) * (y2 - t) > 0 || y1 === y2) continue;
    const x = x1 + ((x2 - x1) * (t - y1)) / (y2 - y1);
    if (!found || (side < 0 ? x < best : x > best)) best = x;
    found = true;
  }
  return best;
}

/** 다각형을 가로 띠 [yMin, yMax]로 자른다(Sutherland–Hodgman). 오목한 윤곽도 채우기에는 충분하다 */
export function clipSlab(poly: Pt[], yMin: number, yMax: number): Pt[] {
  const cut = (pts: Pt[], keep: (p: Pt) => boolean, y: number) => {
    const out: Pt[] = [];
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length];
      const ai = keep(a);
      if (ai) out.push(a);
      if (ai !== keep(b)) {
        const k = (y - a[1]) / (b[1] - a[1]);
        out.push([a[0] + (b[0] - a[0]) * k, y]);
      }
    });
    return out;
  };
  return cut(
    cut(poly, (p) => p[1] >= yMin, yMin),
    (p) => p[1] <= yMax,
    yMax,
  );
}

export function insidePoly(poly: Pt[], [x, y]: Pt): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
