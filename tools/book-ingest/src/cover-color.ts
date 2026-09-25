import sharp from "sharp";

/**
 * 표지 대표색(`book_dimensions.coverColor`, `#rrggbb`).
 *
 * 운영 적재분을 만든 `~/bookjeok-migration/scripts/cover-colors.mjs`와 같은 방법입니다.
 * 바꾸면 기존 5만여 행과 새 행의 색이 다른 기준이 되므로 함께 바꾸지 않는 한 그대로 둡니다.
 * 24×36으로 줄여 k-means 5군집 → 가장 큰 군집. 그것이 흰색이면 26% 이상인 유색 군집,
 * 그것도 없으면 종이색에 유색 군집을 7% 섞습니다(흰 표지가 탑에서 새하얗게 보이지 않게).
 */
export async function coverColor(image: Buffer): Promise<string> {
  const data = await sharp(image)
    .resize(24, 36, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
  const px: Rgb[] = [];
  for (let i = 0; i < data.length; i += 3) {
    px.push([data[i], data[i + 1], data[i + 2]]);
  }
  const clusters = kmeans(px);
  let base = clusters[0].c;
  if (isWhite(base)) {
    const alt = clusters.find((x) => !isWhite(x.c) && x.n >= 0.26);
    base = alt
      ? alt.c
      : mix(PAPER, clusters.find((x) => !isWhite(x.c))?.c ?? PAPER, 0.07);
  }
  return hex(base);
}

type Rgb = [number, number, number];

const PAPER: Rgb = [236, 231, 222];

const lin = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]: Rgb) =>
  0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const chroma = ([r, g, b]: Rgb) => Math.max(r, g, b) - Math.min(r, g, b);
const isWhite = (c: Rgb) => lum(c) > 0.72 && chroma(c) < 40;
const dist = (a: Rgb, b: Rgb) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const mix = (a: Rgb, b: Rgb, t: number): Rgb =>
  a.map((v, i) => v + (b[i] - v) * t) as Rgb;
const hex = (c: Rgb) =>
  "#" +
  c
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

/** 결정적 초기값(목록의 0·⅓·½·0.8·끝 지점)으로 12회. 군집을 비중 큰 순으로 돌려줍니다. */
function kmeans(px: Rgb[], k = 5): { c: Rgb; n: number }[] {
  let centers: Rgb[] = [0, 1 / 3, 1 / 2, 0.8, 1]
    .slice(0, k)
    .map((f) => [...px[Math.min(px.length - 1, Math.floor(px.length * f))]]);
  const assigned = new Array<number>(px.length).fill(0);
  for (let it = 0; it < 12; it += 1) {
    px.forEach((p, i) => {
      let best = 0;
      let bestDist = Infinity;
      centers.forEach((c, j) => {
        const d = dist(p, c);
        if (d < bestDist) {
          bestDist = d;
          best = j;
        }
      });
      assigned[i] = best;
    });
    centers = centers.map((c, j) => {
      let n = 0;
      const sum: Rgb = [0, 0, 0];
      px.forEach((p, i) => {
        if (assigned[i] !== j) return;
        n += 1;
        sum[0] += p[0];
        sum[1] += p[1];
        sum[2] += p[2];
      });
      return n ? (sum.map((v) => v / n) as Rgb) : c;
    });
  }
  return centers
    .map((c, j) => ({
      c,
      n: assigned.filter((a) => a === j).length / px.length,
    }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
}
