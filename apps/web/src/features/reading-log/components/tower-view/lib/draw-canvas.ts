import type { FontRole, SceneItem } from "./types";

/** 장면 도형 목록을 캔버스에 그린다. fonts는 캔버스가 알아듣는 실제 font-family 값 */
export function drawSceneItems(
  ctx: CanvasRenderingContext2D,
  items: SceneItem[],
  fonts: Record<FontRole, string>,
) {
  for (const it of items) {
    if (it.k === "g") {
      drawSceneItems(ctx, it.children, fonts);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = it.op ?? 1;
    if (it.k === "p") {
      const p = new Path2D(it.d);
      if (it.fill) {
        ctx.fillStyle = it.fill;
        ctx.fill(p);
      }
      if (it.stroke) {
        ctx.strokeStyle = it.stroke;
        ctx.lineWidth = it.sw ?? 1;
        ctx.lineCap = it.cap ?? "butt";
        ctx.lineJoin = it.join ?? "miter";
        ctx.setLineDash(it.dash ?? []);
        ctx.stroke(p);
      }
    } else {
      ctx.fillStyle = it.fill;
      ctx.font = `${it.weight} ${it.size}px ${fonts[it.fam]}`;
      ctx.textAlign =
        it.anchor === "middle"
          ? "center"
          : it.anchor === "end"
            ? "right"
            : "left";
      ctx.textBaseline = "middle";
      ctx.translate(it.x, it.y);
      if (it.rot) ctx.rotate((it.rot * Math.PI) / 180);
      if (it.halo) {
        ctx.strokeStyle = it.halo;
        ctx.lineWidth = it.hw ?? 4;
        ctx.lineJoin = "round";
        ctx.strokeText(it.t, 0, 0);
      }
      ctx.fillText(it.t, 0, 0);
    }
    ctx.restore();
  }
}
