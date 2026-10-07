import { createPencil, ell, type Pencil } from "../../stack-view/lib/pencil";
import type { Cmds } from "../../stack-view/lib/sketch";
import type { SceneColors, SceneItem } from "../../stack-view/lib/types";

/** 콩은 흰 종이 위 연필 그림이라 화면 테마와 무관하게 고정 */
const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};
/** 검정에 가까운 다크 그레이. 순검정이면 연필 윤곽이 묻힌다 */
const BEAN = "#3A3633";
/** 점눈·입·눈썹 */
const DOT = "#F4F0E8";

// 1000×1000 단위. 밑이 둥글고 왼쪽 위가 살짝 들어간 콩
const BODY: Cmds = [
  "M",
  486,
  236,
  "C",
  642,
  226,
  756,
  352,
  772,
  532,
  "C",
  790,
  708,
  718,
  902,
  516,
  918,
  "C",
  330,
  932,
  220,
  806,
  224,
  642,
  "C",
  226,
  540,
  268,
  470,
  290,
  404,
  "C",
  324,
  298,
  396,
  240,
  486,
  236,
  "Z",
];
// 아래쪽 둥근 면에 비친 빛. 종이색 연필 결로 입체를 낸다
const RIM: Cmds = [
  "M",
  274,
  790,
  "L",
  300,
  760,
  "M",
  316,
  842,
  "L",
  348,
  806,
  "M",
  372,
  878,
  "L",
  406,
  838,
  "M",
  436,
  898,
  "L",
  470,
  858,
  "M",
  502,
  902,
  "L",
  534,
  862,
  "M",
  568,
  892,
  "L",
  598,
  854,
  "M",
  630,
  866,
  "L",
  656,
  832,
  "M",
  684,
  822,
  "L",
  706,
  794,
];
const GLOSS: Cmds = ["M", 312, 470, "C", 318, 396, 356, 330, 418, 300];
const EYES: [number, number][] = [
  [404, 606],
  [586, 600],
];

/**
 * smile: 평소 · squeeze: 눈 질끈(바둥·날아갈 때) · sleep: 콩이 없을 때
 * joy: 콩 점프(^^ 눈, 벌린 입) · shiver: 부르르(동그란 눈, 물결 입)
 */
export type KongFace = "smile" | "squeeze" | "sleep" | "joy" | "shiver";
/**
 * 바둥거릴 때 팔다리가 나온다(두 프레임을 번갈아 그림).
 * cheer: 점프 중 만세 · brr: 부르르 떨 때 몸 양옆의 떨림 선
 */
export type KongLimbs = "none" | "flail0" | "flail1" | "cheer" | "brr";

function limbs(p: Pencil, l: KongLimbs) {
  if (l === "none") return;
  if (l === "cheer") {
    p.pen(["M", 244, 600, "Q", 176, 540, 150, 420], { w: 2.6 });
    p.pen(["M", 762, 586, "Q", 832, 512, 856, 404], { w: 2.6 });
    p.pen(["M", 430, 912, "L", 404, 968], { w: 2.6 });
    p.pen(["M", 582, 906, "L", 610, 962], { w: 2.6 });
    return;
  }
  if (l === "brr") {
    // 몸 바깥의 짧은 괄호 두 겹. 연필 선이라 몸과 같은 결로 떨린다
    for (const [x, d] of [
      [176, -1],
      [118, -1],
      [826, 1],
      [884, 1],
    ] as const) {
      p.pen(["M", x, 520, "Q", x + d * 22, 600, x, 680], { w: 2 });
    }
    return;
  }
  const a = l === "flail0";
  p.pen(
    ["M", 234, 640, "Q", 160, a ? 560 : 660, a ? 104 : 120, a ? 470 : 660],
    { w: 2.6 },
  );
  p.pen(
    ["M", 770, 620, "Q", 850, a ? 680 : 540, a ? 900 : 890, a ? 690 : 450],
    { w: 2.6 },
  );
  p.pen(["M", 420, 914, "L", a ? 360 : 400, a ? 984 : 990], { w: 2.6 });
  p.pen(["M", 590, 906, "L", a ? 640 : 610, a ? 990 : 980], { w: 2.6 });
}

function face(p: Pencil, f: KongFace, k: number) {
  const [[ax, ay], [bx, by]] = EYES;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  // 작게 그려도 점눈이 1px 넘게 남게
  const r = Math.max(21, 1.15 / k);
  const line = (d: Cmds, w = 2.4) => p.hatch(d, { color: DOT, w, op: 0.95 });

  if (f === "smile") {
    for (const [x, y] of EYES) p.fill(ell(x, y, r, r * 1.05), DOT);
    line(["M", mx - 47, my + 58, "Q", mx, my + 96, mx + 47, my + 58], 2.2);
  } else if (f === "squeeze") {
    line(["M", ax - 26, ay - 24, "L", ax + 18, ay, "L", ax - 26, ay + 24], 2.6);
    line(["M", bx + 26, by - 24, "L", bx - 18, by, "L", bx + 26, by + 24], 2.6);
    p.fill(
      ["M", mx - 40, my + 54, "Q", mx, my + 120, mx + 40, my + 54, "Z"],
      DOT,
    );
  } else if (f === "joy") {
    line(["M", ax - 28, ay + 10, "Q", ax, ay - 24, ax + 28, ay + 10], 2.6);
    line(["M", bx - 28, by + 10, "Q", bx, by - 24, bx + 28, by + 10], 2.6);
    p.fill(
      ["M", mx - 46, my + 50, "Q", mx, my + 124, mx + 46, my + 50, "Z"],
      DOT,
    );
  } else if (f === "shiver") {
    for (const [x, y] of EYES) p.fill(ell(x, y, r * 1.2, r * 1.25), DOT);
    line(
      [
        "M",
        mx - 50,
        my + 70,
        "L",
        mx - 30,
        my + 56,
        "L",
        mx - 10,
        my + 72,
        "L",
        mx + 10,
        my + 56,
        "L",
        mx + 30,
        my + 72,
        "L",
        mx + 50,
        my + 58,
      ],
      2.2,
    );
  } else {
    line(["M", ax - 28, ay - 4, "Q", ax, ay + 18, ax + 28, ay - 4]);
    line(["M", bx - 28, by - 4, "Q", bx, by + 18, bx + 28, by - 4]);
    line(["M", mx - 16, my + 66, "Q", mx, my + 76, mx + 16, my + 66], 2);
  }
  // 바깥 끝이 처진 팔자 눈썹. 40px 아래에선 뭉개져 뺀다
  if (f !== "squeeze" && f !== "joy" && k >= 0.04) {
    for (const [x, y, d] of [
      [ax, ay, -1],
      [bx, by, 1],
    ] as const) {
      p.hatch(
        ["M", x + d * 34, y - 50, "Q", x + d * 6, y - 74, x - d * 26, y - 70],
        { color: DOT, w: 2, op: 0.9 },
      );
    }
  }
}

/**
 * 콩 한 알. size px 정사각형에 그린다. boil이면 흔들림이 다른 세 벌을 만들어
 * 키재기 캐릭터처럼 선이 살짝 떨린다(`globals.css`의 `stack-boil`)
 */
export function buildKong(opts: {
  size: number;
  face?: KongFace;
  limbs?: KongLimbs;
  boil?: boolean;
  seed?: number;
}): SceneItem[] {
  const { size, face: f = "smile", limbs: l = "none", boil = false } = opts;
  const seed = opts.seed ?? 431;
  const k = size / 1000;
  const u = Math.max(0.55, size / 150);
  const T = (x: number, y: number): [number, number] => [x * k, y * k];

  return (boil ? [0, 1, 2] : [0]).map((v) => {
    const p = createPencil({ T, C: COLORS, u, seed: seed + v * 53 });
    limbs(p, l);
    p.fill(BODY, BEAN);
    p.pen(BODY, { closed: true, w: 2.6 });
    p.hatch(RIM, { color: COLORS.paper, w: 1.4, op: 0.16 });
    p.hatch(GLOSS, { color: COLORS.paper, w: 2.6, op: 0.3 });
    face(p, f, k);
    return {
      k: "g",
      id: `kong-${v}`,
      cls: boil ? `stack-boil stack-boil-${v}` : "kong-figure",
      children: p.items,
    };
  });
}

/** 종지 안쪽 테두리 가운데(px 비율). 쌓는 콩의 맨 아래 줄 기준 */
export const BOWL_RIM_Y = 300 / 1000;
/** 종지 그림 높이/폭 */
export const BOWL_ASPECT = 0.74;

/**
 * 콩 종지. 안쪽(back)과 몸통(front)을 나눠 그 사이에 콩을 끼운다.
 * 몸통이 아래 줄 콩의 발을 가려 콩이 종지 안에 담겨 보인다
 */
export function buildBowl(width: number, part: "back" | "front"): SceneItem[] {
  const k = width / 1000;
  const u = Math.max(0.8, width / 220);
  const T = (x: number, y: number): [number, number] => [x * k, y * k];
  const p = createPencil({
    T,
    C: COLORS,
    u,
    seed: part === "back" ? 77 : 91,
  });
  if (part === "back") {
    p.fill(ell(500, 300, 420, 92), "#E7E3DD");
    p.pen(
      [
        "M",
        80,
        300,
        "C",
        80,
        249,
        268,
        208,
        500,
        208,
        "C",
        732,
        208,
        920,
        249,
        920,
        300,
      ],
      { w: 2 },
    );
    p.hatch(
      [
        "M",
        200,
        260,
        "L",
        230,
        236,
        "M",
        260,
        250,
        "L",
        296,
        222,
        "M",
        330,
        242,
        "L",
        362,
        216,
        "M",
        680,
        236,
        "L",
        712,
        214,
        "M",
        744,
        244,
        "L",
        776,
        222,
      ],
      { w: 0.9, op: 0.25 },
    );
    return p.items;
  }
  const foot: Cmds = [
    "M",
    360,
    650,
    "L",
    372,
    712,
    "C",
    440,
    726,
    560,
    726,
    628,
    712,
    "L",
    640,
    650,
  ];
  p.fill([...foot, "Z"], "#ECE8E2");
  p.pen(foot, { w: 2 });
  const front: Cmds = [
    "M",
    80,
    300,
    "C",
    80,
    349,
    268,
    392,
    500,
    392,
    "C",
    732,
    392,
    920,
    349,
    920,
    300,
    "C",
    906,
    520,
    730,
    664,
    500,
    664,
    "C",
    270,
    664,
    94,
    520,
    80,
    300,
    "Z",
  ];
  p.fill(front, "#F5F2EC");
  p.pen(front, { closed: true, w: 2.2 });
  // 오른쪽 그늘
  const shade: Cmds = [];
  for (let i = 0; i < 9; i++) {
    const x = 640 + i * 28;
    const top = 384 - i * 9;
    shade.push("M", x, top + 30, "L", x + 30, top + 150 - i * 12);
  }
  p.hatch(shade, { w: 1, op: 0.3 });
  // 유약 띠
  p.hatch(["M", 150, 420, "C", 300, 480, 700, 480, 850, 420], {
    w: 1.2,
    op: 0.35,
  });
  return p.items;
}
