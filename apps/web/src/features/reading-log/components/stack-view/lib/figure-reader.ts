import {
  boilClass,
  type PersonOptions,
  personShadow,
  personTransform,
} from "./figure-person";
import { createPencil, ell, type Pencil, type PenOptions } from "./pencil";
import { READER_HEADS } from "./reader-heads";
import { type Cmds, lerp, type Pt, rectCorners } from "./sketch";
import { tracedItems } from "./traced";
import type { Mood, SceneItem, StackReaderCharacter } from "./types";

/** 볼·입 안 톤 */
const TONE = {
  cheek: "#F4C7BE",
  mouth: "#7A4A45",
};

/**
 * 옷·피부·머리 색. 손에 든 책 표지색이 가장 눈에 띄도록 채도를 낮게 둔다
 */
interface Palette {
  sweater: string;
  pants: string;
  skin: string;
  /** 시안에서 딴 머리·윤곽 선 색. 먹색 대신 짙은 갈색 연필 */
  line: string;
}

const PALETTE: Record<StackReaderCharacter, Palette> = {
  M: { sweater: "#DCE4D3", pants: "#D2DAE3", skin: "#FCF2EA", line: "#2F2621" },
  F: { sweater: "#F3E2D6", pants: "#E2DCD3", skin: "#FCF2EA", line: "#352823" },
};

/**
 * 시안에서 딴 머리(이목구비 포함)를 정수리를 축으로 줄이는 비율.
 * 원래 크기면 턱이 깃에 붙어 목을 움츠린 것처럼 보인다
 */
const HEAD_SCALE = 0.92;

/** x를 150 기준으로 뒤집는다 */
function mirror(cmds: Cmds): Cmds {
  const out: Cmds = [];
  let i = 0;
  for (const c of cmds) {
    if (typeof c === "string") {
      out.push(c);
      i = 0;
    } else {
      out.push(i++ % 2 === 0 ? 300 - c : c);
    }
  }
  return out;
}

/**
 * 기본 캐릭터. 니트 맨투맨·와이드 팬츠 차림의 몸은 연필로 긋고, 머리는 사용자 시안에서 딴
 * 벡터(`reader-heads.ts`)를 얹고, 그 위에 표정을 긋는다. 왼손에 가장 최근에 읽은 책을 든다.
 *
 * 머리는 데이터가 커서 한 벌만 두고 떨지 않는다. 몸과 표정만 세 벌을 번갈아 보인다.
 */
export function buildReaderFigure(
  opts: PersonOptions & { character: StackReaderCharacter; mood: Mood },
): SceneItem[] {
  const { colors: C, u, heldColor, boil, character, mood } = opts;
  const T = personTransform(opts);
  const c = PALETTE[character];
  const variants = boil ? [0, 1, 2] : [0];
  const out: SceneItem[] = [personShadow(opts)];
  for (const v of variants) {
    // 몸 선도 머리와 같은 갈색 연필로, 조금 가늘게 긋는다
    const p = createPencil({
      T,
      C: { ...C, ink: c.line },
      u: u * 0.85,
      seed: 211 + v * 53,
    });
    pants(p, c);
    sneakers(p);
    sweater(p, c);
    arms(p, c, heldColor);
    out.push({
      k: "g",
      id: `figure-${v}`,
      cls: boilClass(boil, v),
      children: p.items,
    });
  }
  const headT = (x: number, y: number) =>
    T(150 + (x - 150) * HEAD_SCALE, y * HEAD_SCALE);
  out.push({
    k: "g",
    id: "reader-head",
    cls: "stack-figure",
    children: tracedItems(READER_HEADS[character], headT, {
      skin: c.skin,
      line: c.line,
    }),
  });
  for (const v of variants) {
    const line = { ...C, ink: c.line };
    const neck = createPencil({ T, C: line, u: u * 0.85, seed: 541 + v * 53 });
    collar(neck, c);
    const p = createPencil({ T: headT, C: line, u, seed: 611 + v * 53 });
    features(p, mood, FACES[character]);
    out.push({
      k: "g",
      id: `face-${v}`,
      cls: boilClass(boil, v),
      children: [...neck.items, ...p.items],
    });
  }
  return out;
}

function pants(p: Pencil, c: Palette) {
  const { pen, fill, hatch } = p;
  fill(
    [
      "M",
      72,
      498,
      "L",
      228,
      498,
      "L",
      238,
      948,
      "L",
      164,
      948,
      "L",
      154,
      590,
      "L",
      146,
      590,
      "L",
      136,
      948,
      "L",
      62,
      948,
      "L",
      72,
      498,
    ],
    c.pants,
  );
  pen(["M", 73, 500, "L", 60, 954]);
  pen(["M", 227, 500, "L", 240, 954]);
  pen(["M", 147, 588, "L", 135, 952]);
  pen(["M", 153, 588, "L", 165, 952]);
  pen(["M", 144, 592, "Q", 150, 582, 156, 592], { w: 1.4 });
  // 무릎 아래로 흘러내린 주름
  pen(
    [
      "M",
      96,
      640,
      "C",
      100,
      700,
      98,
      760,
      102,
      820,
      "M",
      204,
      640,
      "C",
      200,
      700,
      202,
      760,
      198,
      820,
      "M",
      68,
      870,
      "C",
      84,
      878,
      104,
      878,
      122,
      868,
      "M",
      232,
      870,
      "C",
      216,
      878,
      196,
      878,
      178,
      868,
    ],
    { w: 1, light: false, op: 0.35 },
  );
  const h: Cmds = [];
  for (let y = 600; y <= 920; y += 24) {
    const t = (y - 500) / 450;
    h.push("M", 74 - t * 10, y + 10, "L", 86 - t * 10, y - 4);
    h.push("M", 220 + t * 10, y + 10, "L", 232 + t * 10, y - 4);
  }
  hatch(h);
}

function sneakers(p: Pencil) {
  const { pen, fill } = p;
  const shoe: Cmds = [
    "M",
    58,
    942,
    "C",
    48,
    958,
    38,
    978,
    44,
    994,
    "L",
    150,
    995,
    "C",
    152,
    976,
    150,
    958,
    146,
    942,
    "L",
    58,
    942,
  ];
  fill(shoe);
  fill(mirror(shoe));
  const line: Cmds = [
    "M",
    60,
    940,
    "C",
    48,
    958,
    36,
    978,
    42,
    994,
    "L",
    152,
    996,
    "C",
    153,
    976,
    150,
    956,
    145,
    940,
  ];
  pen(line);
  pen(mirror(line));
  // 밑창과 끈
  pen(["M", 40, 982, "L", 152, 984, "M", 148, 984, "L", 260, 982], { w: 1.3 });
  const lace: Cmds = ["M", 88, 954, "L", 110, 949, "M", 90, 964, "L", 112, 959];
  pen(lace, { w: 1.1, light: false });
  pen(mirror(lace), { w: 1.1, light: false });
}

/** 어깨가 떨어지는 오버핏 니트. 골지 깃·밑단과 몸판 그늘 */
function sweater(p: Pencil, c: Palette) {
  const { pen, fill, hatch } = p;
  fill(
    [
      "M",
      62,
      190,
      "C",
      86,
      178,
      120,
      172,
      150,
      172,
      "C",
      180,
      172,
      214,
      178,
      238,
      190,
      "L",
      252,
      300,
      "L",
      245,
      512,
      "C",
      200,
      522,
      100,
      522,
      55,
      512,
      "L",
      48,
      300,
      "L",
      62,
      190,
    ],
    c.sweater,
  );
  const side: Cmds = [
    "M",
    152,
    172,
    "C",
    120,
    172,
    86,
    178,
    62,
    190,
    "C",
    55,
    232,
    50,
    270,
    48,
    302,
    "L",
    55,
    516,
  ];
  pen(side);
  pen(mirror(side));
  // 골지 밑단
  pen(["M", 50, 509, "C", 100, 521, 200, 521, 250, 509]);
  pen(["M", 54, 484, "C", 100, 494, 200, 494, 246, 484], {
    w: 1.2,
    light: false,
    op: 0.6,
  });
  const ribs: Cmds = [];
  for (let x = 64; x <= 236; x += 9) {
    const d = Math.abs(x - 150) / 100;
    ribs.push("M", x, 492 - d * 6 + 2, "L", x, 516 - d * 6);
  }
  hatch(ribs, { w: 0.9, op: 0.35 });
  // 내려앉은 어깨 솔기
  const seam: Cmds = ["M", 74, 194, "C", 78, 222, 84, 244, 90, 262];
  pen(seam, { w: 1.1, light: false, op: 0.45 });
  pen(mirror(seam), { w: 1.1, light: false, op: 0.45 });
  // 몸판 옆 그늘과 가슴께 늘어진 주름
  const shade: Cmds = [];
  for (let y = 290; y <= 460; y += 18) {
    shade.push("M", 92, y + 12, "L", 104, y - 2);
    shade.push("M", 196, y + 12, "L", 208, y - 2);
  }
  hatch(shade, { op: 0.28 });
  pen(
    [
      "M",
      112,
      230,
      "C",
      126,
      240,
      140,
      244,
      152,
      244,
      "M",
      120,
      420,
      "C",
      136,
      428,
      158,
      430,
      176,
      424,
    ],
    { w: 1, light: false, op: 0.3 },
  );
}

/**
 * 골지 둥근 깃의 앞쪽 띠. 목이 니트 안으로 들어가 보이도록 머리보다 나중에 긋는다.
 * 뒤쪽 깃은 목에 가려 그리지 않는다
 */
function collar(p: Pencil, c: Palette) {
  const outer: Cmds = ["M", 116, 171, "C", 124, 196, 176, 196, 184, 171];
  const inner: Cmds = ["M", 127, 173, "C", 135, 182, 165, 182, 173, 173];
  p.fill(
    [...outer, "L", 173, 173, "C", 165, 182, 135, 182, 127, 173, "Z"],
    c.sweater,
  );
  p.pen(outer, { w: 1.7 });
  p.pen(inner, { w: 1.4 });
  const ribs: Cmds = [];
  for (let t = 0.08; t < 0.95; t += 0.11) {
    const x = 120 + t * 60;
    const yIn = 174 + Math.sin(t * Math.PI) * 7;
    const yOut = 172 + Math.sin(t * Math.PI) * 19;
    ribs.push("M", x + (x - 150) * 0.1, yIn, "L", x + (x - 150) * 0.2, yOut);
  }
  p.hatch(ribs, { w: 0.9, op: 0.4 });
}

/** 소매와 손. 왼손(화면 왼쪽)에 가장 최근에 읽은 책을 든다 */
function arms(p: Pencil, c: Palette, heldColor: string) {
  const { pen, fill, hatch } = p;
  const sleeve: Cmds = [
    "M",
    64,
    192,
    "C",
    42,
    240,
    28,
    360,
    30,
    448,
    "L",
    74,
    450,
    "C",
    76,
    380,
    80,
    300,
    88,
    250,
  ];
  fill([...sleeve, "L", 64, 192], c.sweater);
  fill([...mirror(sleeve), "L", 236, 192], c.sweater);
  pen(sleeve);
  pen(mirror(sleeve));
  // 팔꿈치에 모인 주름
  const folds: Cmds = [
    "M",
    36,
    336,
    "C",
    46,
    342,
    58,
    344,
    70,
    338,
    "M",
    34,
    360,
    "C",
    46,
    364,
    56,
    364,
    66,
    360,
  ];
  pen(folds, { w: 1, light: false, op: 0.4 });
  pen(mirror(folds), { w: 1, light: false, op: 0.4 });
  // 골지 소맷부리
  const cuff: Cmds = [
    "M",
    30,
    448,
    "C",
    28,
    458,
    30,
    468,
    33,
    476,
    "L",
    72,
    477,
    "C",
    74,
    468,
    74,
    458,
    74,
    450,
  ];
  fill([...cuff, "Z"], c.sweater);
  fill([...mirror(cuff), "Z"], c.sweater);
  pen(cuff, { w: 1.6 });
  pen(mirror(cuff), { w: 1.6 });
  const cr: Cmds = [];
  for (let x = 36; x <= 70; x += 6) {
    cr.push("M", x, 452, "L", x, 474);
    cr.push("M", 300 - x, 452, "L", 300 - x, 474);
  }
  hatch(cr, { w: 0.9, op: 0.4 });

  const bc = rectCorners(42, 522, 62, 86, 0.14);
  fill(
    ["M", ...bc[0], "L", ...bc[1], "L", ...bc[2], "L", ...bc[3], "L", ...bc[0]],
    heldColor,
  );
  pen(
    [
      "M",
      ...bc[0],
      "L",
      ...bc[1],
      "L",
      ...bc[2],
      "L",
      ...bc[3],
      "L",
      bc[0][0],
      bc[0][1] + 4,
    ],
    { w: 1.6 },
  );
  const s1 = lerp(bc[0], bc[1], 0.14);
  const s2 = lerp(bc[3], bc[2], 0.14);
  pen(["M", ...s1, "L", ...s2], { w: 1.1, light: false, op: 0.6 });
  const hand: Cmds = [
    "M",
    36,
    476,
    "C",
    32,
    500,
    41,
    522,
    54,
    522,
    "C",
    66,
    522,
    72,
    500,
    70,
    476,
  ];
  for (const h of [hand, mirror(hand)]) {
    fill([...h, "Z"], c.skin);
    pen(h, { w: 1.7 });
  }
  // 책을 쥔 손가락
  pen(["M", 62, 494, "C", 66, 496, 68, 500, 66, 504], {
    w: 1.1,
    light: false,
    op: 0.6,
  });
}

/** 시안 얼굴에서 잰 이목구비 자리(캐릭터 단위). 왼쪽(화면 왼쪽)만 적고 오른쪽은 뒤집는다 */
interface FaceSpec {
  eye: Pt;
  eyeR: Pt;
  /** 눈썹 가운데와 길이 */
  brow: Pt;
  browLen: number;
  browW: number;
  noseY: number;
  /** 입 가운데 y와 반폭 */
  mouthY: number;
  mouthHalf: number;
  cheek: Pt;
}

const FACES: Record<StackReaderCharacter, FaceSpec> = {
  M: {
    eye: [126.8, 102],
    eyeR: [3.6, 6.6],
    brow: [131, 79.5],
    browLen: 13,
    browW: 1.6,
    noseY: 120,
    mouthY: 137,
    mouthHalf: 14,
    cheek: [113.5, 119],
  },
  F: {
    eye: [128.2, 109.3],
    eyeR: [3.4, 6.2],
    brow: [127.3, 86.2],
    browLen: 14,
    browW: 1.3,
    noseY: 124.7,
    mouthY: 140.6,
    mouthHalf: 11.5,
    cheek: [118.7, 122],
  },
};

/** 이목구비와 볼. 눈은 까만 타원, 기쁘면 웃는 눈, 놀라면 크게 뜬다 */
function features(p: Pencil, mood: Mood, s: FaceSpec) {
  const { pen, fill, hatch } = p;
  const [ex, ey] = s.eye;
  const [erx, ery] = s.eyeR;
  const [bx, by] = s.brow;
  const my = s.mouthY;
  const mh = s.mouthHalf;
  const ink = p.C.ink;
  const f: PenOptions = { w: 1.4, a: 0.3, light: false };

  // 볼. 웃을수록 진하다
  const blush = mood === "calm" ? 0.25 : mood === "wow" ? 0.35 : 0.5;
  for (const cx of [s.cheek[0], 300 - s.cheek[0]]) {
    const cy = s.cheek[1];
    fill(ell(cx, cy, 9, 5), TONE.cheek);
    hatch(
      [
        "M",
        cx - 5,
        cy + 3,
        "L",
        cx - 3,
        cy - 2,
        "M",
        cx,
        cy + 3.5,
        "L",
        cx + 2,
        cy - 1.5,
        "M",
        cx + 5,
        cy + 3,
        "L",
        cx + 7,
        cy - 2,
      ],
      { w: 0.7, op: blush, color: "#D98C80" },
    );
  }

  // 눈썹. 놀라면 올라가고 둥글게 휜다
  const lift = mood === "wow" ? 3 : 0;
  const arch = mood === "wow" ? 3.5 : 2;
  const h = s.browLen / 2;
  const brow: Cmds = [
    "M",
    bx - h,
    by - lift + 1,
    "Q",
    bx,
    by - lift - arch,
    bx + h,
    by - lift,
  ];
  pen(brow, { w: s.browW, a: 0.25, light: false, op: 0.85 });
  pen(mirror(brow), { w: s.browW, a: 0.25, light: false, op: 0.85 });

  if (mood === "yay") {
    // 웃어서 감긴 눈
    const shut: Cmds = [
      "M",
      ex - erx * 1.8,
      ey + 1.5,
      "Q",
      ex,
      ey - ery * 1.2,
      ex + erx * 1.8,
      ey + 1.5,
    ];
    pen(shut, { ...f, w: 1.8 });
    pen(mirror(shut), { ...f, w: 1.8 });
  } else {
    const big = mood === "wow" ? 1.25 : 1;
    for (const cx of [ex, 300 - ex]) {
      fill(ell(cx, ey, erx * big, ery * big), ink);
      if (mood === "wow") fill(ell(cx + 1.3, ey - 2.6, 1.3, 1.7), p.C.paper);
    }
  }

  // 코. 작은 세로 획 하나
  pen(["M", 150, s.noseY - 5, "Q", 148.5, s.noseY, 151, s.noseY + 2], {
    w: 1.1,
    a: 0.15,
    light: false,
    op: 0.5,
  });

  if (mood === "calm") {
    const w = mh * 0.6;
    pen(["M", 150 - w, my, "Q", 150, my + 4, 150 + w, my], f);
  } else if (mood === "happy") {
    pen(["M", 150 - mh, my - 1.5, "Q", 150, my + 6, 150 + mh, my - 1.5], f);
  } else if (mood === "yay") {
    const w = mh * 0.85;
    const m: Cmds = [
      "M",
      150 - w,
      my - 2,
      "Q",
      150,
      my - 0.5,
      150 + w,
      my - 2,
      "Q",
      150 + w * 0.8,
      my + 10,
      150,
      my + 10,
      "Q",
      150 - w * 0.8,
      my + 10,
      150 - w,
      my - 2,
    ];
    fill(m, TONE.mouth);
    pen(m, { ...f, closed: true });
  } else {
    const m = ell(150, my + 1, 3.6, 4.8);
    fill(m, TONE.mouth);
    pen(m, { ...f, w: 1.3, closed: true });
  }

  // 반짝 선. 놀라면 오른쪽, 신나면 왼쪽
  const spark: Cmds = [
    "M",
    228,
    66,
    "L",
    240,
    56,
    "M",
    232,
    88,
    "L",
    246,
    88,
    "M",
    228,
    110,
    "L",
    240,
    120,
  ];
  if (mood === "wow") pen(spark, { w: 1.4, light: false });
  if (mood === "yay") pen(mirror(spark), { w: 1.4, light: false });
}
