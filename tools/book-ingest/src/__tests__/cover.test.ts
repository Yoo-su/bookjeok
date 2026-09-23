import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { prepareCover, psnr } from "../cover";

/** 사진처럼 완만한 그라데이션 표지. WebP로 바꿔도 PSNR이 높게 나옵니다. */
async function smoothJpeg(width = 458, height = 660) {
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 3;
      raw[i] = (x * 255) / width;
      raw[i + 1] = (y * 255) / height;
      raw[i + 2] = 128;
    }
  }
  return sharp(raw, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 95 })
    .toBuffer();
}

/** 1px 단위 색 잡음. 4:2:0 WebP가 색을 뭉개 PSNR이 30dB 아래로 떨어집니다. */
async function noisyJpeg444(width = 400, height = 600) {
  const raw = Buffer.alloc(width * height * 3);
  let seed = 42;
  for (let i = 0; i < raw.length; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    raw[i] = seed & 0xff;
  }
  return sharp(raw, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

describe("prepareCover", () => {
  it("평범한 JPEG는 WebP로 바꾼다", async () => {
    const cover = await prepareCover(await smoothJpeg());
    expect(cover).toMatchObject({
      ext: "webp",
      contentType: "image/webp",
      converted: true,
    });
    expect(cover.psnr).toBeGreaterThanOrEqual(30);
    expect(cover.original).toMatchObject({ format: "jpeg", width: 458 });
  });

  it("WebP가 30dB 미만이면 원본 JPEG를 그대로 쓴다", async () => {
    const original = await noisyJpeg444();
    const cover = await prepareCover(original);
    expect(cover.converted).toBe(false);
    expect(cover.ext).toBe("jpg");
    expect(cover.body.equals(original)).toBe(true);
  });

  it("WebP 원본은 재인코딩하지 않는다", async () => {
    const original = await sharp(await smoothJpeg())
      .webp()
      .toBuffer();
    const cover = await prepareCover(original);
    expect(cover).toMatchObject({ ext: "webp", converted: false, psnr: null });
    expect(cover.body.equals(original)).toBe(true);
  });

  it("썸네일급(폭 200px 미만)은 거절한다", async () => {
    await expect(prepareCover(await smoothJpeg(120, 174))).rejects.toThrow(
      "너무 작습니다",
    );
  });

  it("이미지가 아니면 거절한다", async () => {
    await expect(prepareCover(Buffer.from("<html></html>"))).rejects.toThrow();
  });
});

describe("psnr", () => {
  it("같은 이미지는 Infinity", async () => {
    const img = await smoothJpeg(50, 50);
    expect(await psnr(img, img)).toBe(Infinity);
  });
});
