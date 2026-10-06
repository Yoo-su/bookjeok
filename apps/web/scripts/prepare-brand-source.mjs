// One-time conversion of the approved A raster into flat, self-contained vector paths.
// No redraw: follow the alpha silhouette; retain the small moss-colored tip separately.
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const source = new URL(
  "../../../assets/brand/pen-v1/source.png",
  import.meta.url,
);
const target = new URL("../../../assets/brand/pen-v1/", import.meta.url);
await mkdir(target, { recursive: true });
const { data, info } = await sharp(await readFile(source))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height } = info;
const stride = width + 1;
const solid = new Uint8Array(width * height);
const green = new Uint8Array(width * height);
for (let i = 0; i < solid.length; i++) {
  const p = i * 4;
  solid[i] = data[p + 3] >= 128 ? 1 : 0;
  green[i] = solid[i] && data[p] > 55 && data[p + 1] - data[p + 2] > 15 ? 1 : 0;
}
function simplify(points, tolerance = 0.85) {
  if (points.length < 3) return points;
  const first = points[0],
    last = points.at(-1);
  const dx = last[0] - first[0],
    dy = last[1] - first[1];
  let distance = 0,
    split = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const t =
      dx || dy
        ? Math.max(
            0,
            Math.min(
              1,
              ((x - first[0]) * dx + (y - first[1]) * dy) / (dx * dx + dy * dy),
            ),
          )
        : 0;
    const d = Math.hypot(x - first[0] - t * dx, y - first[1] - t * dy);
    if (d > distance) {
      distance = d;
      split = i;
    }
  }
  return distance > tolerance
    ? [
        ...simplify(points.slice(0, split + 1), tolerance).slice(0, -1),
        ...simplify(points.slice(split), tolerance),
      ]
    : [first, last];
}
function trace(mask) {
  const edges = new Map();
  const add = (x1, y1, x2, y2) => {
    const key = y1 * stride + x1;
    if (!edges.has(key)) edges.set(key, []);
    edges.get(key).push(y2 * stride + x2);
  };
  const at = (x, y) =>
    x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (at(x, y)) {
        if (!at(x, y - 1)) add(x, y, x + 1, y);
        if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
        if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
        if (!at(x - 1, y)) add(x, y + 1, x, y);
      }
  const coord = (k) => [k % stride, Math.floor(k / stride)];
  const direction = (a, b) =>
    b - a === 1 ? 0 : b - a === stride ? 1 : b - a === -1 ? 2 : 3;
  const rings = [];
  while (edges.size) {
    const start = edges.keys().next().value;
    const points = [];
    let current = start,
      previousDirection = null;
    do {
      points.push(coord(current));
      const nexts = edges.get(current);
      if (!nexts?.length) throw new Error("Unclosed contour");
      let selected = 0;
      if (nexts.length > 1 && previousDirection !== null) {
        const preference = [1, 0, 3, 2];
        selected = nexts
          .map((n, i) => [
            i,
            preference.indexOf(
              (direction(current, n) - previousDirection + 4) % 4,
            ),
          ])
          .sort((a, b) => a[1] - b[1])[0][0];
      }
      const next = nexts.splice(selected, 1)[0];
      if (!nexts.length) edges.delete(current);
      previousDirection = direction(current, next);
      current = next;
    } while (current !== start);
    const area =
      Math.abs(
        points.reduce((sum, p, i) => {
          const q = points[(i + 1) % points.length];
          return sum + p[0] * q[1] - q[0] * p[1];
        }, 0),
      ) / 2;
    if (area < 6) continue;
    let farthest = 1;
    for (let i = 2; i < points.length; i++)
      if (
        Math.hypot(points[i][0] - points[0][0], points[i][1] - points[0][1]) >
        Math.hypot(
          points[farthest][0] - points[0][0],
          points[farthest][1] - points[0][1],
        )
      )
        farthest = i;
    const ring = [
      ...simplify(points.slice(0, farthest + 1)).slice(0, -1),
      ...simplify([...points.slice(farthest), points[0]]).slice(0, -1),
    ];
    rings.push(
      `M${ring.map((p) => p.map((n) => +((n * 512) / width).toFixed(2)).join(" ")).join("L")}Z`,
    );
  }
  return rings.join("");
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><path fill="#20201c" fill-rule="evenodd" d="${trace(solid)}"/><path fill="#5c6848" fill-rule="evenodd" d="${trace(green)}"/></svg>\n`;
await writeFile(new URL("symbol.svg", target), svg);
const vector = await sharp(Buffer.from(svg))
  .resize(width, height)
  .ensureAlpha()
  .raw()
  .toBuffer();
let intersection = 0,
  union = 0;
for (let i = 0; i < solid.length; i++) {
  const v = vector[i * 4 + 3] >= 128;
  if (solid[i] && v) intersection++;
  if (solid[i] || v) union++;
}
const report = {
  sourceWidth: width,
  sourceHeight: height,
  silhouetteIntersectionOverUnion: intersection / union,
  svgBytes: Buffer.byteLength(svg),
  ink: "#20201c",
  moss: "#5c6848",
};
if (report.silhouetteIntersectionOverUnion < 0.99)
  throw new Error(JSON.stringify(report));
await writeFile(
  new URL("conversion.json", target),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
