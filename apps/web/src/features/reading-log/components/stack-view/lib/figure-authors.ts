import { ell, type Pencil } from "./pencil";
import { type Cmds, lerp, rectCorners } from "./sketch";
import type { StackAuthor } from "./types";

/** 옷·머리 톤. 캐릭터는 흰 종이에 연필이라 진한 색은 이 정도에서 멈춘다 */
const TONE = {
  suit: "#E4E1DD",
  tweed: "#DCD7D1",
  mid: "#D2CCC5",
  coat: "#F3F0EA",
  dress: "#F7F5F1",
  silver: "#F1EFEC",
  brown: "#8C8279",
  dark: "#57534E",
  hair: "#44403C",
  grey: "#C9C4BE",
  shoe: "#57534E",
};

/** x를 150 기준으로 뒤집는다. 좌우 대칭인 옷·귀를 한쪽만 적는다 */
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

const both = (p: Pencil, cmds: Cmds, o?: Parameters<Pencil["pen"]>[1]) => {
  p.pen(cmds, o);
  p.pen(mirror(cmds), o);
};

/** 정장 바지. 재킷·코트 밑단(top) 아래로 두 다리가 보인다 */
function trousers(p: Pencil, top: number, tone: string) {
  const leg: Cmds = [
    "M",
    70,
    top,
    "L",
    146,
    top,
    "L",
    144,
    944,
    "L",
    76,
    944,
    "L",
    70,
    top,
  ];
  p.fill(leg, tone);
  p.fill(mirror(leg), tone);
  both(p, ["M", 70, top, "L", 75, 946]);
  both(p, ["M", 147, top + 30, "L", 144, 946]);
  // 주름선과 접단
  both(p, ["M", 110, top + 20, "L", 111, 930], {
    w: 1,
    light: false,
    op: 0.35,
  });
  both(p, ["M", 76, 922, "C", 100, 926, 124, 926, 144, 922], {
    w: 1.1,
    light: false,
    op: 0.6,
  });
  const h: Cmds = [];
  for (let y = top + 30; y <= 900; y += 26) {
    h.push("M", 80, y + 10, "L", 92, y - 4);
    h.push("M", 222, y + 10, "L", 234, y - 4);
  }
  p.hatch(h);
}

/** 끝이 둥근 구두 */
function shoes(p: Pencil) {
  const shoe: Cmds = [
    "M",
    78,
    940,
    "C",
    62,
    950,
    40,
    966,
    42,
    986,
    "C",
    42,
    994,
    60,
    996,
    146,
    995,
    "C",
    150,
    976,
    148,
    956,
    144,
    940,
    "L",
    78,
    940,
  ];
  p.fill(shoe, TONE.shoe);
  p.fill(mirror(shoe), TONE.shoe);
  both(p, shoe);
  both(p, ["M", 44, 986, "L", 146, 988], { w: 1.2 });
  both(p, ["M", 64, 960, "C", 76, 954, 90, 954, 98, 962], {
    w: 1,
    light: false,
    op: 0.5,
  });
}

/** 정장 재킷 몸판. 옷깃 V 안쪽은 셔츠(또는 조끼)가 보인다 */
function jacket(
  p: Pencil,
  o: {
    hem: number;
    tone: string;
    vDepth: number;
    buttons: number[];
    open?: boolean;
  },
) {
  const { hem, tone, vDepth, buttons, open } = o;
  p.fill(
    [
      "M",
      58,
      196,
      "C",
      80,
      178,
      118,
      170,
      150,
      170,
      "C",
      182,
      170,
      220,
      178,
      242,
      196,
      "L",
      250,
      300,
      "L",
      244,
      hem,
      "C",
      200,
      hem + 8,
      100,
      hem + 8,
      56,
      hem,
      "L",
      50,
      300,
      "L",
      58,
      196,
    ],
    tone,
  );
  both(p, [
    "M",
    150,
    170,
    "C",
    118,
    170,
    80,
    178,
    58,
    196,
    "C",
    52,
    236,
    49,
    272,
    50,
    304,
    "L",
    56,
    hem + 2,
  ]);
  p.pen(["M", 56, hem, "C", 100, hem + 8, 200, hem + 8, 244, hem]);
  // 앞여밈
  if (!open) p.pen(["M", 150, vDepth, "L", 148, hem + 6], { w: 1.5 });
  for (const y of buttons)
    p.pen(ell(156, y, 3.2, 3.2), { w: 1.2, closed: true });
  // 주머니
  both(p, ["M", 78, hem - 70, "L", 118, hem - 72], { w: 1.2, light: false });
  // 흐린 해칭으로 천이 어둡다는 것만 알린다
  const h: Cmds = [];
  for (let y = 240; y <= hem - 20; y += 26) {
    h.push("M", 60, y + 10, "L", 72, y - 4);
    h.push("M", 228, y + 10, "L", 240, y - 4);
  }
  p.hatch(h, { op: 0.35 });
}

/** 넥타이와 셔츠 앞판. V 안쪽을 채운다 */
function shirtAndTie(p: Pencil, vDepth: number, tie: string) {
  p.fill(["M", 128, 172, "L", 172, 172, "L", 150, vDepth, "L", 128, 172]);
  p.fill(
    [
      "M",
      145,
      186,
      "L",
      155,
      186,
      "L",
      158,
      vDepth - 30,
      "L",
      150,
      vDepth - 14,
      "L",
      142,
      vDepth - 30,
      "L",
      145,
      186,
    ],
    tie,
  );
  p.pen(
    [
      "M",
      145,
      188,
      "L",
      142,
      vDepth - 30,
      "L",
      150,
      vDepth - 14,
      "L",
      158,
      vDepth - 30,
      "L",
      155,
      188,
    ],
    { w: 1.4 },
  );
  p.pen(["M", 144, 176, "L", 156, 176, "L", 155, 190, "L", 145, 190, "Z"], {
    w: 1.4,
    closed: true,
  });
}

/** 넓은 옷깃. 목에서 어깨로 벌어졌다가 V 끝으로 모인다 */
function lapels(p: Pencil, vDepth: number, tone: string, endX = 150) {
  const lapel: Cmds = [
    "M",
    128,
    172,
    "C",
    118,
    184,
    108,
    196,
    100,
    206,
    "L",
    112,
    218,
    "L",
    104,
    228,
    "C",
    120,
    262,
    endX - 14,
    vDepth - 30,
    endX,
    vDepth,
  ];
  p.fill([...lapel, "L", endX, vDepth - 60, "L", 128, 172], tone);
  both(p, lapel, { w: 1.7 });
}

/** 들어 올린 오른팔. arm에 팔뚝·손을, heart에 손하트 위 하트를 따로 그린다 */
export interface RaisedArm {
  arm: Pencil;
  hand: "open" | "heart";
  heart?: Pencil;
}

/** 손 흔드는 팔의 팔꿈치. 팔뚝·손은 이 점을 축으로 흔든다 */
export const WAVE_ELBOW: [number, number] = [282, 330];

/**
 * 들어 올린 오른팔(화면 오른쪽). 윗팔은 몸과 함께 그리고,
 * 팔뚝·손은 따로 받은 연필에 그려 팔꿈치를 축으로 흔들 수 있게 한다.
 */
function raisedArm(p: Pencil, raise: RaisedArm, tone: string) {
  const wave = raise.arm;
  const [ex, ey] = WAVE_ELBOW;
  // 어깨에서 바깥 아래로 뻗은 윗팔. 안쪽 끝은 몸판에 가려진다
  const outer: Cmds = [
    "M",
    228,
    190,
    "Q",
    252,
    187,
    259,
    198,
    "L",
    ex + 21,
    ey - 7,
  ];
  p.fill(
    [
      ...outer,
      "C",
      ex + 22,
      ey + 16,
      ex - 20,
      ey + 20,
      ex - 21,
      ey + 7,
      "L",
      217,
      212,
      "L",
      228,
      190,
    ],
    tone,
  );
  // 어깨·안쪽 선. 몸판과 팔뚝 사이로 보이는 윗팔에 윤곽이 없으면 팔뚝이 떠 보인다
  p.pen(outer);
  p.pen(["M", 217, 212, "L", ex - 21, ey + 7]);
  // 팔꿈치에서 위로 세운 팔뚝
  const fore: Cmds = [
    "M",
    ex - 20,
    ey - 1,
    "L",
    272,
    207,
    "L",
    312,
    209,
    "L",
    ex + 20,
    ey + 1,
    "C",
    ex + 22,
    ey + 24,
    ex - 22,
    ey + 24,
    ex - 20,
    ey - 1,
  ];
  wave.fill(fore, tone);
  wave.pen(["M", ex - 20, ey - 1, "L", 272, 207]);
  wave.pen(["M", ex + 20, ey + 1, "L", 312, 209]);
  wave.pen([
    "M",
    ex + 20,
    ey + 1,
    "C",
    ex + 22,
    ey + 24,
    ex - 22,
    ey + 24,
    ex - 20,
    ey - 1,
  ]);
  wave.pen(["M", 272, 214, "L", 312, 216], { w: 1.2, light: false });
  if (raise.hand === "heart") fingerHeart(wave, raise.heart);
  else openHand(wave);
}

/** 편 손바닥과 엄지. 흔들면 인사가 된다 */
function openHand(wave: Pencil) {
  const palm: Cmds = [
    "M",
    276,
    210,
    "C",
    271,
    190,
    271,
    170,
    277,
    157,
    "C",
    282,
    145,
    300,
    143,
    306,
    154,
    "C",
    311,
    166,
    312,
    188,
    309,
    210,
  ];
  wave.fill([...palm, "L", 276, 210]);
  wave.pen(palm, { w: 1.7 });
  const thumb: Cmds = [
    "M",
    276,
    190,
    "C",
    266,
    186,
    259,
    177,
    262,
    170,
    "C",
    265,
    165,
    273,
    170,
    277,
    176,
  ];
  wave.fill([...thumb, "L", 276, 190]);
  wave.pen(thumb, { w: 1.6 });
  wave.hatch(
    [
      "M",
      285,
      150,
      "L",
      286,
      168,
      "M",
      293,
      147,
      "L",
      293,
      168,
      "M",
      300,
      150,
      "L",
      299,
      168,
    ],
    { w: 1.1, op: 0.55 },
  );
}

/** 손하트 위로 떠오르는 하트. 작게 그리면 손 모양만으로는 알아보기 어렵다 */
export const HEART_CENTER: [number, number] = [300, 88];
const HEART_TONE = "#F2798A";

/**
 * 손하트. 주먹 위로 엄지와 검지를 X자로 교차해 세운다. 무대에서 손은 15px 안팎이라
 * 두 손가락을 굵게 그리고, 하트 기호를 따로(heart) 그려 띄운다.
 */
function fingerHeart(wave: Pencil, heart?: Pencil) {
  // 검지와 엄지는 주먹 윗선에서 엇갈리게 먼저 그려 둥근 두 손끝만 하트의 두 볼처럼 내민다.
  // 엇갈린 선이 주먹 위로 길게 보이면 가위처럼 보인다
  const index: Cmds = [
    "M",
    282,
    188,
    "C",
    287,
    177,
    292,
    167,
    296,
    158,
    "C",
    300,
    147,
    314,
    148,
    311,
    160,
    "C",
    308,
    170,
    302,
    181,
    297,
    191,
  ];
  wave.fill([...index, "L", 282, 188]);
  wave.pen(index, { w: 1.7 });
  const thumb: Cmds = [
    "M",
    309,
    193,
    "C",
    305,
    182,
    300,
    171,
    295,
    161,
    "C",
    290,
    150,
    275,
    152,
    280,
    164,
    "C",
    284,
    174,
    289,
    184,
    293,
    195,
  ];
  wave.fill([...thumb, "L", 309, 193]);
  wave.pen(thumb, { w: 1.7 });
  // 주먹은 나중에 그려 손가락 아랫부분을 덮는다
  const fist: Cmds = [
    "M",
    275,
    212,
    "C",
    271,
    199,
    272,
    188,
    279,
    181,
    "C",
    288,
    174,
    302,
    174,
    309,
    181,
    "C",
    314,
    189,
    313,
    202,
    309,
    212,
  ];
  wave.fill([...fist, "L", 275, 212]);
  wave.pen(fist, { w: 1.7 });
  // 말아 쥔 손가락 마디
  wave.hatch(
    [
      "M",
      280,
      192,
      "Q",
      294,
      187,
      308,
      193,
      "M",
      279,
      202,
      "Q",
      294,
      198,
      309,
      204,
    ],
    { w: 1.1, op: 0.55 },
  );
  // 엄지손톱
  wave.hatch(["M", 282, 162, "Q", 285, 155, 291, 157], { w: 1.1, op: 0.55 });
  if (!heart) return;
  const [hx, hy] = HEART_CENTER;
  const shape: Cmds = [
    "M",
    hx,
    hy + 30,
    "C",
    hx - 40,
    hy + 4,
    hx - 32,
    hy - 28,
    hx - 14,
    hy - 28,
    "C",
    hx - 5,
    hy - 28,
    hx,
    hy - 20,
    hx,
    hy - 14,
    "C",
    hx,
    hy - 20,
    hx + 5,
    hy - 28,
    hx + 14,
    hy - 28,
    "C",
    hx + 32,
    hy - 28,
    hx + 40,
    hy + 4,
    hx,
    hy + 30,
  ];
  heart.fill(shape, HEART_TONE);
  heart.pen(shape, { w: 1.8, closed: true });
  heart.hatch(
    [
      "M",
      hx - 22,
      hy - 12,
      "C",
      hx - 20,
      hy - 18,
      hx - 16,
      hy - 21,
      hx - 11,
      hy - 21,
    ],
    {
      w: 2,
      op: 0.7,
      color: "#FFFFFF",
    },
  );
}

/**
 * 팔과 손. 왼손(화면 왼쪽)에 가장 최근에 읽은 책을 든다.
 * raise가 있으면 오른팔을 들어 올리고 팔뚝·손은 따로 그린다.
 */
function arms(
  p: Pencil,
  heldColor: string,
  tone: string,
  cuff = 474,
  raise?: RaisedArm,
) {
  const sleeve: Cmds = [
    "M",
    60,
    196,
    "C",
    42,
    244,
    32,
    360,
    30,
    cuff,
    "L",
    76,
    cuff + 2,
    "C",
    78,
    380,
    82,
    300,
    90,
    252,
  ];
  p.fill([...sleeve, "L", 60, 196], tone);
  if (!raise) p.fill([...mirror(sleeve), "L", 240, 196], tone);
  // 평소 모습은 선 순서(흔들림 시드)를 바꾸지 않는다
  if (raise) p.pen(sleeve);
  else both(p, sleeve);
  // 셔츠 소맷부리
  const cuffLine: Cmds = ["M", 34, cuff, "L", 72, cuff + 1];
  if (raise) p.pen(cuffLine, { w: 1.2, light: false });
  else both(p, cuffLine, { w: 1.2, light: false });
  const bc = rectCorners(42, cuff + 48, 62, 86, 0.14);
  p.fill(
    ["M", ...bc[0], "L", ...bc[1], "L", ...bc[2], "L", ...bc[3], "L", ...bc[0]],
    heldColor,
  );
  p.pen(
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
  p.pen(["M", ...lerp(bc[0], bc[1], 0.14), "L", ...lerp(bc[3], bc[2], 0.14)], {
    w: 1.1,
    light: false,
    op: 0.6,
  });
  const hand: Cmds = [
    "M",
    36,
    cuff + 2,
    "C",
    32,
    cuff + 28,
    42,
    cuff + 48,
    55,
    cuff + 48,
    "C",
    66,
    cuff + 48,
    72,
    cuff + 28,
    70,
    cuff + 2,
  ];
  p.fill([...hand, "L", 36, cuff + 2]);
  if (!raise) p.fill([...mirror(hand), "L", 264, cuff + 2]);
  if (raise) {
    p.pen(hand, { w: 1.7 });
    raisedArm(p, raise, tone);
  } else both(p, hand, { w: 1.7 });
}

/** 목. 옷깃 위로 보이는 만큼만 */
function neck(p: Pencil, top = 132, bottom = 178) {
  p.fill([
    "M",
    137,
    top,
    "L",
    163,
    top,
    "L",
    164,
    bottom,
    "L",
    136,
    bottom,
    "Z",
  ]);
  both(p, ["M", 137, top, "L", 135, bottom]);
}

/** 보통 크기의 귀 */
function ears(p: Pencil) {
  const ear: Cmds = ["M", 104, 84, "C", 92, 78, 88, 104, 102, 110];
  p.fill([...ear, "Z"]);
  p.fill([...mirror(ear), "Z"]);
  both(p, ear, { w: 1.6 });
}

/** 넥타이 위로 벌어진 셔츠 깃 */
function shirtCollar(p: Pencil) {
  const collar: Cmds = [
    "M",
    137,
    158,
    "C",
    139,
    168,
    144,
    177,
    150,
    186,
    "L",
    127,
    180,
    "L",
    137,
    158,
  ];
  p.fill(collar);
  p.fill(mirror(collar));
  both(p, collar, { w: 1.5 });
}

/** 얼굴 윤곽. 턱 끝 높이와 폭만 사람마다 다르다 */
function face(p: Pencil, o: { top: number; chin: number; half: number }) {
  const { top, chin, half } = o;
  const l = 150 - half;
  const r = 150 + half;
  const outline: Cmds = [
    "M",
    l,
    top,
    "C",
    l - 2,
    top + 36,
    l + 4,
    chin - 22,
    l + 22,
    chin - 8,
    "C",
    l + 34,
    chin + 1,
    r - 34,
    chin + 1,
    r - 22,
    chin - 8,
    "C",
    r - 4,
    chin - 22,
    r + 2,
    top + 36,
    r,
    top,
  ];
  p.fill([...outline, "L", l, top]);
  p.pen(outline);
}

/**
 * 카프카. 뾰족한 이마선의 검은 올백 머리, 튀어나온 큰 귀, 크고 검은 눈,
 * 빳빳한 흰 칼라에 짙은 쓰리피스.
 */
function kafka(p: Pencil, heldColor: string, raise?: RaisedArm) {
  const v = 318;
  trousers(p, 560, TONE.suit);
  shoes(p);
  arms(p, heldColor, TONE.suit, undefined, raise);
  jacket(p, { hem: 575, tone: TONE.suit, vDepth: v, buttons: [350, 410] });
  shirtAndTie(p, v, TONE.dark);
  // 조끼. 옷깃 안쪽으로 조끼 여밈과 단추가 보인다
  both(p, ["M", 124, 226, "L", 150, 306], { w: 1.2, light: false, op: 0.7 });
  lapels(p, v, TONE.suit);
  neck(p, 128, 172);
  // 빳빳하게 선 흰 칼라
  const collar: Cmds = [
    "M",
    136,
    154,
    "C",
    138,
    166,
    143,
    176,
    150,
    186,
    "L",
    126,
    180,
    "L",
    136,
    154,
  ];
  p.fill([...collar, "Z"]);
  p.fill([...mirror(collar), "Z"]);
  both(p, collar, { w: 1.5 });

  p.headOn();
  // 큰 귀
  const ear: Cmds = [
    "M",
    104,
    76,
    "C",
    86,
    62,
    74,
    92,
    84,
    114,
    "C",
    90,
    124,
    100,
    124,
    106,
    114,
  ];
  p.fill([...ear, "Z"]);
  p.fill([...mirror(ear), "Z"]);
  both(p, ear, { w: 1.8 });
  both(p, ["M", 96, 86, "C", 88, 90, 88, 104, 96, 110], {
    w: 1.1,
    light: false,
    op: 0.6,
  });
  face(p, { top: 64, chin: 152, half: 43 });

  // 검은 올백 머리. 숱 많은 윗머리를 뒤로 넘겼고 이마 가운데가 뾰족하게 내려온다
  const hair: Cmds = [
    "M",
    106,
    84,
    "C",
    96,
    54,
    100,
    26,
    118,
    12,
    "C",
    126,
    4,
    138,
    0,
    148,
    4,
    "C",
    158,
    -1,
    172,
    2,
    182,
    10,
    "C",
    198,
    22,
    206,
    50,
    194,
    84,
    "C",
    192,
    66,
    184,
    56,
    170,
    54,
    "C",
    160,
    54,
    154,
    58,
    150,
    68,
    "C",
    146,
    58,
    140,
    54,
    130,
    54,
    "C",
    116,
    56,
    108,
    66,
    106,
    84,
  ];
  p.fill(hair, TONE.hair);
  p.pen(hair, { closed: true });
  p.hatch(
    [
      "M",
      116,
      46,
      "C",
      122,
      28,
      138,
      16,
      160,
      14,
      "M",
      128,
      50,
      "C",
      136,
      34,
      152,
      26,
      176,
      26,
      "M",
      170,
      40,
      "C",
      180,
      42,
      188,
      50,
      192,
      62,
    ],
    { w: 1.3, op: 0.35, color: p.C.paper },
  );

  // 크고 검은 눈과 곧은 눈썹
  p.pen(["M", 121, 82, "L", 140, 80], { w: 2.4, a: 0.4 });
  p.pen(["M", 160, 80, "L", 179, 82], { w: 2.4, a: 0.4 });
  p.fill(ell(131, 96, 6, 5), p.C.ink);
  p.fill(ell(169, 96, 6, 5), p.C.ink);
  p.pen(["M", 122, 93, "C", 126, 88, 136, 88, 140, 93], { w: 1.4, a: 0.3 });
  p.pen(["M", 160, 93, "C", 164, 88, 174, 88, 178, 93], { w: 1.4, a: 0.3 });
  p.pen(["M", 151, 98, "L", 146, 118, "L", 154, 119], { w: 1.5, a: 0.4 });
  p.pen(["M", 141, 131, "C", 146, 133, 154, 133, 159, 131], {
    w: 1.6,
    a: 0.3,
  });
}

/**
 * 사르트르. 두꺼운 동그란 뿔테, 입에 문 파이프, 벗겨진 이마로 넘긴 회색 머리,
 * 한쪽 눈이 바깥을 보는 사시. 작은 키는 축척이 알아서 보여 준다.
 */
function sartre(p: Pencil, heldColor: string, raise?: RaisedArm) {
  const v = 310;
  trousers(p, 565, TONE.tweed);
  shoes(p);
  arms(p, heldColor, TONE.tweed, undefined, raise);
  jacket(p, { hem: 582, tone: TONE.tweed, vDepth: v, buttons: [345, 402] });
  shirtAndTie(p, v, TONE.dark);
  lapels(p, v, TONE.tweed);
  neck(p, 128, 176);
  shirtCollar(p);
  p.headOn();
  ears(p);
  face(p, { top: 58, chin: 146, half: 48 });

  // 벗겨진 이마 위로 넘긴 회색 머리
  const hair: Cmds = [
    "M",
    103,
    82,
    "C",
    96,
    42,
    116,
    12,
    150,
    12,
    "C",
    184,
    12,
    204,
    42,
    197,
    82,
    "C",
    194,
    62,
    186,
    50,
    172,
    45,
    "C",
    160,
    41,
    140,
    41,
    128,
    45,
    "C",
    114,
    50,
    106,
    62,
    103,
    82,
  ];
  p.fill(hair, TONE.grey);
  p.pen(hair, { closed: true });
  p.hatch(
    [
      "M",
      116,
      40,
      "C",
      126,
      26,
      146,
      20,
      166,
      22,
      "M",
      132,
      42,
      "C",
      142,
      32,
      160,
      28,
      182,
      34,
      "M",
      108,
      60,
      "C",
      110,
      50,
      116,
      44,
      124,
      42,
    ],
    { w: 1.1, op: 0.5 },
  );
  // 이마 주름
  p.hatch(
    [
      "M",
      132,
      56,
      "C",
      142,
      53,
      158,
      53,
      168,
      56,
      "M",
      137,
      64,
      "C",
      145,
      62,
      155,
      62,
      163,
      64,
    ],
    { w: 1, op: 0.45 },
  );

  // 눈. 오른눈(화면 오른쪽)은 바깥으로 비껴 본다
  p.pen(["M", 119, 80, "Q", 130, 75, 141, 80], {
    w: 1.6,
    a: 0.3,
    light: false,
  });
  p.pen(["M", 159, 80, "Q", 170, 75, 181, 80], {
    w: 1.6,
    a: 0.3,
    light: false,
  });
  p.fill(ell(130, 99, 3, 3.2), p.C.ink);
  p.fill(ell(176, 98, 3, 3.2), p.C.ink);
  // 두꺼운 동그란 뿔테
  p.pen(ell(130, 99, 14.5, 13), { w: 3, a: 0.3, closed: true });
  p.pen(ell(170, 99, 14.5, 13), { w: 3, a: 0.3, closed: true });
  p.pen(["M", 144, 97, "Q", 150, 92, 156, 97], { w: 2.4, a: 0.2 });
  both(p, ["M", 116, 95, "L", 103, 91], { w: 2.2, light: false });
  p.pen(["M", 150, 108, "L", 145, 123, "L", 154, 124], { w: 1.5, a: 0.4 });
  p.pen(["M", 139, 134, "C", 145, 136, 154, 136, 161, 132], { w: 1.6, a: 0.3 });

  // 입꼬리에 문 파이프와 연기
  p.pen(["M", 141, 135, "C", 130, 140, 114, 142, 102, 143], {
    w: 2.8,
    a: 0.3,
    light: false,
  });
  const bowl: Cmds = [
    "M",
    88,
    134,
    "L",
    104,
    134,
    "C",
    105,
    147,
    102,
    157,
    96,
    159,
    "C",
    90,
    157,
    87,
    147,
    88,
    134,
  ];
  p.fill(bowl, TONE.dark);
  p.pen(bowl, { w: 1.7, closed: true });
  p.hatch(
    [
      "M",
      96,
      130,
      "C",
      90,
      124,
      100,
      118,
      93,
      110,
      "C",
      88,
      104,
      96,
      98,
      90,
      90,
    ],
    {
      w: 1.3,
      op: 0.45,
    },
  );
}

/**
 * 카뮈. 깃을 세운 트렌치코트(벨트·더블 단추), 입꼬리의 담배,
 * 옆가르마로 넘긴 검은 머리와 살짝 내리깐 눈.
 */
function camus(p: Pencil, heldColor: string, raise?: RaisedArm) {
  const hem = 718;
  trousers(p, 690, TONE.mid);
  shoes(p);
  arms(p, heldColor, TONE.coat, undefined, raise);
  // 팔을 들면 오른쪽 소매가 없어 선이 허공에 뜬다
  const sleeveLine: Cmds = ["M", 32, 440, "L", 74, 443];
  const sleeveStyle = { w: 1.2, light: false, op: 0.6 };
  if (raise) p.pen(sleeveLine, sleeveStyle);
  else both(p, sleeveLine, sleeveStyle);

  // 아래로 퍼지는 코트 몸판
  const body: Cmds = [
    "M",
    58,
    196,
    "C",
    80,
    178,
    118,
    170,
    150,
    170,
    "C",
    182,
    170,
    220,
    178,
    242,
    196,
    "L",
    252,
    300,
    "L",
    266,
    hem,
    "C",
    200,
    hem + 10,
    100,
    hem + 10,
    34,
    hem,
    "L",
    48,
    300,
    "L",
    58,
    196,
  ];
  p.fill(body, TONE.coat);
  both(p, [
    "M",
    150,
    170,
    "C",
    118,
    170,
    80,
    178,
    58,
    196,
    "C",
    52,
    236,
    49,
    272,
    48,
    304,
    "L",
    34,
    hem + 2,
  ]);
  p.pen(["M", 34, hem, "C", 100, hem + 10, 200, hem + 10, 266, hem]);
  // 오른섶이 왼섶 위로 겹친다
  p.pen(["M", 172, 330, "L", 182, hem + 8], { w: 1.5 });
  p.hatch(
    [
      "M",
      92,
      450,
      "L",
      80,
      700,
      "M",
      214,
      450,
      "L",
      226,
      700,
      "M",
      122,
      460,
      "L",
      118,
      704,
    ],
    {
      op: 0.3,
    },
  );
  for (const y of [352, 474, 590]) {
    p.pen(ell(128, y, 3.4, 3.4), { w: 1.2, closed: true });
    p.pen(ell(186, y, 3.4, 3.4), { w: 1.2, closed: true });
  }
  // 허리띠와 버클
  const belt: Cmds = [
    "M",
    49,
    404,
    "C",
    100,
    412,
    200,
    412,
    251,
    404,
    "L",
    252,
    428,
    "C",
    200,
    436,
    100,
    436,
    48,
    428,
    "L",
    49,
    404,
  ];
  p.fill(belt, TONE.coat);
  p.pen(belt, { w: 1.6, closed: true });
  p.pen(
    ["M", 140, 406, "L", 162, 407, "L", 162, 433, "L", 140, 432, "L", 140, 406],
    {
      w: 1.4,
      closed: true,
    },
  );
  p.pen(["M", 151, 408, "L", 151, 431], { w: 1.1, light: false });

  shirtAndTie(p, 300, TONE.dark);
  lapels(p, 330, TONE.coat);
  both(p, ["M", 66, 192, "L", 104, 178], { w: 1.2, light: false, op: 0.6 });
  neck(p, 128, 172);
  // 목 뒤로 세운 깃
  const collar: Cmds = [
    "M",
    130,
    170,
    "L",
    114,
    138,
    "L",
    100,
    150,
    "L",
    102,
    198,
    "L",
    124,
    184,
  ];
  p.fill([...collar, "Z"], TONE.coat);
  p.fill([...mirror(collar), "Z"], TONE.coat);
  both(p, collar, { w: 1.7 });
  p.headOn();
  ears(p);
  face(p, { top: 62, chin: 148, half: 45 });

  // 옆가르마로 넘긴 검은 머리
  const hair: Cmds = [
    "M",
    104,
    82,
    "C",
    96,
    44,
    112,
    10,
    150,
    8,
    "C",
    190,
    6,
    208,
    40,
    196,
    82,
    "C",
    192,
    62,
    180,
    54,
    164,
    52,
    "C",
    146,
    50,
    128,
    52,
    116,
    58,
    "C",
    108,
    64,
    105,
    72,
    104,
    82,
  ];
  p.fill(hair, TONE.hair);
  p.pen(hair, { closed: true });
  p.hatch(
    [
      "M",
      124,
      54,
      "C",
      122,
      40,
      126,
      24,
      138,
      14,
      "M",
      140,
      50,
      "C",
      150,
      34,
      170,
      24,
      190,
      30,
      "M",
      150,
      52,
      "C",
      162,
      42,
      178,
      40,
      192,
      50,
    ],
    { w: 1.3, op: 0.35, color: p.C.paper },
  );

  // 살짝 덮인 눈. 눈동자는 옆을 본다
  p.pen(["M", 120, 84, "L", 140, 82], { w: 2.2, a: 0.4 });
  p.pen(["M", 160, 82, "L", 180, 85], { w: 2.2, a: 0.4 });
  p.pen(["M", 122, 96, "C", 127, 92, 136, 92, 140, 96], {
    w: 1.5,
    a: 0.3,
    light: false,
  });
  p.pen(["M", 160, 96, "C", 164, 92, 173, 92, 178, 96], {
    w: 1.5,
    a: 0.3,
    light: false,
  });
  p.fill(ell(134, 98, 3.2, 3), p.C.ink);
  p.fill(ell(172, 98, 3.2, 3), p.C.ink);
  p.pen(["M", 151, 102, "L", 147, 119, "L", 155, 120], { w: 1.5, a: 0.4 });
  p.pen(["M", 139, 131, "C", 146, 134, 154, 133, 161, 128], { w: 1.6, a: 0.3 });

  // 입꼬리의 담배와 연기
  const cig: Cmds = [
    "M",
    157,
    131,
    "L",
    188,
    142,
    "L",
    186,
    147,
    "L",
    155,
    136,
    "L",
    157,
    131,
  ];
  p.fill(cig);
  p.pen(cig, { w: 1.3, closed: true, light: false });
  p.pen(["M", 184, 141, "L", 182, 146], { w: 2.4, light: false, op: 0.7 });
  p.hatch(
    [
      "M",
      192,
      140,
      "C",
      200,
      134,
      196,
      126,
      204,
      120,
      "C",
      210,
      114,
      206,
      106,
      212,
      100,
    ],
    {
      w: 1.3,
      op: 0.45,
    },
  );
}

/**
 * 울프. 가운데 가르마로 귀를 덮어 넘긴 머리와 뒤로 보이는 낮은 쪽머리,
 * 긴 얼굴·긴 코·내리깐 눈, 목이 올라온 발목까지의 원피스.
 */
function woolf(p: Pencil, heldColor: string, raise?: RaisedArm) {
  shoes(p);
  // 뒤로 묶은 쪽머리와 뒷머리. 얼굴보다 먼저 그려 뒤에 놓는다
  p.headOn();
  p.fill(ell(208, 136, 19, 17), TONE.brown);
  p.pen(ell(208, 136, 19, 17), { closed: true });
  p.hatch(
    [
      "M",
      196,
      128,
      "C",
      204,
      122,
      216,
      124,
      222,
      132,
      "M",
      198,
      142,
      "C",
      206,
      136,
      216,
      138,
      220,
      146,
    ],
    {
      op: 0.5,
      color: p.C.paper,
    },
  );
  p.headOff();
  neck(p, 120, 180);
  arms(p, heldColor, TONE.dress, 470, raise);

  // 원피스. 허리를 잘록하게 잡고 발목까지 퍼진다
  const dress: Cmds = [
    "M",
    66,
    196,
    "C",
    86,
    180,
    118,
    174,
    150,
    174,
    "C",
    182,
    174,
    214,
    180,
    234,
    196,
    "L",
    238,
    300,
    "C",
    234,
    340,
    222,
    380,
    218,
    404,
    "C",
    236,
    560,
    262,
    800,
    272,
    962,
    "C",
    200,
    974,
    100,
    974,
    28,
    962,
    "C",
    38,
    800,
    64,
    560,
    82,
    404,
    "C",
    78,
    380,
    66,
    340,
    62,
    300,
    "L",
    66,
    196,
  ];
  p.fill(dress, TONE.dress);
  both(p, [
    "M",
    150,
    174,
    "C",
    118,
    174,
    86,
    180,
    66,
    196,
    "L",
    62,
    300,
    "C",
    66,
    340,
    78,
    380,
    82,
    404,
    "C",
    64,
    560,
    38,
    800,
    28,
    964,
  ]);
  p.pen(["M", 28, 962, "C", 100, 974, 200, 974, 272, 962]);
  p.pen(["M", 82, 404, "C", 110, 412, 190, 412, 218, 404], {
    w: 1.3,
    light: false,
    op: 0.6,
  });
  const folds: Cmds = [];
  for (const x of [98, 122, 150, 178, 202]) {
    const spread = (x - 150) * 1.6;
    folds.push(
      "M",
      x,
      420,
      "C",
      x + spread * 0.2,
      600,
      x + spread * 0.6,
      800,
      x + spread,
      956,
    );
  }
  p.hatch(folds, { op: 0.35 });
  p.hatch(
    [
      "M",
      126,
      214,
      "C",
      124,
      300,
      128,
      360,
      132,
      396,
      "M",
      174,
      214,
      "C",
      176,
      300,
      172,
      360,
      168,
      396,
    ],
    {
      op: 0.25,
    },
  );
  // 둥글게 올라온 목선
  p.pen(["M", 130, 174, "C", 138, 188, 162, 188, 170, 174], { w: 1.6 });

  p.headOn();
  face(p, { top: 58, chin: 158, half: 40 });
  // 가운데 가르마로 귀를 덮어 넘긴 앞머리
  const hair: Cmds = [
    "M",
    150,
    18,
    "C",
    120,
    18,
    100,
    42,
    100,
    80,
    "C",
    100,
    102,
    104,
    118,
    112,
    130,
    "C",
    114,
    106,
    116,
    82,
    126,
    68,
    "C",
    136,
    58,
    146,
    50,
    150,
    34,
    "C",
    154,
    50,
    164,
    58,
    174,
    68,
    "C",
    184,
    82,
    186,
    106,
    188,
    130,
    "C",
    196,
    118,
    200,
    102,
    200,
    80,
    "C",
    200,
    42,
    180,
    18,
    150,
    18,
  ];
  p.fill(hair, TONE.brown);
  p.pen(hair, { closed: true });
  p.hatch(
    [
      "M",
      146,
      38,
      "C",
      132,
      44,
      116,
      58,
      108,
      86,
      "M",
      154,
      38,
      "C",
      168,
      44,
      184,
      58,
      192,
      86,
      "M",
      140,
      30,
      "C",
      124,
      34,
      110,
      50,
      104,
      70,
    ],
    { w: 1.2, op: 0.4, color: p.C.paper },
  );

  // 내리깐 눈, 긴 코, 작은 입
  p.fill(ell(132, 105.5, 3, 2.6), p.C.ink);
  p.fill(ell(168, 105.5, 3, 2.6), p.C.ink);
  p.pen(["M", 124, 88, "Q", 131, 84, 139, 87], {
    w: 1.4,
    a: 0.3,
    light: false,
  });
  p.pen(["M", 161, 87, "Q", 169, 84, 176, 88], {
    w: 1.4,
    a: 0.3,
    light: false,
  });
  p.pen(["M", 124, 99, "C", 128, 103, 135, 103, 139, 99], { w: 1.8, a: 0.3 });
  p.pen(["M", 161, 99, "C", 165, 103, 172, 103, 176, 99], { w: 1.8, a: 0.3 });
  p.pen(["M", 151, 96, "L", 147, 128, "L", 155, 129], { w: 1.5, a: 0.4 });
  p.pen(["M", 143, 141, "C", 147, 143, 153, 143, 157, 141], { w: 1.6, a: 0.3 });
}

/**
 * 쿤데라. 숱 많은 은발, 미간을 찌푸린 굵은 눈썹, 검은 터틀넥 위에 앞을 연 재킷.
 */
function kundera(p: Pencil, heldColor: string, raise?: RaisedArm) {
  const hem = 590;
  trousers(p, 575, TONE.mid);
  shoes(p);
  arms(p, heldColor, TONE.mid, undefined, raise);
  jacket(p, { hem, tone: TONE.mid, vDepth: hem, buttons: [], open: true });
  // 열린 앞섶 사이로 보이는 터틀넥
  p.fill(
    [
      "M",
      124,
      172,
      "L",
      176,
      172,
      "L",
      172,
      hem + 7,
      "L",
      128,
      hem + 7,
      "L",
      124,
      172,
    ],
    TONE.dark,
  );
  both(p, ["M", 126, 300, "L", 128, hem + 7], { w: 1.6 });
  p.pen(
    ["M", 130, hem - 16, "C", 142, hem - 12, 158, hem - 12, 170, hem - 16],
    {
      w: 1,
      light: false,
      op: 0.4,
    },
  );
  lapels(p, 300, TONE.mid, 126);
  // 목을 덮은 접힌 깃
  const turtle: Cmds = [
    "M",
    130,
    128,
    "L",
    170,
    128,
    "L",
    174,
    184,
    "L",
    126,
    184,
    "L",
    130,
    128,
  ];
  p.fill(turtle, TONE.dark);
  p.pen(turtle, { w: 1.7, closed: true });
  p.hatch(["M", 128, 156, "C", 140, 160, 160, 160, 172, 156], {
    w: 1.2,
    op: 0.6,
    color: p.C.paper,
  });
  const ribs: Cmds = [];
  for (let x = 136; x <= 164; x += 7) ribs.push("M", x, 160, "L", x, 182);
  p.hatch(ribs, { op: 0.3, color: p.C.paper });
  p.headOn();
  ears(p);
  face(p, { top: 62, chin: 150, half: 46 });

  // 숱 많은 은발. 뒤로 빗어 넘겼다
  const hair: Cmds = [
    "M",
    101,
    86,
    "C",
    90,
    52,
    98,
    18,
    124,
    8,
    "C",
    140,
    0,
    162,
    0,
    178,
    8,
    "C",
    204,
    20,
    212,
    52,
    199,
    86,
    "C",
    196,
    70,
    188,
    58,
    176,
    56,
    "C",
    160,
    52,
    140,
    52,
    124,
    56,
    "C",
    112,
    60,
    104,
    70,
    101,
    86,
  ];
  p.fill(hair, TONE.silver);
  p.pen(hair, { closed: true });
  p.hatch(
    [
      "M",
      112,
      60,
      "C",
      112,
      40,
      122,
      22,
      138,
      14,
      "M",
      128,
      54,
      "C",
      132,
      36,
      146,
      22,
      164,
      18,
      "M",
      150,
      52,
      "C",
      160,
      36,
      176,
      28,
      192,
      34,
      "M",
      172,
      56,
      "C",
      182,
      50,
      192,
      54,
      198,
      66,
      "M",
      104,
      76,
      "C",
      102,
      66,
      104,
      58,
      110,
      52,
    ],
    { w: 1.1, op: 0.5 },
  );

  // 찌푸린 굵은 눈썹, 작고 깊은 눈, 굳게 다문 입
  p.pen(["M", 119, 84, "L", 141, 89], { w: 2.7, a: 0.4 });
  p.pen(["M", 159, 89, "L", 181, 84], { w: 2.7, a: 0.4 });
  p.hatch(["M", 147, 80, "L", 148, 89, "M", 153, 80, "L", 152, 89], {
    w: 1.1,
    op: 0.55,
  });
  p.fill(ell(131, 99, 3, 2.7), p.C.ink);
  p.fill(ell(169, 99, 3, 2.7), p.C.ink);
  p.hatch(
    [
      "M",
      124,
      105,
      "C",
      128,
      107,
      134,
      107,
      138,
      105,
      "M",
      162,
      105,
      "C",
      166,
      107,
      172,
      107,
      176,
      105,
    ],
    {
      op: 0.45,
    },
  );
  p.pen(["M", 151, 100, "L", 146, 121, "L", 155, 122], { w: 1.7, a: 0.4 });
  p.hatch(
    [
      "M",
      136,
      114,
      "C",
      132,
      122,
      132,
      130,
      136,
      138,
      "M",
      164,
      114,
      "C",
      168,
      122,
      168,
      130,
      164,
      138,
    ],
    {
      op: 0.4,
    },
  );
  p.pen(["M", 140, 136, "C", 146, 132, 154, 132, 160, 136], { w: 1.8, a: 0.3 });
}

/** 작가 캐리커처. 표정은 고정이고 들고 있는 책 색만 바뀐다 */
export function drawAuthor(
  p: Pencil,
  o: { author: StackAuthor; heldColor: string; raise?: RaisedArm },
) {
  const draw = { kafka, sartre, camus, woolf, kundera }[o.author];
  draw(p, o.heldColor, o.raise);
}
