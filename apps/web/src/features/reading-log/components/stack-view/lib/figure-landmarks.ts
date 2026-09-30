import type { MountainLandmarkId } from "@bookjeok/core";

import { drawObject } from "./figure-objects";
import { OBJECT_ART } from "./objects";
import type { Pencil } from "./pencil";
import type { Cmds } from "./sketch";

/**
 * 책산 이정표 중 그림이 있는 것의 가로 범위(세로는 0~1000). 사물 사다리와 겹치는 셋은 사물 그림을 쓴다.
 * 그림이 없는 이정표는 점선과 이름만 세운다. 책산이 가까워지면 그때 그린다(주 25cm 안팎, 2026-09-30).
 */
export const LANDMARK_ART: Partial<
  Record<MountainLandmarkId, { x: [number, number]; mark?: number }>
> = {
  emperor: OBJECT_ART.emperor,
  hoop: OBJECT_ART.hoop,
  giraffe: OBJECT_ART.giraffe,
  cheomseongdae: { x: [0, 600] },
};

const TONE = {
  stone: "#EFEBE5",
  shade: "#DDD6CC",
  base: "#E4DED5",
  baseShade: "#D3CBBF",
  dark: "#292524",
};

const box = (x0: number, y0: number, x1: number, y1: number): Cmds => [
  "M",
  x0,
  y0,
  "L",
  x1,
  y0,
  "L",
  x1,
  y1,
  "L",
  x0,
  y1,
  "Z",
];

/** 몸통 위아래(단위). 그 위는 정자석, 아래는 기단 */
const BODY = { top: 104, bottom: 930, courses: 27 };

/** 몸통 반지름. 아래쪽만 급히 벌어지는 병 모양이다. 원뿔처럼 고르게 줄이면 등대로 보인다 */
const bodyR = (y: number) => {
  const t = (BODY.bottom - y) / (BODY.bottom - BODY.top);
  return 156 + 113 * (1 - t) ** 2.8;
};

/** 둥근 몸통을 조금 내려다본 단 줄눈의 처짐. 가운데가 가장 처지고 양 끝은 0 */
const sag = (x: number, y: number) => {
  const r = bodyR(y);
  const f = (x - 300) / r;
  return r * 0.05 * Math.max(0, 1 - f * f);
};

/**
 * 경주 첨성대. 두 단 기단, 병 모양 27단 몸통, 가운데 네모 창, 꼭대기 井자 정자석.
 * 둥근 몸을 보이려고 단 줄눈을 휘고, 세로 줄눈은 가장자리로 갈수록 촘촘히(각도로) 두고, 오른쪽에 그늘을 준다.
 * 창턱에 책(최근 올린 책 색)이 한 권 놓였다
 */
function drawCheomseongdae(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  const { top, bottom, courses } = BODY;
  const course = (bottom - top) / courses;

  // 기단 두 단. 오른쪽 끝을 어둡게
  for (const [x0, y0, x1, y1, joints] of [
    [4, 966, 596, 1000, [150, 300, 450]],
    [22, 930, 578, 966, [110, 236, 364, 490]],
  ] as const) {
    fill(box(x0, y0, x1, y1), TONE.base);
    fill(box(x1 - (x1 - x0) * 0.12, y0, x1, y1), TONE.baseShade);
    const j: Cmds = [];
    for (const x of joints) j.push("M", x, y0 + 4, "L", x, y1 - 3);
    j.push("M", x0 + 6, y0 + 7, "L", x1 - 6, y0 + 7);
    hatch(j, { op: 0.35 });
    pen(box(x0, y0, x1, y1), { closed: true, w: 1.8 });
  }

  // 몸통 윤곽
  const side: [number, number][] = [];
  for (let y = bottom; y > top; y -= 24) side.push([300 - bodyR(y), y]);
  side.push([300 - bodyR(top), top]);
  const body: Cmds = [
    ...side.flatMap(([x, y], i) => [i ? "L" : "M", x, y]),
    ...[...side].reverse().flatMap(([x, y]) => ["L", 600 - x, y]),
    "Z",
  ];
  fill(body, TONE.stone);
  // 오른쪽 그늘: 몸통 폭의 오른쪽 45%
  const shade: Cmds = [];
  side.forEach(([x, y], i) =>
    shade.push(i ? "L" : "M", 300 + (300 - x) * 0.55, y),
  );
  [...side].reverse().forEach(([x, y]) => shade.push("L", 600 - x, y));
  shade.push("Z");
  fill(shade, TONE.shade);

  // 단 줄눈과 세로 줄눈
  const rows: Cmds = [];
  const joints: Cmds = [];
  const inWindow = (x: number, y: number) =>
    x > 244 && x < 356 && y > 462 && y < 586;
  for (let i = 0; i <= courses; i++) {
    const y = bottom - i * course;
    const r = bodyR(y) - 2;
    if (i > 0 && i < courses)
      rows.push("M", 300 - r, y, "Q", 300, y + r * 0.1, 300 + r, y);
    if (i === courses) break;
    const yTop = y - course;
    const rm = bodyR(y - course / 2);
    for (let th = -1.3 + (i % 2) * 0.31; th < 1.3; th += 0.62) {
      const x = 300 + rm * Math.sin(th);
      if (Math.abs(Math.sin(th)) > 0.93 || inWindow(x, y - course / 2))
        continue;
      joints.push("M", x, y + sag(x, y) - 3, "L", x, yTop + sag(x, yTop) + 3);
    }
  }
  hatch(rows, { op: 0.4, w: 0.9 });
  hatch(joints, { op: 0.28, w: 0.9 });
  // 그늘 해칭
  const hatchCmds: Cmds = [];
  for (let y = top + 40; y < bottom - 30; y += 46) {
    const x = 300 + bodyR(y) * 0.8;
    hatchCmds.push("M", x, y + 8, "L", x + 10, y - 2);
  }
  hatch(hatchCmds, { op: 0.22 });
  pen(body, { closed: true, w: 2.1 });

  // 창. 몸통 곡면을 따라 위아래 변도 조금 처진다
  const win: Cmds = [
    "M",
    252,
    470 + sag(252, 470),
    "Q",
    300,
    470 + sag(300, 470) * 2,
    348,
    470 + sag(348, 470),
    "L",
    348,
    562 + sag(348, 562),
    "Q",
    300,
    562 + sag(300, 562) * 2,
    252,
    562 + sag(252, 562),
    "Z",
  ];
  fill(win, TONE.dark);
  pen(win, { closed: true, w: 1.8 });
  // 창턱과 그 위에 눕힌 책
  const book = box(266, 548, 334, 566);
  fill(book, held);
  pen(book, { closed: true, w: 1.3 });
  hatch(["M", 272, 557, "L", 328, 557], { op: 0.5, color: "#FFFFFF" });
  const sill = box(240, 566, 360, 580);
  fill(sill, TONE.stone);
  pen(sill, { closed: true, w: 1.5 });

  // 정자석: 아래 단은 좌우로 긴 돌, 위 단은 앞뒤로 놓인 두 돌의 마구리(井자)
  const beam = box(126, 58, 474, top);
  fill(beam, TONE.stone);
  fill(box(420, 58, 474, top), TONE.shade);
  hatch(
    [
      "M",
      132,
      66,
      "L",
      468,
      66,
      "M",
      176,
      62,
      "L",
      176,
      100,
      "M",
      424,
      62,
      "L",
      424,
      100,
    ],
    {
      op: 0.35,
    },
  );
  pen(beam, { closed: true, w: 1.9 });
  for (const [x0, x1] of [
    [148, 214],
    [386, 452],
  ] as const) {
    const end = box(x0, 6, x1, 58);
    fill(end, TONE.stone);
    fill(box(x1 - 18, 6, x1, 58), TONE.shade);
    hatch(["M", x0 + 8, 20, "L", x1 - 22, 20], { op: 0.3 });
    pen(end, { closed: true, w: 1.9 });
  }
}

/** 이정표 그림. 그림이 없는 이정표면 아무것도 긋지 않는다 */
export function drawLandmark(
  p: Pencil,
  o: { landmark: MountainLandmarkId; heldColor: string },
) {
  const { landmark, heldColor } = o;
  if (landmark === "emperor" || landmark === "hoop" || landmark === "giraffe") {
    drawObject(p, { object: landmark, heldColor });
    return;
  }
  if (landmark === "cheomseongdae") drawCheomseongdae(p, heldColor);
}
