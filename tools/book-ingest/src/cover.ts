import sharp from "sharp";

import { fetchWithRetry } from "./http";

export type CoverExt = "webp" | "jpg" | "png" | "gif";

export const CONTENT_TYPE: Record<CoverExt, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
};

const EXT_BY_FORMAT: Record<string, CoverExt> = {
  webp: "webp",
  jpeg: "jpg",
  png: "png",
  gif: "gif",
};

/** 이보다 좁은 표지는 썸네일급이라 올리지 않습니다. 카카오 원본은 392~458px입니다. */
const MIN_WIDTH = 200;
const MAX_BYTES = 10 * 1024 * 1024;

/** 7-e 스펙. WebP가 이 PSNR 미만이면 원본을 그대로 씁니다. */
const MIN_PSNR = 30;

export interface PreparedCover {
  body: Buffer;
  ext: CoverExt;
  contentType: string;
  original: { format: string; width: number; height: number; bytes: number };
  /** WebP 변환을 시도했을 때의 PSNR. 원본이 이미 WebP·GIF면 null. */
  psnr: number | null;
  converted: boolean;
}

export async function downloadCover(url: string): Promise<Buffer> {
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`표지 다운로드 실패 (HTTP ${res.status})`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) {
    throw new Error(
      `표지가 이미지가 아닙니다 (${type || "content-type 없음"})`,
    );
  }
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length === 0) throw new Error("표지가 0바이트입니다");
  if (body.length > MAX_BYTES)
    throw new Error(`표지가 너무 큽니다 (${body.length}B)`);
  return body;
}

/**
 * 표지 가공 스펙(계획서 7-e)을 적용합니다.
 * - WebP·GIF 원본은 재인코딩하지 않고 그대로 씁니다.
 * - JPEG·PNG는 WebP q85(smartSubsample)로 바꾸되, PSNR이 30dB 미만이거나 오히려
 *   커지면 원본을 씁니다. 4:4:4 표지는 WebP가 4:2:0을 강제해 화질이 무너지기 때문입니다.
 * - 리사이즈는 하지 않습니다. 원본이 이미 500px 이하입니다.
 */
export async function prepareCover(original: Buffer): Promise<PreparedCover> {
  const meta = await sharp(original).metadata();
  const ext = meta.format ? EXT_BY_FORMAT[meta.format] : undefined;
  if (!ext || !meta.width || !meta.height) {
    throw new Error(
      `지원하지 않는 표지 형식입니다 (${meta.format ?? "알 수 없음"})`,
    );
  }
  if (meta.width < MIN_WIDTH) {
    throw new Error(`표지 폭이 ${meta.width}px라 너무 작습니다`);
  }

  const info = {
    format: meta.format!,
    width: meta.width,
    height: meta.height,
    bytes: original.length,
  };
  const keep = (psnr: number | null): PreparedCover => ({
    body: original,
    ext,
    contentType: CONTENT_TYPE[ext],
    original: info,
    psnr,
    converted: false,
  });

  if (ext === "webp" || ext === "gif") return keep(null);

  const webp = await sharp(original)
    .webp({ quality: 85, smartSubsample: true })
    .toBuffer();
  const score = await psnr(original, webp);
  if (score < MIN_PSNR || webp.length >= original.length) return keep(score);

  return {
    body: webp,
    ext: "webp",
    contentType: CONTENT_TYPE.webp,
    original: info,
    psnr: score,
    converted: true,
  };
}

/** 두 이미지를 sRGB 8비트로 풀어 PSNR(dB)을 잽니다. 완전히 같으면 Infinity. */
export async function psnr(a: Buffer, b: Buffer): Promise<number> {
  const decode = (input: Buffer) =>
    sharp(input)
      .toColourspace("srgb")
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  const [x, y] = await Promise.all([decode(a), decode(b)]);
  if (
    x.info.width !== y.info.width ||
    x.info.height !== y.info.height ||
    x.data.length !== y.data.length
  ) {
    throw new Error("PSNR 비교 대상의 크기가 다릅니다");
  }
  let squaredError = 0;
  for (let i = 0; i < x.data.length; i += 1) {
    const diff = x.data[i] - y.data[i];
    squaredError += diff * diff;
  }
  const mse = squaredError / x.data.length;
  return mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
}
