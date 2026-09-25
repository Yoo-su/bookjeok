import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { coverColor } from "../cover-color";

type Band = { rgb: [number, number, number]; share: number };

/** 위에서부터 색 띠를 쌓은 표지. `share`는 세로 비율입니다. */
async function cover(bands: Band[], width = 240, height = 360) {
  const raw = Buffer.alloc(width * height * 3);
  let y = 0;
  for (const { rgb, share } of bands) {
    const end = Math.min(height, y + Math.round(height * share));
    for (; y < end; y += 1) {
      for (let x = 0; x < width; x += 1) raw.set(rgb, (y * width + x) * 3);
    }
  }
  return sharp(raw, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}

describe("coverColor", () => {
  it("가장 넓은 색을 대표색으로 쓴다", async () => {
    const image = await cover([
      { rgb: [30, 60, 120], share: 0.7 },
      { rgb: [200, 40, 40], share: 0.3 },
    ]);
    expect(await coverColor(image)).toBe("#1e3c78");
  });

  it("흰 표지면 26% 이상인 유색을 쓴다", async () => {
    const image = await cover([
      { rgb: [250, 250, 250], share: 0.6 },
      { rgb: [20, 120, 60], share: 0.4 },
    ]);
    expect(await coverColor(image)).toBe("#14783c");
  });

  it("유색이 조금뿐인 흰 표지는 종이색에 7%만 섞는다", async () => {
    const image = await cover([
      { rgb: [250, 250, 250], share: 0.9 },
      { rgb: [200, 0, 0], share: 0.1 },
    ]);
    // 종이색(236,231,222)에서 붉은 쪽으로 조금만 당겨진다
    const [r, g, b] = (await coverColor(image))
      .slice(1)
      .match(/../g)!
      .map((h) => parseInt(h, 16));
    expect(Math.abs(r - 236)).toBeLessThanOrEqual(3);
    expect(231 - g).toBeGreaterThan(5);
    expect(231 - g).toBeLessThan(25);
    expect(b).toBeLessThan(222);
  });

  it("알파가 있는 PNG도 읽는다", async () => {
    const image = await sharp({
      create: {
        width: 100,
        height: 150,
        channels: 4,
        background: { r: 90, g: 30, b: 150, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();
    expect(await coverColor(image)).toMatch(/^#[0-9a-f]{6}$/);
  });
});
