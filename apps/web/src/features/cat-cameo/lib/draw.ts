import {
  CAT_EYE,
  catHead,
} from "@/features/reading-log/components/stack-view/lib/figure-cat";
import {
  createPencil,
  ell,
} from "@/features/reading-log/components/stack-view/lib/pencil";
import {
  type Cmds,
  type Pt,
  samplePath,
  wobble,
} from "@/features/reading-log/components/stack-view/lib/sketch";
import type {
  PathItem,
  SceneColors,
  SceneItem,
} from "@/features/reading-log/components/stack-view/lib/types";

/** 독서 키재기 고양이와 같은 먹·회색 */
export const CAT_COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

/** 따로 움직이는 부품. pivot(px)을 축으로 돈다 */
export interface CatPart {
  items: SceneItem[];
  pivot: Pt;
}

/** 정면 얼굴. 눈과 눈동자를 따로 두어 깜빡이고 시선을 옮긴다 */
export interface CatFace {
  face: SceneItem[];
  eyes: SceneItem[];
  pupils: SceneItem[];
  /** 두 눈 가운데(px). 깜빡일 때 여기를 축으로 눈을 접는다 */
  eyeCenter: Pt;
}

/** 굵기가 몸 크기를 따라가는 선. 다리·꼬리 */
function limbOf(
  T: (x: number, y: number) => Pt,
  k: number,
  u: number,
  C: SceneColors,
  seed: number,
) {
  let n = 0;
  return (cmds: Cmds, w: number): PathItem => ({
    k: "p",
    d: wobble(samplePath(cmds, T), seed + (n += 7), 0.22 * u, false),
    stroke: C.ink,
    sw: w * k,
    cap: "round",
    join: "round",
  });
}

function faceOf(
  T: (x: number, y: number) => Pt,
  u: number,
  seed: number,
  head: { hx: number; hy: number; r: number; lid: number },
): CatFace {
  const C = CAT_COLORS;
  const eyes = createPencil({ T, C, u, seed: seed + 5 });
  const pupils = createPencil({ T, C, u, seed: seed + 9 });
  const { hx, hy, r } = head;
  const fur = createPencil({ T, C, u, seed });
  catHead(fur, { ...head, look: 0 }, { eyes, pupils });
  return {
    face: fur.items,
    eyes: eyes.items,
    pupils: pupils.items,
    eyeCenter: T(hx, hy + 0.08 * r),
  };
}

// 걷는 고양이 좌표(단위). 땅이 y=0, 앞이 +x. 꼬리 끝·귀 끝·수염 끝까지 담는다
const WX0 = -57;
const WX1 = 70;
const WY0 = -88;
const WY1 = 4;
/** 걷는 고양이 머리 배율 */
const HEAD = 1.4;
/** 걷는 고양이 몸통 가로 배율 */
const BODY = 0.76;

export interface WalkingCat {
  width: number;
  height: number;
  /** 발이 닿는 높이(px, 위에서부터) */
  groundY: number;
  /** 몸 뒤에 그리는 먼 쪽 다리(뒷다리, 앞다리) */
  farLegs: [CatPart, CatPart];
  nearLegs: [CatPart, CatPart];
  tail: CatPart;
  body: SceneItem[];
  /** 걸을 때 앞을 보는 옆얼굴 */
  profile: SceneItem[];
  /** 멈춰서 화면을 보는 정면 얼굴 */
  front: CatFace;
  /** 한 걸음 내디딜 때 앞다리가 도는 각도(도), 뒷다리 각도(허벅지가 엉덩이 밖으로 덜 나가게 작게), 발을 드는 높이(px) */
  swing: number;
  hindSwing: number;
  lift: number;
}

/**
 * 오른쪽으로 걷는 옆모습 검정고양이. k는 단위당 px.
 * 몸은 옆모습이고 얼굴만 정면으로 바꿔 끼울 수 있다(걷다 멈춰 이쪽을 본다)
 */
export function drawWalkingCat(k: number, seed = 311): WalkingCat {
  const C = CAT_COLORS;
  const u = Math.max(0.45, Math.min(1.1, k * 1.25));
  const T = (x: number, y: number): Pt => [(x - WX0) * k, (y - WY0) * k];
  // 짧고 둥근 몸에 큰 머리를 얹는 아기고양이 비율.
  const TB = (x: number, y: number): Pt => T(x * BODY, y);
  const limb = limbOf(TB, k, u, C, seed);

  // 관절 타원과 막대를 겹치지 않고, 허벅지부터 발끝까지 한 면으로 잇는다.
  const legPart = (
    x: number,
    s: number,
    shape: Cmds,
    contour?: Cmds,
  ): CatPart => {
    const p = createPencil({ T: TB, C, u, seed: seed + s });
    p.fill(shape, C.ink);
    if (contour) p.hatch(contour, { color: C.muted, w: 0.7, op: 0.3 });
    return { pivot: TB(x, -34), items: p.items };
  };
  const foreLeg = (x: number, s: number) =>
    legPart(x, s, [
      "M",
      x - 5.5,
      -37,
      "C",
      x - 8,
      -27,
      x - 4,
      -15,
      x - 3.8,
      -6,
      "C",
      x - 4,
      -3.8,
      x - 6,
      -3.6,
      x - 6,
      -1.8,
      "C",
      x - 6,
      1.2,
      x - 1,
      1.3,
      x + 2.5,
      1.1,
      "C",
      x + 7.5,
      1,
      x + 8,
      -2.5,
      x + 4.4,
      -3.8,
      "C",
      x + 3.4,
      -13,
      x + 7.5,
      -26,
      x + 6,
      -36,
      "Z",
    ]);
  const hindLeg = (x: number, s: number) =>
    legPart(
      x,
      s,
      [
        "M",
        x - 4.5,
        -37,
        "C",
        x - 11,
        -34,
        x - 10,
        -25,
        x - 6.6,
        -19,
        "C",
        x - 3.8,
        -14,
        x - 5.8,
        -8,
        x - 3.6,
        -5,
        "C",
        x - 4.5,
        -3.8,
        x - 5.7,
        -3.3,
        x - 5.4,
        -1.6,
        "C",
        x - 5.2,
        1.1,
        x - 0.5,
        1.3,
        x + 2.8,
        1.1,
        "C",
        x + 7.9,
        0.8,
        x + 7.4,
        -2.8,
        x + 3.8,
        -4,
        "C",
        x + 1.3,
        -7,
        x + 1,
        -12,
        x + 4.1,
        -17,
        "C",
        x + 10,
        -25,
        x + 8.2,
        -34,
        x + 3,
        -37,
        "Z",
      ],
      ["M", x + 6.5, -20, "C", x + 8, -27, x + 4.2, -32, x - 1.5, -32],
    );

  // 짧고 가는 꼬리 끝만 느슨하게 말린다.
  const tail: CatPart = {
    pivot: TB(-41, -46),
    items: [
      limb(
        [
          "M",
          -41,
          -46,
          "C",
          -52,
          -49,
          -57,
          -59,
          -54,
          -68,
          "C",
          -52,
          -75,
          -46,
          -78,
          -41,
          -75,
        ],
        6,
      ),
    ],
  };

  // 몸통. 앞으로 둥글게 나온 가슴, 처진 배, 둥근 엉덩이, 엉덩이 쪽이 살짝 높은 등.
  // 목은 따로 그리지 않는다. 둥근 어깨 위에 머리를 바로 얹는다
  const body = createPencil({ T: TB, C, u, seed: seed + 20 });
  const torso: Cmds = [
    "M",
    32,
    -48,
    "C",
    38,
    -41,
    35,
    -25,
    27,
    -18,
    "C",
    18,
    -9,
    2,
    -9,
    -12,
    -11,
    "C",
    -25,
    -11,
    -38,
    -14,
    -43,
    -25,
    "C",
    -48,
    -35,
    -44,
    -47,
    -34,
    -51,
    "C",
    -22,
    -57,
    0,
    -54,
    14,
    -51,
    "C",
    22,
    -50,
    28,
    -49,
    32,
    -48,
    "Z",
  ];
  body.fill(torso, C.ink);
  body.pen(torso, { w: 1, a: 0.4, closed: true, op: 0.5 });
  // 목덜미. 등선에서 뒤통수 밑으로 매끄럽게 메워 머리와 몸 사이에 턱이 지지 않게. 윤곽선 위에 덮는다
  body.fill(
    [
      "M",
      4,
      -50.6,
      "C",
      12,
      -51.2,
      17,
      -52.4,
      20,
      -54,
      "C",
      24,
      -56,
      30,
      -54,
      33,
      -46,
      "L",
      4,
      -46,
      "Z",
    ],
    C.ink,
  );
  // 털결. 어깨만 회색으로 짚어(허벅지 앞선은 뒷다리에) 검은 몸이 한 덩어리로 뭉개지지 않게
  body.hatch(["M", 25, -48, "C", 30, -41, 28, -31, 22, -25], {
    color: C.muted,
    w: 0.8,
    op: 0.4,
  });

  // 옆얼굴. 뒤통수에서 이마, 콧등, 짧은 주둥이와 턱으로
  // 머리는 몸에 비해 조금 크게. 목(30, -46)을 축으로 키운다
  const TH = (x: number, y: number) =>
    T(29 + (x - 30) * HEAD, -45 + (y + 46) * HEAD);
  const prof = createPencil({ T: TH, C, u, seed: seed + 40 });
  const farEar: Cmds = [
    "M",
    23,
    -59,
    "C",
    21.5,
    -63,
    22,
    -68,
    23.5,
    -71,
    "Q",
    24,
    -72,
    25,
    -70.7,
    "C",
    27.5,
    -67.7,
    29,
    -64,
    30,
    -61,
    "Z",
  ];
  prof.fill(farEar, C.ink);
  prof.pen(farEar, { w: 0.85, a: 0.25, closed: true, op: 0.4 });
  const skull: Cmds = [
    "M",
    22,
    -45,
    "C",
    16.5,
    -51,
    19.5,
    -63.5,
    29.5,
    -66,
    "C",
    38,
    -68,
    44.5,
    -63.5,
    45.5,
    -58.5,
    "Q",
    45.6,
    -56.1,
    47.8,
    -54.2,
    "Q",
    49.4,
    -52.6,
    48.6,
    -50.6,
    "C",
    47.2,
    -46.2,
    39,
    -42,
    31,
    -42,
    "C",
    26.5,
    -42,
    23.8,
    -43.1,
    22,
    -45,
    "Z",
  ];
  prof.fill(skull, C.ink);
  prof.pen(skull, { w: 0.9, a: 0.25, closed: true, op: 0.4 });
  const nearEar: Cmds = [
    "M",
    28,
    -62,
    "C",
    27.8,
    -66,
    29.2,
    -71,
    31,
    -73.5,
    "Q",
    31.7,
    -74.4,
    32.5,
    -73.3,
    "C",
    35.7,
    -70,
    37.8,
    -66.6,
    39,
    -63.3,
    "Z",
  ];
  prof.fill(nearEar, C.ink);
  prof.pen(nearEar, { w: 0.85, a: 0.25, closed: true, op: 0.4 });
  prof.hatch(["M", 31.2, -64.5, "Q", 31, -67, 31.6, -70.4], {
    color: C.muted,
    w: 0.6,
    op: 0.4,
  });
  // 수평에 가까운 작은 눈과 짧고 둥근 동공.
  prof.fill(
    [
      "M",
      38.6,
      -56.1,
      "C",
      39.5,
      -57.8,
      42.9,
      -57.8,
      44.2,
      -56.1,
      "C",
      43.1,
      -54.1,
      39.9,
      -53.9,
      38.6,
      -56.1,
      "Z",
    ],
    CAT_EYE,
  );
  prof.fill(ell(41.9, -55.95, 0.95, 1.05), C.ink);
  for (const [y0, y1] of [
    [-50, -51.5],
    [-48.5, -46],
  ])
    prof.hatch(["M", 45, y0, "Q", 51, y0 + (y1 - y0) * 0.4, 57, y1], {
      color: C.faint,
      w: 0.55,
      op: 0.9,
    });

  // 정면 얼굴. 옆얼굴과 같은 자리에 앉혀 고개만 돌린 것처럼
  const front = faceOf(T, u, seed + 60, {
    hx: 29 + 4 * HEAD,
    hy: -45 - 9.5 * HEAD,
    r: 14.4 * HEAD,
    lid: 0.32,
  });

  return {
    width: (WX1 - WX0) * k,
    height: (WY1 - WY0) * k,
    groundY: -WY0 * k,
    farLegs: [hindLeg(-34, 71), foreLeg(14, 73)],
    nearLegs: [hindLeg(-27, 75), foreLeg(21, 77)],
    tail,
    body: body.items,
    profile: prof.items,
    front,
    swing: 17,
    hindSwing: 12,
    lift: 2.6 * k,
  };
}

export interface PeekingCat {
  width: number;
  height: number;
  r: number;
  front: CatFace;
  /** 화면 아래 모서리를 붙잡은 두 앞발 */
  paws: SceneItem[];
}

/**
 * 화면 아래 모서리 너머에서 고개를 내민 정면 고양이. r은 얼굴 반지름(px).
 * 그림 아래 끝이 화면 모서리이고, 턱과 수염 끝은 모서리에 가려 보이지 않는다
 */
export function drawPeekingCat(r: number, seed = 523): PeekingCat {
  const C = CAT_COLORS;
  const u = Math.max(0.7, Math.min(1.2, r / 24));
  const hx = 1.62 * r;
  const hy = 1.62 * r;
  const edge = hy + 0.55 * r;
  const T = (x: number, y: number): Pt => [x, y];
  const front = faceOf(T, u, seed, { hx, hy, r, lid: 0.25 });

  const paws = createPencil({ T, C, u, seed: seed + 30 });
  // 두 앞발은 볼 양옆 아래로 모서리를 붙잡는다. 얼굴과 겹치는 안쪽은 회색 윤곽으로 떼어 본다
  for (const s of [-1, 1]) {
    const px = hx + s * 0.8 * r;
    const py = edge - 0.08 * r;
    const paw = ell(px, py, 0.3 * r, 0.2 * r);
    paws.fill(paw, C.ink);
    paws.hatch(
      [
        "M",
        px - 0.3 * r,
        py + 0.02 * r,
        "C",
        px - 0.3 * r,
        py - 0.16 * r,
        px - 0.16 * r,
        py - 0.21 * r,
        px,
        py - 0.21 * r,
        "C",
        px + 0.16 * r,
        py - 0.21 * r,
        px + 0.3 * r,
        py - 0.16 * r,
        px + 0.3 * r,
        py + 0.02 * r,
      ],
      { color: C.muted, w: 1, op: 0.75 },
    );
    // 발가락 사이 결 두 줄
    for (const t of [-0.3, 0.3])
      paws.hatch(
        [
          "M",
          px + t * 0.3 * r,
          py - 0.16 * r,
          "L",
          px + t * 0.28 * r,
          py + 0.02 * r,
        ],
        { color: C.muted, w: 0.8, op: 0.65 },
      );
  }
  return {
    width: 2 * hx,
    height: edge,
    r,
    front,
    paws: paws.items,
  };
}
