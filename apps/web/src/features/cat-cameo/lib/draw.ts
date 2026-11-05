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
  const p = createPencil({ T, C, u, seed });
  const eyes = createPencil({ T, C, u, seed: seed + 5 });
  const pupils = createPencil({ T, C, u, seed: seed + 9 });
  catHead(p, { ...head, look: 0 }, { eyes, pupils });
  const { hx, hy, r } = head;
  return {
    face: p.items,
    eyes: eyes.items,
    pupils: pupils.items,
    eyeCenter: T(hx, hy + 0.04 * r),
  };
}

// 걷는 고양이 좌표(단위). 땅이 y=0, 앞이 +x. 꼬리 끝·귀 끝·수염 끝까지 담는다
const WX0 = -57;
const WX1 = 70;
const WY0 = -88;
const WY1 = 4;
/** 걷는 고양이 머리 배율 */
const HEAD = 1.18;
/** 걷는 고양이 몸통 가로 배율 */
const BODY = 0.88;

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
  // 몸통·다리·꼬리는 가로로 줄여 그린다. 가슴~엉덩이가 어깨 높이의 1.4배쯤인 통통한 비율
  const TB = (x: number, y: number): Pt => T(x * BODY, y);
  const limb = limbOf(TB, k, u, C, seed);

  // 다리는 면으로 그린다. 위 끝이 축(어깨·엉덩관절)이고, 둥근 허벅지·어깨 덩어리가 다리와 함께 돈다.
  // 그래서 다리를 앞뒤로 벌려도 몸과 잇는 곳이 각지지 않고 근육이 움직이듯 부드럽다. 통통한 고양이라 다리는 짧다
  const legPart = (
    pivot: Pt,
    mass: Cmds,
    shape: Cmds,
    paw: Cmds,
    s: number,
    contour?: Cmds,
  ): CatPart => {
    const p = createPencil({ T: TB, C, u, seed: seed + s });
    p.fill(mass, C.ink);
    p.fill(shape, C.ink);
    p.pen(shape, { w: 0.9, a: 0.3, closed: true, op: 0.35 });
    p.fill(paw, C.ink);
    // 허벅지 앞선. 다리와 함께 움직여 허벅지가 몸통과 구분된다
    if (contour) p.hatch(contour, { color: C.muted, w: 0.8, op: 0.45 });
    return { pivot: TB(pivot[0], pivot[1]), items: p.items };
  };
  // 앞다리. 어깨 덩어리 아래로 굵은 팔뚝이 발목으로 가늘어지고, 발이 어깨보다 살짝 앞에 놓인다
  const foreLeg = (x: number, s: number) =>
    legPart(
      [x, -34],
      ell(x, -28, 7, 9.5),
      [
        "M",
        x - 6,
        -28,
        "C",
        x - 6,
        -19,
        x - 3.5,
        -10,
        x - 2,
        -3,
        "L",
        x + 5,
        -3,
        "C",
        x + 5.6,
        -10,
        x + 6.5,
        -19,
        x + 6.5,
        -28,
        "Z",
      ],
      ell(x + 2.8, -2.3, 4.8, 2.7),
      s,
    );
  // 뒷다리. 둥근 허벅지 아래로 정강이가 뒤로 내려가 높은 발뒤꿈치에서 앞으로 꺾인다
  const hindLeg = (x: number, s: number) =>
    legPart(
      [x, -34],
      ell(x + 0.5, -27, 9, 11),
      [
        "M",
        x - 2,
        -24,
        "C",
        x - 5,
        -18,
        x - 8.5,
        -12,
        x - 7.5,
        -9,
        "C",
        x - 6,
        -6,
        x - 4,
        -4.2,
        x - 2.8,
        -3,
        "L",
        x + 3.6,
        -3,
        "C",
        x + 2.2,
        -7,
        x + 1.5,
        -11,
        x + 3,
        -15,
        "C",
        x + 4.5,
        -19,
        x + 5,
        -22,
        x + 4,
        -24,
        "Z",
      ],
      ell(x + 0.6, -2.3, 5, 2.7),
      s,
      ["M", x + 8, -21, "C", x + 9, -30, x + 3, -37, x - 6, -36.5],
    );

  // 꼬리. 엉덩이 위에서 세워 끝을 앞으로 갈고리처럼 만다. 통통한 만큼 굵게
  const tail: CatPart = {
    pivot: TB(-43, -46),
    items: [
      limb(
        [
          "M",
          -42,
          -46,
          "C",
          -55,
          -49,
          -60,
          -61,
          -58,
          -71,
          "C",
          -56,
          -80,
          -50,
          -85,
          -43,
          -82,
        ],
        7.5,
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
    37,
    -42,
    36,
    -32,
    29,
    -25,
    "C",
    23,
    -19,
    12,
    -16,
    0,
    -15.5,
    "C",
    -12,
    -15,
    -22,
    -16,
    -29,
    -19,
    "C",
    -37,
    -22,
    -44,
    -27,
    -45,
    -35,
    "C",
    -46,
    -45,
    -39,
    -52,
    -27,
    -53.5,
    "C",
    -13,
    -55,
    3,
    -52,
    14,
    -50,
    "C",
    22,
    -49.5,
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
    -58,
    "C",
    22,
    -64,
    23,
    -69,
    25,
    -73,
    "C",
    28,
    -69,
    30,
    -66,
    31,
    -61,
    "Z",
  ];
  prof.fill(farEar, C.ink);
  prof.pen(farEar, { w: 0.9, a: 0.3, closed: true, op: 0.5 });
  const skull: Cmds = [
    "M",
    24,
    -46,
    "C",
    19,
    -54,
    23,
    -64,
    33,
    -66,
    "C",
    41,
    -67,
    46,
    -61,
    47,
    -57,
    "C",
    49,
    -55,
    51,
    -53,
    50.5,
    -50.5,
    "C",
    50,
    -47.5,
    46,
    -46.5,
    43,
    -45.5,
    "C",
    37,
    -42.5,
    30,
    -41.5,
    24,
    -46,
    "Z",
  ];
  prof.fill(skull, C.ink);
  prof.pen(skull, { w: 1, a: 0.35, closed: true, op: 0.5 });
  const nearEar: Cmds = [
    "M",
    29,
    -62,
    "C",
    29,
    -67,
    30,
    -73,
    32.5,
    -77,
    "C",
    35.5,
    -73,
    38,
    -68.5,
    39.5,
    -63.5,
    "Z",
  ];
  prof.fill(nearEar, C.ink);
  prof.pen(nearEar, { w: 0.9, a: 0.3, closed: true, op: 0.5 });
  prof.hatch(["M", 32.5, -65, "L", 33.2, -72.5], {
    color: C.muted,
    w: 0.7,
    op: 0.55,
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
    [-50, -52.5],
    [-49, -49],
    [-48, -45.5],
  ])
    prof.hatch(["M", 46, y0, "Q", 54, y0 + (y1 - y0) * 0.4, 62, y1], {
      color: C.faint,
      w: 0.55,
      op: 0.9,
    });

  // 정면 얼굴. 옆얼굴과 같은 자리에 앉혀 고개만 돌린 것처럼
  const front = faceOf(T, u, seed + 60, {
    hx: 29 + 6 * HEAD,
    hy: -45 - 9.5 * HEAD,
    r: 14 * HEAD,
    lid: 0.32,
  });

  return {
    width: (WX1 - WX0) * k,
    height: (WY1 - WY0) * k,
    groundY: -WY0 * k,
    farLegs: [hindLeg(-39, 71), foreLeg(14, 73)],
    nearLegs: [hindLeg(-32, 75), foreLeg(21, 77)],
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
