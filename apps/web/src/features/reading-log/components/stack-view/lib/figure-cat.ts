import { createPencil, ell, type Pencil } from "./pencil";
import { type Cmds, samplePath, wobble } from "./sketch";
import { BODY_PARTS } from "./status";
import type { PathItem, SceneColors, SceneItem } from "./types";

/** 쌓은 책 위 검정고양이 자세. 높을수록 늘어진다 */
export type CatPose = "sit" | "loaf" | "flop";

/** 노란 눈. 무대에서 책 표지색 말고 유일하게 쓰는 유채색 */
const EYE = "#EFC24A";

const ratioOf = (key: "knee" | "waist") =>
  BODY_PARTS.find((p) => p.key === key)?.ratio ?? 0;

/**
 * 쌓은 높이(키 대비)에 맞는 자세. 무릎 아래는 꼿꼿이 앉고, 허리까지는 식빵 자세로 꼬리를
 * 늘어뜨리고, 그 위로는 엎드려 앞발을 털썩 내린다.
 */
export function catPoseFor(ratio: number, hasBooks: boolean): CatPose {
  if (!hasBooks || ratio < ratioOf("knee")) return "sit";
  if (ratio < ratioOf("waist")) return "loaf";
  return "flop";
}

export interface CatResult {
  items: SceneItem[];
  /** 몸이 차지하는 자리(px). 꼬리·늘어뜨린 다리 포함 */
  box: { x0: number; y0: number; x1: number; y1: number };
  /** 책 윗면보다 위로 솟은 몸의 왼쪽 끝(px). 남은 높이 화살표가 이 왼쪽으로 비킨다 */
  upperLeft: number;
}

/** 자세별 크기(mm, 책 가운데 기준). 위는 음수. H는 맨 위 책 가로의 절반. 수염까지 친다 */
function extents(pose: CatPose, H: number, tailDown: boolean) {
  if (pose === "sit") {
    const ox = sitOrigin(H);
    return { x0: ox - 72, x1: ox + 77, top: -248, bottom: 0, upper: ox - 72 };
  }
  if (pose === "loaf")
    return tailDown
      ? { x0: -H - 8, x1: H + 18, top: -136, bottom: 142, upper: -78 }
      : {
          x0: tuckTip(-56, H) - 6,
          x1: H + 18,
          top: -136,
          bottom: 4,
          upper: -78,
        };
  return {
    x0: tailDown ? -H - 10 : tuckTip(-80, H) - 6,
    x1: H + 32,
    top: -78,
    bottom: tailDown ? 144 : 108,
    upper: -97,
  };
}

/** 책 위에 말아 둔 꼬리의 끝(mm). 맨 위 책 왼쪽 모서리 안쪽, 엉덩이에서 한 뼘 */
const tuckTip = (from: number, H: number) => Math.min(-H + 6, from - 30);

/** 앉은 고양이는 맨 위 책 오른쪽으로 비켜 앉는다. 엉덩이가 책 왼쪽 1/4쯤 */
const sitOrigin = (H: number) => Math.max(0, 66 - H * 0.45);

/**
 * 맨 위 책에 올라앉은 검정고양이. mm 단위로 그리고 (cx, surfaceY)에서 mm당 scale px로 늘린다.
 * halfMm는 맨 위 책 가로 절반을 고양이 축척으로 환산한 값이라, 꼬리·다리가 책 모서리에서 떨어진다.
 * boil이면 캐릭터처럼 세 벌을 번갈아 보인다.
 */
export function buildCat(o: {
  cx: number;
  surfaceY: number;
  halfMm: number;
  scale: number;
  pose: CatPose;
  colors: SceneColors;
  u: number;
  boil: boolean;
  /** false면 꼬리를 모서리 아래로 늘어뜨리지 않고 책 위에 말아 둔다. 왼쪽 글자와 부딪힐 때 */
  tailDown?: boolean;
}): CatResult {
  const { cx, surfaceY, scale: k, pose, colors: C, u } = o;
  const tailDown = o.tailDown ?? true;
  const H = o.halfMm;
  const T = (x: number, y: number): [number, number] => [
    cx + x * k,
    surfaceY + y * k,
  ];

  const variants = o.boil ? [0, 1, 2] : [0];
  const children: SceneItem[] = variants.map((v) => {
    const p = createPencil({ T, C, u, seed: 977 + v * 41 });
    const out = drawCat(p, {
      pose,
      H,
      k,
      T,
      u,
      seed: 977 + v * 41,
      tailDown,
    });
    return {
      k: "g",
      id: `cat-${v}`,
      cls: o.boil ? `stack-boil stack-boil-${v}` : "stack-figure",
      children: out,
    };
  });

  const e = extents(pose, H, tailDown);
  const [x0, y0] = T(e.x0, e.top);
  const [x1, y1] = T(e.x1, e.bottom);
  return {
    items: [{ k: "g", id: "cat", cls: "stack-cat", children }],
    box: { x0, y0, x1, y1 },
    upperLeft: T(e.upper, 0)[0],
  };
}

interface Ctx {
  pose: CatPose;
  H: number;
  k: number;
  T: (x: number, y: number) => [number, number];
  u: number;
  seed: number;
  tailDown: boolean;
}

/** 자세 하나를 그린다. 그리는 순서는 뒤에서 앞으로 */
function drawCat(p: Pencil, c: Ctx): SceneItem[] {
  const { H } = c;
  let n = 0;
  // 꼬리·다리처럼 굵기가 몸 크기를 따라가는 선. 연필 선(px 고정)으로는 축척을 못 따라간다
  const limb = (cmds: Cmds, wMm: number): PathItem => ({
    k: "p",
    d: wobble(
      samplePath(cmds, c.T),
      c.seed + 500 + (n += 7),
      0.25 * c.u,
      false,
    ),
    stroke: p.C.ink,
    sw: wMm * c.k,
    cap: "round",
    join: "round",
  });
  const silhouette = (cmds: Cmds) => {
    p.fill(cmds, p.C.ink);
    p.pen(cmds, { w: 1.05, a: 0.45, closed: true });
  };
  // 검은 털 위에서도, 흰 종이 위에서도 보이는 회색 결
  const fur = (cmds: Cmds, op = 0.45) =>
    p.hatch(cmds, { color: p.C.muted, w: 0.8, op });
  // 엉덩이에서 책 위로 둥글게 말아 끝을 살짝 든 꼬리
  const tucked = (x0: number, y0: number) => {
    const L = tuckTip(x0, H);
    return limb(
      [
        "M",
        x0,
        y0,
        "C",
        x0 - 10,
        -1,
        L + 8,
        -1,
        L,
        -10,
        "C",
        L - 4,
        -20,
        L + 2,
        -28,
        L + 9,
        -26,
      ],
      10,
    );
  };
  // 늘어뜨린 꼬리만 흔든다. 말아 둔 꼬리는 가만히
  const tailGroup = (tail: PathItem): SceneItem => ({
    k: "g",
    cls: c.tailDown ? "stack-cat-tail" : "stack-cat-curl",
    children: [tail],
  });

  if (c.pose === "sit") {
    const ox = sitOrigin(H);
    const X = (x: number) => ox + x;
    silhouette([
      "M",
      X(40),
      0,
      "C",
      X(47),
      -32,
      X(46),
      -92,
      X(34),
      -140,
      "C",
      X(30),
      -158,
      X(22),
      -170,
      X(10),
      -176,
      "L",
      X(-14),
      -172,
      "C",
      X(-42),
      -152,
      X(-64),
      -112,
      X(-68),
      -62,
      "C",
      X(-72),
      -26,
      X(-66),
      -4,
      X(-52),
      0,
      "Z",
    ]);
    fur(["M", X(27), -96, "C", X(26), -60, X(26), -28, X(28), -3]);
    fur(["M", X(-54), -6, "C", X(-28), -8, X(-18), -44, X(-32), -80]);
    fur(["M", X(-20), -160, "C", X(-44), -140, X(-58), -112, X(-61), -80], 0.3);
    head(p, { hx: X(8), hy: -196, r: 33, lid: 0.42, look: 0.05 });
    // 앞발을 감싼 꼬리. 끝만 따로 묶어 가끔 까딱인다
    const tail = limb(
      ["M", X(-50), -6, "C", X(-26), 7, X(20), 8, X(56), -2],
      10,
    );
    const tip = limb(
      ["M", X(54), -2, "C", X(66), -6, X(71), -16, X(64), -27],
      9,
    );
    return [
      ...p.items,
      tail,
      { k: "g", cls: "stack-cat-tip", children: [tip] },
    ];
  }

  if (c.pose === "loaf") {
    // 왼쪽 모서리로 흘러내리는 꼬리. 몸 뒤에서 시작하므로 먼저 그린다
    const tail = !c.tailDown
      ? tucked(-56, -12)
      : limb(
          [
            "M",
            -56,
            -12,
            "C",
            -78,
            -4,
            -H + 4,
            -6,
            -H + 1,
            6,
            "C",
            -H - 2,
            44,
            -H - 3,
            98,
            -H + 1,
            126,
            "C",
            -H + 6,
            136,
            -H + 14,
            134,
            -H + 15,
            125,
          ],
          10,
        );
    silhouette([
      "M",
      H - 14,
      0,
      "C",
      H - 4,
      -26,
      H - 12,
      -58,
      H - 40,
      -72,
      "C",
      H - 84,
      -98,
      -30,
      -104,
      -54,
      -84,
      "C",
      -72,
      -66,
      -76,
      -18,
      -62,
      0,
      "Z",
    ]);
    fur(["M", H - 36, -5, "Q", H - 22, -11, H - 8, -4], 0.5);
    fur(["M", -58, -8, "C", -40, -10, -28, -40, -42, -70]);
    fur(["M", H - 62, -92, "C", 10, -100, -30, -98, -48, -82], 0.3);
    head(p, { hx: H - 30, hy: -86, r: 31, lid: 0.55, look: 0.04 });
    return [tailGroup(tail), ...p.items];
  }

  // flop: 배를 깔고 엎드려 앞발 둘을 오른쪽 모서리 아래로 털썩 내린다
  const tail = !c.tailDown
    ? tucked(-80, -16)
    : limb(
        [
          "M",
          -80,
          -16,
          "C",
          -H + 2,
          -22,
          -H - 2,
          -8,
          -H - 3,
          26,
          "C",
          -H - 5,
          80,
          -H - 3,
          126,
          -H + 10,
          138,
        ],
        10,
      );
  const farLeg = limb(
    ["M", H - 48, -14, "C", H - 18, -12, H - 4, -2, H - 2, 20, "L", H - 1, 78],
    12,
  );
  const farPaw: PathItem = {
    k: "p",
    d: wobble(
      samplePath(ell(H - 1, 82, 8, 6), c.T),
      c.seed + 3,
      0.2 * c.u,
      true,
    ),
    fill: p.C.ink,
  };
  const body = createPencil({ T: c.T, C: p.C, u: c.u, seed: c.seed + 11 });
  body.fill(
    [
      "M",
      H - 26,
      0,
      "C",
      H - 16,
      -30,
      H - 36,
      -56,
      H - 64,
      -60,
      "C",
      H - 112,
      -64,
      -46,
      -54,
      -74,
      -40,
      "C",
      -92,
      -30,
      -94,
      -6,
      -82,
      0,
      "Z",
    ],
    p.C.ink,
  );
  body.pen(
    [
      "M",
      H - 64,
      -60,
      "C",
      H - 112,
      -64,
      -46,
      -54,
      -74,
      -40,
      "C",
      -92,
      -30,
      -94,
      -6,
      -82,
      0,
    ],
    { w: 1.05, a: 0.45 },
  );
  body.hatch(["M", -78, -6, "C", -58, -8, -46, -30, -56, -50], {
    color: p.C.muted,
    w: 0.8,
    op: 0.45,
  });
  body.hatch(["M", H - 70, -58, "C", 0, -60, -40, -52, -66, -42], {
    color: p.C.muted,
    w: 0.8,
    op: 0.3,
  });
  const nearLeg = limb(
    ["M", H - 34, -16, "C", H - 4, -16, H + 8, -6, H + 10, 20, "L", H + 12, 96],
    13,
  );
  const nearPaw: PathItem = {
    k: "p",
    d: wobble(
      samplePath(ell(H + 13, 100, 9, 7), c.T),
      c.seed + 5,
      0.2 * c.u,
      true,
    ),
    fill: p.C.ink,
  };
  // 두 앞발 사이 결. 한 덩어리로 뭉개지지 않게
  const toe = createPencil({ T: c.T, C: p.C, u: c.u, seed: c.seed + 17 });
  toe.hatch(["M", H + 4, 30, "L", H + 5, 84], {
    color: p.C.muted,
    w: 0.8,
    op: 0.5,
  });
  head(p, { hx: H - 14, hy: -30, r: 30, lid: 0.8, look: 0 });
  return [
    tailGroup(tail),
    farLeg,
    farPaw,
    ...body.items,
    nearLeg,
    nearPaw,
    ...toe.items,
    ...p.items,
  ];
}

/**
 * 정면을 보는 머리. 뾰족한 귀와 위로 살짝 치켜 올라간 아몬드 눈이 시크함을 맡는다.
 * lid는 윗눈꺼풀이 덮은 정도(0 뜸 ~ 1 감음), look은 눈동자를 오른쪽으로 미는 정도(r 배수)
 */
function head(
  p: Pencil,
  o: { hx: number; hy: number; r: number; lid: number; look: number },
) {
  const { hx, hy, r, lid, look } = o;
  for (const s of [-1, 1]) {
    const ear: Cmds = [
      "M",
      hx + s * 0.9 * r,
      hy - 0.4 * r,
      "C",
      hx + s * 0.9 * r,
      hy - 0.9 * r,
      hx + s * 0.86 * r,
      hy - 1.3 * r,
      hx + s * 0.8 * r,
      hy - 1.55 * r,
      "C",
      hx + s * 0.6 * r,
      hy - 1.32 * r,
      hx + s * 0.42 * r,
      hy - 1.08 * r,
      hx + s * 0.24 * r,
      hy - 0.92 * r,
      "Z",
    ];
    p.fill(ear, p.C.ink);
    p.pen(ear, { w: 1, a: 0.35, closed: true });
    p.hatch(
      [
        "M",
        hx + s * 0.56 * r,
        hy - 0.86 * r,
        "L",
        hx + s * 0.76 * r,
        hy - 1.3 * r,
      ],
      { color: p.C.muted, w: 0.7, op: 0.5 },
    );
  }
  const face: Cmds = [
    "M",
    hx - r,
    hy,
    "C",
    hx - r,
    hy - 0.72 * r,
    hx - 0.55 * r,
    hy - r,
    hx,
    hy - r,
    "C",
    hx + 0.55 * r,
    hy - r,
    hx + r,
    hy - 0.72 * r,
    hx + r,
    hy,
    "C",
    hx + r,
    hy + 0.58 * r,
    hx + 0.52 * r,
    hy + 0.86 * r,
    hx,
    hy + 0.86 * r,
    "C",
    hx - 0.52 * r,
    hy + 0.86 * r,
    hx - r,
    hy + 0.58 * r,
    hx - r,
    hy,
    "Z",
  ];
  p.fill(face, p.C.ink);
  p.pen(face, { w: 1.05, a: 0.4, closed: true });

  const w = 0.46 * r;
  const h = 0.36 * r;
  for (const s of [-1, 1]) {
    const ex = hx + s * 0.4 * r;
    const ey = hy + 0.04 * r;
    // 바깥 눈꼬리가 위로. 눈꺼풀은 윗곡선만 낮춘다
    const inner: [number, number] = [ex - s * w * 0.5, ey + 0.14 * h];
    const outer: [number, number] = [ex + s * w * 0.5, ey - 0.22 * h];
    const upper = ey - h * (0.95 - lid * 0.95);
    const lower = ey + h * 0.8;
    p.fill(
      [
        "M",
        inner[0],
        inner[1],
        "Q",
        ex,
        upper,
        outer[0],
        outer[1],
        "Q",
        ex + s * 0.08 * w,
        lower,
        inner[0],
        inner[1],
        "Z",
      ],
      EYE,
    );
    const top = (inner[1] + outer[1] + 2 * upper) / 4;
    const bottom = (inner[1] + outer[1] + 2 * lower) / 4;
    const py = (top + bottom) / 2 + 0.02 * r;
    const ph = Math.max(0.02 * r, (bottom - top) * 0.42);
    p.fill(ell(ex + look * r, py, 0.05 * r, ph), p.C.ink);
  }
  // 수염. 회색이라 검은 얼굴 위와 흰 종이 위에서 다 보인다
  for (const s of [-1, 1])
    for (const i of [0, 1, 2]) {
      const y0 = hy + 0.46 * r + i * 0.08 * r;
      p.hatch(
        [
          "M",
          hx + s * 0.32 * r,
          y0,
          "Q",
          hx + s * 0.95 * r,
          y0 - 0.12 * r + i * 0.06 * r,
          hx + s * 1.5 * r,
          y0 - 0.18 * r + i * 0.2 * r,
        ],
        { color: p.C.faint, w: 0.6, op: 0.85 },
      );
    }
}
