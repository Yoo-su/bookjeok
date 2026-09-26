import type { ReadingTowerBook } from "@bookjeok/core";

import { drawSceneItems } from "./draw-canvas";
import { buildLegend } from "./legend";
import { bookColor, buildTowerScene, type SceneLabels } from "./scene";
import type { TowerStatus } from "./status";
import type { FontRole, SceneColors, TowerCharacter } from "./types";

export type ShareFormat = "story" | "feed";

export interface ShareTexts {
  kicker: string;
  count: string;
  countUnit: string;
  height: string;
  heightUnit: string;
  subline: string;
  brand: string;
  site: string;
  stats: string;
}

export interface ShareFonts extends Record<FontRole, string> {
  serif: string;
}

const PALETTE: SceneColors & { dot: string } = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
  dot: "#E2E0DD",
};

/**
 * 책탑 공유 이미지. 화면과 같은 장면을 1080px 폭 캔버스에 다시 그린다.
 * 서버 렌더링 없이 브라우저에서 바로 만든다.
 */
export async function renderTowerShareImage(o: {
  format: ShareFormat;
  books: ReadingTowerBook[];
  towerMm: number;
  userMm: number;
  character: TowerCharacter;
  status: TowerStatus;
  labels: SceneLabels;
  texts: ShareTexts;
  fonts: ShareFonts;
  /** 바닥에 제목을 적을 책(logId)과 목록 머리말·나머지 한 줄("외 11권") */
  legend?: { ids: string[]; heading: string; rest?: string };
}): Promise<HTMLCanvasElement> {
  const { format, texts, fonts } = o;
  const sample =
    o.books.map((b) => b.title).join("") +
    Object.values(o.labels).flat().join("") +
    Object.values(texts).join("") +
    (o.legend ? o.legend.heading + (o.legend.rest ?? "") : "");
  await Promise.all(
    [
      `700 40px ${fonts.hand}`,
      `600 96px ${fonts.serif}`,
      `800 40px ${fonts.ui}`,
      `500 30px ${fonts.ui}`,
    ].map((f) => document.fonts.load(f, sample).catch(() => [])),
  );

  const story = format === "story";
  const W = 1080;
  const H = story ? 1920 : 1350;
  const M = 76;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PALETTE.dot;
  for (let y = 18; y < H; y += 30) {
    for (let x = 18; x < W; x += 30) {
      ctx.beginPath();
      ctx.arc(x, y, 1.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 머리글
  let y = story ? 150 : 112;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `700 24px ${fonts.ui}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "6px";
  ctx.fillText(texts.kicker, M, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

  y += story ? 132 : 104;
  const big = story ? 120 : 96;
  let x = M;
  const seg = (t: string, size: number, color: string) => {
    ctx.font = `600 ${size}px ${fonts.serif}`;
    ctx.fillStyle = color;
    ctx.fillText(t, x, y);
    const w = ctx.measureText(t).width;
    x += w;
    return w;
  };
  seg(texts.count, big, PALETTE.ink);
  x += 4;
  seg(`${texts.countUnit}, `, big * 0.52, PALETTE.muted);
  x += 6;
  const hx = x;
  const hw = seg(texts.height, big, PALETTE.ink);
  x += 4;
  const uw = seg(texts.heightUnit, big * 0.52, PALETTE.muted);
  // 높이 숫자 아래 펜 밑줄. 화면(reading-tower)과 같은 100×12 도형을 늘려 그린다
  const ul = hw + uw + 20;
  const X = (v: number) => hx - 8 + (ul * v) / 100;
  const Y = (v: number) => y + big * (0.09 + v * 0.02);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#292524";
  ctx.lineWidth = big * 0.046;
  ctx.beginPath();
  ctx.moveTo(X(2), Y(6.4));
  ctx.bezierCurveTo(X(30), Y(5.4), X(62), Y(6.6), X(98), Y(3.8));
  ctx.stroke();
  ctx.strokeStyle = PALETTE.muted;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = big * 0.027;
  ctx.beginPath();
  ctx.moveTo(X(8), Y(10));
  ctx.bezierCurveTo(X(38), Y(9.6), X(70), Y(8.8), X(94), Y(6.4));
  ctx.stroke();
  ctx.globalAlpha = 1;

  y += story ? 84 : 70;
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `500 ${story ? 36 : 32}px ${fonts.ui}`;
  ctx.fillText(texts.subline, M, y, W - 2 * M);

  const u = story ? 2.25 : 1.85;
  const measure = (t: string, size: number, weight: number, fam: FontRole) => {
    ctx.font = `${weight} ${size}px ${fonts[fam]}`;
    return ctx.measureText(t).width;
  };

  // 쌓은 책 목록. 탑 안의 책은 너무 얇아 제목을 못 쓰니 바닥 아래 띠에 모아 적고,
  // 그 높이만큼 장면을 줄인다. 탑 위에서부터의 순서로 적는다
  const ids = new Set(o.legend?.ids ?? []);
  const picked = o.books.filter((b) => ids.has(b.logId)).reverse();
  const legend =
    o.legend && picked.length
      ? buildLegend({
          books: picked.map((b) => ({
            id: b.logId,
            title: b.title,
            color: bookColor(b),
          })),
          heading: o.legend.heading,
          rest: o.legend.rest,
          width: W - 2 * M,
          colors: PALETTE,
          u,
          measure,
        })
      : null;

  // 장면
  const top = y + (story ? 40 : 24);
  const footTop = H - (story ? 170 : 128);
  const legendTop = legend ? footTop - legend.height + 4 * u : footTop;
  // 장면 바닥 여백(30u) 안쪽으로 목록을 당겨 바닥선과 목록 사이를 18u로 맞춘다
  const bottom = legend ? legendTop + 12 * u : footTop;
  const scene = buildTowerScene({
    width: W - 2 * M + 24,
    height: bottom - top,
    books: o.books,
    towerMm: o.towerMm,
    userMm: o.userMm,
    character: o.character,
    status: o.status,
    labels: o.labels,
    colors: PALETTE,
    measure,
    u,
    boil: false,
  });
  ctx.save();
  ctx.translate(M - 12, top);
  drawSceneItems(ctx, scene.items, fonts);
  ctx.restore();
  if (legend) {
    ctx.save();
    ctx.translate(M, legendTop);
    drawSceneItems(ctx, legend.items, fonts);
    ctx.restore();
  }

  // 바닥글
  const fy = H - (story ? 84 : 60);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `900 44px ${fonts.ui}`;
  ctx.fillText(texts.brand, M, fy);
  const bw = ctx.measureText(texts.brand).width;
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 24px ${fonts.ui}`;
  ctx.fillText(texts.site, M + bw + 18, fy - 4);
  ctx.textAlign = "right";
  ctx.font = `500 28px ${fonts.ui}`;
  ctx.fillText(texts.stats, W - M, fy - 4);
  return canvas;
}
