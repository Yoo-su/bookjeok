import { ell, type Pencil } from "./pencil";
import { type Cmds, lerp, rectCorners } from "./sketch";
import type { StackObject } from "./types";

const TONE = {
  rubber: "#F7F5F1",
  metal: "#D2CCC5",
  tip: "#44403C",
  fur: "#E4E1DD",
  collar: "#57534E",
  ear: "#8C8279",
  glass: "#E9EBE7",
  spot: "#B8ADA2",
  dark: "#292524",
};

const pts = (list: [number, number][]): Cmds =>
  list.flatMap(([x, y], i) => [i ? "L" : "M", x, y]);

/** 세워 둔 지우개. 종이 슬리브(최근 읽은 책 색)를 두르고 왼쪽 윗모서리가 닳았다 */
function drawEraser(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  // 비스듬히 본 두께 방향
  const dx = 70;
  const dy = -46;

  // 옆면
  const side = pts([
    [400, 62],
    [400 + dx, 62 + dy],
    [400 + dx, 1000 + dy],
    [400, 1000],
  ]);
  fill(side, TONE.rubber);
  // 윗면. 닳은 모서리 쪽은 둥글게 먹혀 들어갔다
  const top: Cmds = [
    "M",
    128,
    74,
    "L",
    400,
    62,
    "L",
    400 + dx,
    62 + dy,
    "L",
    205,
    26,
    "C",
    160,
    28,
    128,
    46,
    128,
    74,
  ];
  fill(top, TONE.rubber);
  // 앞면
  const front: Cmds = [
    "M",
    40,
    1000,
    "L",
    40,
    200,
    "C",
    40,
    128,
    72,
    84,
    128,
    74,
    "L",
    400,
    62,
    "L",
    400,
    1000,
    "Z",
  ];
  fill(front);

  // 슬리브
  const sleeveTop = 330;
  const sleeveBottom = 870;
  fill(
    pts([
      [406, sleeveTop],
      [406 + dx, sleeveTop + dy],
      [406 + dx, sleeveBottom + dy],
      [406, sleeveBottom],
    ]),
    held,
  );
  fill(
    pts([
      [33, sleeveTop],
      [406, sleeveTop],
      [406, sleeveBottom],
      [33, sleeveBottom],
    ]),
    held,
  );
  // 옆면 슬리브 그늘
  const shade: Cmds = [];
  for (let y = sleeveTop + 10; y < sleeveBottom - 20; y += 34)
    shade.push("M", 414, y + 26, "L", 462, y - 6);
  hatch(shade, { op: 0.45 });

  // 윤곽
  pen(front, { closed: true });
  pen([
    "M",
    400,
    62,
    "L",
    400 + dx,
    62 + dy,
    "L",
    205,
    26,
    "C",
    160,
    28,
    128,
    46,
    128,
    74,
  ]);
  pen(["M", 400 + dx, 62 + dy, "L", 400 + dx, 1000 + dy, "L", 400, 1000]);
  pen(
    [
      "M",
      33,
      sleeveTop,
      "L",
      406,
      sleeveTop,
      "L",
      406 + dx,
      sleeveTop + dy,
      "M",
      33,
      sleeveBottom,
      "L",
      406,
      sleeveBottom,
      "L",
      406 + dx,
      sleeveBottom + dy,
      "M",
      33,
      sleeveTop,
      "L",
      33,
      sleeveBottom,
    ],
    { w: 1.6 },
  );
  // 슬리브 띠와 이름표
  pen(["M", 33, sleeveTop + 44, "L", 406, sleeveTop + 44], {
    w: 1,
    light: false,
    op: 0.5,
  });
  pen(["M", 33, sleeveBottom - 44, "L", 406, sleeveBottom - 44], {
    w: 1,
    light: false,
    op: 0.5,
  });
  const label: Cmds = [
    "M",
    100,
    520,
    "L",
    340,
    520,
    "Q",
    356,
    520,
    356,
    536,
    "L",
    356,
    664,
    "Q",
    356,
    680,
    340,
    680,
    "L",
    100,
    680,
    "Q",
    84,
    680,
    84,
    664,
    "L",
    84,
    536,
    "Q",
    84,
    520,
    100,
    520,
  ];
  fill(label);
  pen(label, { w: 1.3 });
  pen(["M", 120, 580, "C", 170, 570, 240, 588, 318, 576], {
    w: 1.2,
    light: false,
    op: 0.7,
  });
  pen(["M", 120, 626, "C", 160, 620, 210, 632, 262, 622], {
    w: 1.2,
    light: false,
    op: 0.7,
  });

  // 닳은 모서리의 연필 가루와 옆면 결
  hatch(
    [
      "M",
      60,
      170,
      "L",
      96,
      118,
      "M",
      74,
      190,
      "L",
      118,
      128,
      "M",
      96,
      196,
      "L",
      140,
      136,
    ],
    { op: 0.3, w: 1.4 },
  );
  hatch(
    [
      "M",
      416,
      300,
      "L",
      458,
      258,
      "M",
      416,
      240,
      "L",
      458,
      198,
      "M",
      416,
      180,
      "L",
      458,
      138,
      "M",
      416,
      996,
      "L",
      458,
      954,
      "M",
      416,
      940,
      "L",
      440,
      916,
    ],
    { op: 0.35 },
  );

  // 바닥에 떨어진 지우개 가루
  pen(
    [
      "M",
      492,
      994,
      "C",
      500,
      982,
      516,
      986,
      512,
      996,
      "M",
      530,
      990,
      "C",
      536,
      980,
      552,
      982,
      548,
      994,
      "M",
      470,
      998,
      "C",
      474,
      990,
      486,
      992,
      484,
      999,
    ],
    { w: 1.1, light: false, op: 0.8 },
  );
}

/** 깎아 둔 새 연필. 몸통은 최근 읽은 책 색, 아래에 쇠테와 지우개 */
function drawPencil(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  const scallop: Cmds = [
    "Q",
    13,
    202,
    27,
    189,
    "Q",
    40,
    204,
    53,
    189,
    "Q",
    67,
    202,
    80,
    186,
  ];

  // 몸통
  const body: Cmds = ["M", 0, 186, ...scallop, "L", 80, 860, "L", 0, 860, "Z"];
  fill(body, held);
  // 깎은 나무
  const wood: Cmds = ["M", 27, 64, "L", 0, 186, ...scallop, "L", 53, 64, "Z"];
  fill(wood);
  // 심
  const tip: Cmds = ["M", 40, 0, "L", 27, 64, "L", 53, 64, "Z"];
  fill(tip, TONE.tip);
  // 쇠테와 지우개
  fill(
    pts([
      [-3, 860],
      [83, 860],
      [83, 936],
      [-3, 936],
    ]),
    TONE.metal,
  );
  const rubber: Cmds = [
    "M",
    2,
    936,
    "L",
    2,
    988,
    "Q",
    2,
    1000,
    14,
    1000,
    "L",
    66,
    1000,
    "Q",
    78,
    1000,
    78,
    988,
    "L",
    78,
    936,
  ];
  fill([...rubber, "Z"], TONE.rubber);

  // 육각 몸통의 모서리와 그늘
  pen(["M", 23, 196, "L", 23, 860, "M", 57, 196, "L", 57, 860], {
    w: 1,
    light: false,
    op: 0.45,
  });
  const shade: Cmds = [];
  for (let y = 240; y < 850; y += 30) shade.push("M", 60, y + 16, "L", 78, y);
  hatch(shade, { op: 0.4 });
  hatch(["M", 10, 230, "L", 10, 820], { color: "#FFFFFF", op: 0.45, w: 2 });
  // 나무 결
  hatch(
    [
      "M",
      33,
      90,
      "L",
      22,
      176,
      "M",
      47,
      90,
      "L",
      58,
      176,
      "M",
      40,
      100,
      "L",
      40,
      180,
    ],
    {
      op: 0.3,
    },
  );

  pen([
    "M",
    40,
    0,
    "L",
    0,
    186,
    "L",
    0,
    860,
    "M",
    40,
    0,
    "L",
    80,
    186,
    "L",
    80,
    860,
  ]);
  pen(["M", 0, 186, ...scallop], { w: 1.3 });
  pen(["M", 27, 64, "Q", 40, 70, 53, 64], { w: 1.1, light: false });
  pen(
    pts([
      [-3, 860],
      [83, 860],
      [83, 936],
      [-3, 936],
      [-3, 860],
    ]),
    { w: 1.5 },
  );
  pen(["M", -3, 880, "L", 83, 880, "M", -3, 916, "L", 83, 916], {
    w: 1,
    light: false,
    op: 0.55,
  });
  pen(rubber, { w: 1.5 });
}

/**
 * 앉아서 책을 문 닥스훈트. 왼쪽(쌓은 책 쪽)을 본다.
 * 짧은 앞다리, 앞으로 불룩한 가슴, 길고 굵은 몸통, 긴 주둥이와 늘어진 귀로 알아보게 한다
 */
function drawDachshund(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;

  // 꼬리. 바닥을 따라 뒤로 뻗다가 끝이 들린다
  const tail: Cmds = [
    "M",
    640,
    968,
    "C",
    700,
    972,
    742,
    952,
    756,
    900,
    "C",
    760,
    884,
    746,
    880,
    742,
    896,
    "C",
    730,
    934,
    700,
    944,
    636,
    938,
    "Z",
  ];
  fill(tail, TONE.fur);
  pen(tail, { closed: true, w: 1.6 });

  // 배 아래 그늘. 앞다리와 뒷다리 사이로 먼 쪽 뒷다리가 보인다
  const under: Cmds = [
    "M",
    280,
    828,
    "C",
    330,
    846,
    372,
    852,
    404,
    852,
    "C",
    404,
    920,
    414,
    968,
    432,
    994,
    "L",
    300,
    996,
    "Z",
  ];
  fill(under, TONE.metal);
  hatch(
    [
      "M",
      350,
      900,
      "L",
      378,
      872,
      "M",
      352,
      940,
      "L",
      386,
      906,
      "M",
      360,
      976,
      "L",
      398,
      938,
    ],
    { op: 0.35 },
  );

  // 뒷발
  const hind: Cmds = [
    "M",
    474,
    994,
    "L",
    352,
    996,
    "C",
    334,
    990,
    334,
    970,
    354,
    964,
    "C",
    386,
    958,
    432,
    960,
    466,
    966,
  ];
  fill([...hind, "Z"], TONE.fur);

  // 몸통. 목·가슴·배·엉덩이를 한 덩어리로
  const chest: Cmds = [
    "M",
    268,
    270,
    "C",
    214,
    356,
    140,
    520,
    156,
    690,
    "C",
    164,
    762,
    192,
    804,
    232,
    820,
  ];
  const back: Cmds = [
    "M",
    436,
    996,
    "L",
    616,
    996,
    "C",
    676,
    970,
    700,
    860,
    664,
    760,
    "C",
    624,
    640,
    548,
    480,
    500,
    330,
    "C",
    486,
    282,
    466,
    238,
    444,
    206,
  ];
  const body: Cmds = [
    ...chest,
    "L",
    404,
    852,
    "C",
    402,
    930,
    414,
    974,
    436,
    994,
    ...back.slice(3),
    "Z",
  ];
  fill(body, TONE.fur);
  pen(chest);
  pen(back);
  pen(["M", 232, 820, "C", 300, 842, 360, 852, 404, 852], { w: 1.3, op: 0.8 });
  pen(hind);
  pen(["M", 376, 976, "L", 378, 994, "M", 398, 974, "L", 400, 994], {
    w: 1.1,
    light: false,
  });
  // 뒷다리 허벅지
  pen(
    [
      "M",
      442,
      992,
      "C",
      420,
      902,
      462,
      800,
      566,
      792,
      "C",
      628,
      790,
      660,
      832,
      668,
      884,
    ],
    { w: 1.6 },
  );
  // 등·가슴·허벅지 털 그늘
  const fur: Cmds = [];
  for (let t = 0; t < 7; t++) {
    const y = 360 + t * 62;
    const x = 500 + t * 24;
    fur.push("M", x - 34, y + 24, "L", x - 8, y);
  }
  for (let t = 0; t < 5; t++) {
    const y = 460 + t * 58;
    fur.push("M", 164 + t, y, "L", 188 + t, y + 20);
  }
  for (let t = 0; t < 4; t++)
    fur.push("M", 588 + t * 20, 978, "L", 616 + t * 20, 946);
  hatch(fur, { op: 0.38 });

  // 짧은 앞다리. 먼 쪽을 먼저
  const farLeg: Cmds = [
    "M",
    290,
    824,
    "C",
    290,
    890,
    288,
    936,
    286,
    968,
    "C",
    268,
    974,
    256,
    988,
    260,
    998,
    "L",
    338,
    998,
    "C",
    340,
    984,
    338,
    966,
    334,
    956,
    "C",
    334,
    916,
    336,
    872,
    338,
    834,
  ];
  fill([...farLeg, "Z"], TONE.metal);
  pen(farLeg, { w: 1.6 });
  const nearLeg: Cmds = [
    "M",
    210,
    806,
    "C",
    214,
    874,
    208,
    930,
    202,
    966,
    "C",
    182,
    972,
    166,
    986,
    170,
    998,
    "L",
    258,
    998,
    "C",
    262,
    982,
    260,
    962,
    256,
    952,
    "C",
    258,
    902,
    262,
    858,
    268,
    818,
  ];
  fill([...nearLeg, "Z"], TONE.fur);
  pen(nearLeg);
  pen(
    [
      "M",
      190,
      980,
      "L",
      192,
      998,
      "M",
      212,
      978,
      "L",
      214,
      998,
      "M",
      284,
      982,
      "L",
      286,
      998,
    ],
    {
      w: 1.1,
      light: false,
    },
  );

  // 목걸이와 이름표. 머리와 가슴 사이에 목선을 만든다
  const collar: Cmds = [
    "M",
    244,
    292,
    "C",
    320,
    326,
    420,
    326,
    486,
    290,
    "L",
    478,
    262,
    "C",
    414,
    296,
    322,
    298,
    252,
    266,
    "Z",
  ];
  fill(collar, TONE.collar);
  pen(collar, { closed: true, w: 1.5 });
  pen(["M", 282, 318, "L", 280, 336], { w: 1.1, light: false });
  fill(ell(279, 352, 17, 17), TONE.metal);
  pen(ell(279, 352, 17, 17), { closed: true, w: 1.3 });

  // 머리. 긴 주둥이
  const head: Cmds = [
    "M",
    56,
    150,
    "C",
    128,
    128,
    198,
    96,
    246,
    64,
    "C",
    286,
    22,
    350,
    2,
    396,
    10,
    "C",
    450,
    22,
    476,
    86,
    464,
    148,
    "C",
    454,
    202,
    422,
    238,
    382,
    256,
    "C",
    342,
    278,
    302,
    284,
    264,
    280,
    "C",
    202,
    258,
    126,
    222,
    58,
    204,
    "C",
    36,
    198,
    32,
    160,
    56,
    150,
    "Z",
  ];
  fill(head, TONE.fur);
  pen(head, { closed: true });
  hatch(
    [
      "M",
      336,
      250,
      "L",
      358,
      226,
      "M",
      312,
      262,
      "L",
      336,
      236,
      "M",
      290,
      268,
      "L",
      312,
      244,
    ],
    { op: 0.35 },
  );

  // 입에 문 책. 표지 아래로 책장이 보이게 해 책으로 읽히게 한다
  const bc = rectCorners(158, 228, 196, 56, -0.16) as [number, number][];
  const cover = pts(bc);
  fill([...cover, "Z"], held);
  const pageTop = [lerp(bc[3], bc[0], 0.36), lerp(bc[2], bc[1], 0.36)];
  const pages = pts([
    pageTop[0],
    pageTop[1],
    lerp(bc[2], bc[1], 0.1),
    lerp(bc[3], bc[0], 0.1),
  ]);
  fill([...pages, "Z"]);
  pen([...cover, "Z"], { closed: true, w: 1.5 });
  pen(["M", pageTop[0][0], pageTop[0][1], "L", pageTop[1][0], pageTop[1][1]], {
    w: 1,
    light: false,
  });
  hatch(
    [
      "M",
      lerp(bc[3], bc[0], 0.23)[0] + 8,
      lerp(bc[3], bc[0], 0.23)[1],
      "L",
      lerp(bc[2], bc[1], 0.23)[0] - 8,
      lerp(bc[2], bc[1], 0.23)[1],
    ],
    { op: 0.45 },
  );
  // 책 뒤로 이어지는 아래턱
  pen(["M", 256, 276, "C", 244, 272, 236, 266, 228, 262], {
    w: 1.3,
    light: false,
  });

  // 코와 눈
  fill(ell(52, 168, 19, 16), TONE.dark);
  pen(ell(52, 168, 19, 16), { closed: true, w: 1.4, light: false });
  fill(ell(286, 112, 13, 15), TONE.dark);
  fill(ell(290, 106, 4, 4.5), "#FFFFFF");
  pen(["M", 264, 86, "Q", 284, 76, 304, 86], { w: 1.3, light: false, op: 0.8 });

  // 늘어진 귀
  const ear: Cmds = [
    "M",
    354,
    70,
    "C",
    406,
    60,
    444,
    104,
    450,
    170,
    "C",
    460,
    260,
    464,
    350,
    442,
    404,
    "C",
    426,
    438,
    382,
    440,
    364,
    404,
    "C",
    340,
    350,
    328,
    250,
    330,
    170,
    "C",
    328,
    124,
    332,
    88,
    354,
    70,
    "Z",
  ];
  fill(ear, TONE.ear);
  pen(ear, { closed: true });
  hatch(
    [
      "M",
      366,
      150,
      "C",
      362,
      240,
      372,
      320,
      390,
      380,
      "M",
      398,
      128,
      "C",
      406,
      220,
      412,
      300,
      420,
      370,
    ],
    {
      color: "#FFFFFF",
      op: 0.3,
      w: 1.2,
    },
  );
}

/** 포장지(최근 읽은 책 색)를 반쯤 벗긴 각설탕. 벗긴 쪽에 설탕 결이 보인다 */
function drawSugar(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  const dx = 190;
  const dy = -180;
  const L = 60;
  const R = 800;
  const T = 190;
  const front: Cmds = [
    "M",
    L,
    1000,
    "L",
    L,
    T + 14,
    "Q",
    L,
    T,
    L + 14,
    T,
    "L",
    R - 14,
    T,
    "Q",
    R,
    T,
    R,
    T + 14,
    "L",
    R,
    1000,
    "Z",
  ];
  const top: Cmds = pts([
    [L + 14, T],
    [R, T],
    [R + dx, T + dy],
    [L + 14 + dx, T + dy],
  ]);
  const side: Cmds = pts([
    [R, T],
    [R + dx, T + dy],
    [R + dx, 1000 + dy],
    [R, 1000],
  ]);
  fill([...side, "Z"], held);
  fill([...top, "Z"]);
  fill(front);
  // 찢긴 경계. 앞면은 위에서 아래로, 윗면은 앞에서 뒤로 이어진다
  const tear: [number, number][] = [
    [470, T],
    [446, 300],
    [482, 390],
    [450, 500],
    [490, 610],
    [458, 720],
    [494, 830],
    [470, 1000],
  ];
  const tearTop: [number, number][] = [
    [470, T],
    [470 + dx * 0.35 + 18, T + dy * 0.35],
    [470 + dx * 0.7 - 10, T + dy * 0.7],
    [470 + dx, T + dy],
  ];
  fill([...pts([...tear, [R, 1000], [R, T]]), "Z"], held);
  fill([...pts([...tearTop, [R + dx, T + dy], [R, T]]), "Z"], held);
  pen(pts(tear), { w: 1.5 });
  pen(pts(tearTop), { w: 1.4 });
  // 앞면에서 벗겨져 말린 포장지 조각. 안쪽은 흰 종이
  const curl: Cmds = [
    "M",
    482,
    390,
    "C",
    420,
    400,
    372,
    440,
    368,
    486,
    "C",
    400,
    470,
    430,
    480,
    450,
    500,
    "Z",
  ];
  fill(curl);
  pen(curl, { closed: true, w: 1.3 });
  pen(front, { closed: true });
  pen([
    "M",
    L + 14,
    T,
    "L",
    L + 14 + dx,
    T + dy,
    "L",
    R + dx,
    T + dy,
    "L",
    R,
    T,
  ]);
  pen(["M", R + dx, T + dy, "L", R + dx, 1000 + dy, "L", R, 1000]);
  const shade: Cmds = [];
  for (let y = 180; y < 920; y += 64)
    shade.push("M", R + 16, y + 70, "L", R + dx - 16, y - 90);
  hatch(shade, { op: 0.4 });
  // 설탕 알갱이. 벗긴 앞면과 윗면에 짧은 획을 흩뿌린다
  const grains: Cmds = [];
  for (let gy = T + 40; gy < 980; gy += 58)
    for (let gx = L + 34 + ((gy / 58) % 2) * 28; gx < 420; gx += 64) {
      const j = Math.sin(gx * 12.9 + gy * 78.2) * 10;
      grains.push(
        "M",
        gx + j,
        gy - j * 0.6,
        "L",
        gx + j + 12,
        gy - j * 0.6 - 5,
      );
    }
  for (let t = 0.15; t < 0.95; t += 0.2)
    for (let q = 0.1; q < 0.9; q += 0.17) {
      const x = L + 40 + (400 - L) * q + dx * t;
      const y = T + dy * t;
      if (x < 470 + dx * t - 20) grains.push("M", x, y, "L", x + 12, y - 4);
    }
  hatch(grains, { op: 0.55, w: 1.3 });
}

/** 달걀 받침(최근 읽은 책 색)에 세운 달걀 */
function drawEgg(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  const egg: Cmds = [
    "M",
    300,
    0,
    "C",
    438,
    0,
    552,
    250,
    552,
    470,
    "C",
    552,
    640,
    440,
    740,
    300,
    740,
    "C",
    160,
    740,
    48,
    640,
    48,
    470,
    "C",
    48,
    250,
    162,
    0,
    300,
    0,
    "Z",
  ];
  fill(egg);
  pen(egg, { closed: true });
  hatch(
    [
      "M",
      470,
      330,
      "L",
      500,
      290,
      "M",
      490,
      390,
      "L",
      526,
      348,
      "M",
      500,
      450,
      "L",
      536,
      410,
    ],
    { op: 0.3 },
  );
  hatch(["M", 160, 250, "C", 180, 190, 210, 140, 240, 110], {
    color: "#FFFFFF",
    op: 0.9,
    w: 4,
  });
  const cup: Cmds = [
    "M",
    40,
    452,
    "C",
    50,
    604,
    120,
    700,
    230,
    722,
    "C",
    236,
    780,
    226,
    832,
    196,
    858,
    "C",
    136,
    876,
    104,
    910,
    104,
    956,
    "L",
    104,
    988,
    "C",
    200,
    1004,
    400,
    1004,
    496,
    988,
    "L",
    496,
    956,
    "C",
    496,
    910,
    464,
    876,
    404,
    858,
    "C",
    374,
    832,
    364,
    780,
    370,
    722,
    "C",
    480,
    700,
    550,
    604,
    560,
    452,
    "C",
    470,
    486,
    130,
    486,
    40,
    452,
    "Z",
  ];
  fill(cup, held);
  pen(cup, { closed: true });
  pen(["M", 40, 452, "C", 130, 420, 470, 420, 560, 452], { w: 1.4 });
  pen(["M", 110, 956, "C", 200, 972, 400, 972, 490, 956], {
    w: 1,
    light: false,
    op: 0.5,
  });
  hatch(
    [
      "M",
      470,
      520,
      "L",
      500,
      490,
      "M",
      470,
      580,
      "L",
      510,
      540,
      "M",
      440,
      640,
      "L",
      486,
      596,
      "M",
      350,
      900,
      "L",
      380,
      870,
      "M",
      400,
      920,
      "L",
      436,
      884,
    ],
    { op: 0.4 },
  );
  hatch(["M", 110, 530, "C", 130, 600, 170, 650, 220, 676], {
    color: "#FFFFFF",
    op: 0.5,
    w: 3,
  });
}

/** 앞발로 작은 책(최근 읽은 책 색)을 든 햄스터 */
function drawHamster(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  // 귀
  for (const x of [226, 614]) {
    fill(ell(x, 150, 72, 66), TONE.fur);
    pen(ell(x, 150, 72, 66), { closed: true, w: 1.6 });
    fill(ell(x, 158, 38, 34), TONE.metal);
  }
  const body: Cmds = [
    "M",
    420,
    70,
    "C",
    600,
    70,
    702,
    196,
    700,
    352,
    "C",
    762,
    452,
    802,
    616,
    790,
    760,
    "C",
    780,
    904,
    660,
    984,
    420,
    988,
    "C",
    180,
    984,
    60,
    904,
    50,
    760,
    "C",
    38,
    616,
    78,
    452,
    140,
    352,
    "C",
    138,
    196,
    240,
    70,
    420,
    70,
    "Z",
  ];
  fill(body, TONE.fur);
  const belly: Cmds = [
    "M",
    240,
    560,
    "C",
    240,
    450,
    330,
    410,
    420,
    410,
    "C",
    510,
    410,
    600,
    450,
    600,
    560,
    "C",
    620,
    710,
    590,
    906,
    420,
    936,
    "C",
    250,
    906,
    220,
    710,
    240,
    560,
    "Z",
  ];
  fill(belly);
  // 볼 주머니 쪽 흰 털
  fill([
    "M",
    250,
    330,
    "C",
    300,
    440,
    540,
    440,
    590,
    330,
    "C",
    560,
    420,
    280,
    420,
    250,
    330,
    "Z",
  ]);
  pen(body, { closed: true });
  hatch(
    [
      "M",
      110,
      620,
      "L",
      140,
      590,
      "M",
      100,
      700,
      "L",
      134,
      666,
      "M",
      710,
      600,
      "L",
      740,
      630,
      "M",
      720,
      690,
      "L",
      752,
      720,
      "M",
      320,
      110,
      "L",
      340,
      140,
      "M",
      500,
      106,
      "L",
      480,
      136,
    ],
    { op: 0.4 },
  );
  // 발
  for (const x of [300, 540]) {
    fill(ell(x, 980, 66, 22), TONE.metal);
    pen(ell(x, 980, 66, 22), { closed: true, w: 1.4 });
  }
  // 얼굴
  fill(ell(330, 290, 27, 30), TONE.dark);
  fill(ell(510, 290, 27, 30), TONE.dark);
  fill(ell(338, 280, 8, 9), "#FFFFFF");
  fill(ell(518, 280, 8, 9), "#FFFFFF");
  fill(["M", 402, 348, "L", 438, 348, "L", 420, 370, "Z"], TONE.ear);
  pen(
    [
      "M",
      420,
      370,
      "L",
      420,
      386,
      "M",
      420,
      386,
      "Q",
      400,
      404,
      386,
      390,
      "M",
      420,
      386,
      "Q",
      440,
      404,
      454,
      390,
    ],
    { w: 1.3, light: false },
  );
  pen(
    [
      "M",
      300,
      360,
      "L",
      180,
      340,
      "M",
      300,
      378,
      "L",
      184,
      390,
      "M",
      540,
      360,
      "L",
      660,
      340,
      "M",
      540,
      378,
      "L",
      656,
      390,
    ],
    { w: 0.9, light: false, op: 0.5 },
  );
  // 책과 앞발
  const bc = rectCorners(420, 610, 210, 250, 0.06) as [number, number][];
  fill([...pts(bc), "Z"], held);
  pen([...pts(bc), "Z"], { closed: true, w: 1.5 });
  pen(
    [
      "M",
      lerp(bc[0], bc[1], 0.1)[0],
      lerp(bc[0], bc[1], 0.1)[1],
      "L",
      lerp(bc[3], bc[2], 0.1)[0],
      lerp(bc[3], bc[2], 0.1)[1],
    ],
    { w: 1, light: false, op: 0.55 },
  );
  const tl = lerp(lerp(bc[0], bc[1], 0.3), lerp(bc[3], bc[2], 0.3), 0.3);
  const br = lerp(lerp(bc[0], bc[1], 0.85), lerp(bc[3], bc[2], 0.85), 0.62);
  fill([
    "M",
    tl[0],
    tl[1],
    "L",
    br[0],
    tl[1] + 6,
    "L",
    br[0],
    br[1],
    "L",
    tl[0],
    br[1] - 6,
    "Z",
  ]);
  pen(
    [
      "M",
      tl[0] + 16,
      tl[1] + 40,
      "L",
      br[0] - 20,
      tl[1] + 44,
      "M",
      tl[0] + 16,
      tl[1] + 80,
      "L",
      br[0] - 40,
      tl[1] + 84,
    ],
    { w: 1, light: false, op: 0.6 },
  );
  for (const x of [312, 528]) {
    fill(ell(x, 600, 38, 30), TONE.fur);
    pen(ell(x, 600, 38, 30), { closed: true, w: 1.4 });
  }
}

/** 소주병. 상표 띠가 최근 읽은 책 색 */
function drawSoju(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  const bottle: Cmds = [
    "M",
    112,
    96,
    "L",
    112,
    300,
    "C",
    112,
    360,
    16,
    380,
    16,
    470,
    "L",
    16,
    966,
    "Q",
    16,
    1000,
    50,
    1000,
    "L",
    270,
    1000,
    "Q",
    304,
    1000,
    304,
    966,
    "L",
    304,
    470,
    "C",
    304,
    380,
    208,
    360,
    208,
    300,
    "L",
    208,
    96,
    "Z",
  ];
  fill(bottle, TONE.glass);
  // 뚜껑
  const cap: Cmds = pts([
    [100, 0],
    [220, 0],
    [222, 100],
    [98, 100],
  ]);
  fill([...cap, "Z"], TONE.metal);
  pen([...cap, "Z"], { closed: true, w: 1.5 });
  const ridges: Cmds = [];
  for (let x = 116; x < 212; x += 16) ridges.push("M", x, 12, "L", x, 88);
  hatch(ridges, { op: 0.45 });
  // 상표
  const label: Cmds = pts([
    [16, 560],
    [304, 560],
    [304, 850],
    [16, 850],
  ]);
  fill([...label, "Z"], held);
  fill(ell(160, 700, 88, 70));
  pen(ell(160, 700, 88, 70), { closed: true, w: 1.2 });
  pen(
    [
      "M",
      108,
      690,
      "C",
      140,
      680,
      180,
      696,
      212,
      684,
      "M",
      118,
      724,
      "C",
      150,
      718,
      176,
      728,
      200,
      720,
    ],
    { w: 1.1, light: false, op: 0.7 },
  );
  pen(["M", 16, 560, "L", 304, 560, "M", 16, 850, "L", 304, 850], { w: 1.3 });
  pen(bottle, { closed: true });
  // 목 띠와 유리 반사
  pen(["M", 112, 250, "L", 208, 250, "M", 112, 272, "L", 208, 272], {
    w: 1,
    light: false,
    op: 0.5,
  });
  hatch(
    [
      "M",
      60,
      480,
      "L",
      60,
      540,
      "M",
      60,
      870,
      "L",
      60,
      960,
      "M",
      140,
      120,
      "L",
      140,
      230,
    ],
    { color: "#FFFFFF", op: 0.9, w: 5 },
  );
  const shade: Cmds = [];
  for (let y = 480; y < 980; y += 34)
    if (y < 548 || y > 862) shade.push("M", 262, y + 20, "L", 296, y - 8);
  hatch(shade, { op: 0.4 });
}

/** 볼링핀. 목의 띠 두 줄이 최근 읽은 책 색 */
function drawBowlingPin(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  const pin: Cmds = [
    "M",
    160,
    0,
    "C",
    230,
    0,
    262,
    60,
    262,
    130,
    "C",
    262,
    200,
    222,
    242,
    216,
    296,
    "C",
    212,
    346,
    242,
    420,
    290,
    520,
    "C",
    330,
    610,
    324,
    780,
    290,
    880,
    "C",
    272,
    940,
    254,
    976,
    240,
    1000,
    "L",
    80,
    1000,
    "C",
    66,
    976,
    48,
    940,
    30,
    880,
    "C",
    -4,
    780,
    -10,
    610,
    30,
    520,
    "C",
    78,
    420,
    108,
    346,
    104,
    296,
    "C",
    98,
    242,
    58,
    200,
    58,
    130,
    "C",
    58,
    60,
    90,
    0,
    160,
    0,
    "Z",
  ];
  fill(pin);
  // 띠 두 줄. 둥근 몸을 따라 아래로 휜다
  const band = (y: number, h: number, half: number): Cmds => [
    "M",
    160 - half,
    y,
    "Q",
    160,
    y + 16,
    160 + half,
    y,
    "L",
    160 + half + 2,
    y + h,
    "Q",
    160,
    y + h + 16,
    160 - half - 2,
    y + h,
    "Z",
  ];
  fill(band(300, 26, 55), held);
  fill(band(342, 26, 58), held);
  pen(band(300, 26, 55), { closed: true, w: 1.1, light: false });
  pen(band(342, 26, 58), { closed: true, w: 1.1, light: false });
  pen(pin, { closed: true });
  const shade: Cmds = [];
  for (let y = 560; y < 900; y += 36)
    shade.push("M", 262, y + 24, "L", 292, y - 6);
  shade.push("M", 222, 80, "L", 246, 56, "M", 230, 130, "L", 256, 104);
  hatch(shade, { op: 0.4 });
  hatch(
    [
      "M",
      70,
      620,
      "C",
      62,
      700,
      70,
      790,
      88,
      860,
      "M",
      90,
      90,
      "C",
      92,
      70,
      100,
      56,
      112,
      44,
    ],
    { color: "#E7E5E4", op: 0.9, w: 4 },
  );
  pen(["M", 84, 990, "C", 130, 998, 190, 998, 236, 990], {
    w: 1,
    light: false,
    op: 0.4,
  });
}

/** 소화기. 몸통이 최근 읽은 책 색 */
function drawExtinguisher(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  // 호스. 몸통 뒤로 내려가 노즐이 옆에 걸린다
  const hose: Cmds = [
    "M",
    236,
    176,
    "C",
    330,
    170,
    384,
    230,
    384,
    380,
    "L",
    384,
    640,
  ];
  pen(hose, { w: 5.4, light: false, op: 0.9 });
  pen(["M", 236, 176, "C", 330, 170, 384, 230, 384, 380, "L", 384, 640], {
    w: 2.4,
    light: false,
    op: 1,
  });
  const nozzle: Cmds = pts([
    [368, 640],
    [400, 640],
    [406, 740],
    [362, 740],
  ]);
  fill([...nozzle, "Z"], TONE.dark);
  pen([...nozzle, "Z"], { closed: true, w: 1.3 });
  // 몸통
  const body: Cmds = [
    "M",
    60,
    330,
    "C",
    60,
    260,
    130,
    222,
    195,
    222,
    "C",
    260,
    222,
    330,
    260,
    330,
    330,
    "L",
    330,
    972,
    "Q",
    330,
    1000,
    302,
    1000,
    "L",
    88,
    1000,
    "Q",
    60,
    1000,
    60,
    972,
    "Z",
  ];
  fill(body, held);
  const label: Cmds = pts([
    [92, 470],
    [298, 470],
    [298, 740],
    [92, 740],
  ]);
  fill([...label, "Z"]);
  pen([...label, "Z"], { closed: true, w: 1.2 });
  pen(
    [
      "M",
      116,
      520,
      "L",
      272,
      520,
      "M",
      116,
      560,
      "L",
      250,
      560,
      "M",
      116,
      600,
      "L",
      262,
      600,
    ],
    { w: 1, light: false, op: 0.55 },
  );
  // 불꽃 그림
  pen(
    [
      "M",
      150,
      700,
      "C",
      140,
      670,
      168,
      650,
      160,
      624,
      "C",
      184,
      640,
      196,
      670,
      180,
      700,
      "Z",
    ],
    { w: 1.1, light: false },
  );
  pen(["M", 200, 700, "L", 270, 700, "M", 206, 684, "L", 262, 684], {
    w: 1,
    light: false,
    op: 0.5,
  });
  pen(body, { closed: true });
  pen(["M", 60, 944, "L", 330, 944], { w: 1.2, op: 0.6 });
  const shade: Cmds = [];
  for (let y = 360; y < 930; y += 36)
    if (y < 452 || y > 752) shade.push("M", 286, y + 26, "L", 322, y - 8);
  hatch(shade, { op: 0.4 });
  hatch(["M", 92, 350, "L", 92, 440, "M", 92, 780, "L", 92, 920], {
    color: "#FFFFFF",
    op: 0.5,
    w: 4,
  });
  // 밸브와 손잡이
  const neck: Cmds = pts([
    [160, 150],
    [232, 150],
    [236, 226],
    [156, 226],
  ]);
  fill([...neck, "Z"], TONE.metal);
  pen([...neck, "Z"], { closed: true, w: 1.5 });
  const lever: Cmds = [
    "M",
    150,
    132,
    "L",
    350,
    64,
    "Q",
    362,
    62,
    360,
    76,
    "L",
    236,
    142,
    "L",
    150,
    152,
    "Z",
  ];
  fill(lever, TONE.metal);
  pen(lever, { closed: true, w: 1.5 });
  const grip: Cmds = [
    "M",
    190,
    172,
    "L",
    348,
    150,
    "Q",
    360,
    150,
    358,
    164,
    "L",
    236,
    196,
  ];
  fill([...grip, "Z"], TONE.metal);
  pen(grip, { w: 1.5 });
  // 압력계와 안전핀
  fill(ell(110, 150, 40, 40));
  pen(ell(110, 150, 40, 40), { closed: true, w: 1.5 });
  pen(
    [
      "M",
      110,
      150,
      "L",
      128,
      128,
      "M",
      84,
      150,
      "L",
      92,
      150,
      "M",
      136,
      150,
      "L",
      128,
      150,
    ],
    { w: 1.1, light: false },
  );
  pen(["M", 150, 150, "L", 160, 150], { w: 2 });
  pen(ell(252, 118, 20, 20), { closed: true, w: 1.3 });
}

/** 책을 옆구리에 낀 아델리펭귄. 앞을 보고, 흰 눈테가 특징 */
function drawAdelie(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  // 발
  for (const x of [176, 304]) {
    const foot: Cmds = [
      "M",
      x - 64,
      986,
      "C",
      x - 60,
      950,
      x + 60,
      950,
      x + 64,
      986,
      "Q",
      x + 30,
      1000,
      x,
      992,
      "Q",
      x - 30,
      1000,
      x - 64,
      986,
      "Z",
    ];
    fill(foot, TONE.metal);
    pen(foot, { closed: true, w: 1.4 });
  }
  const body: Cmds = [
    "M",
    240,
    20,
    "C",
    330,
    20,
    372,
    90,
    370,
    170,
    "C",
    368,
    232,
    352,
    262,
    362,
    300,
    "C",
    432,
    400,
    472,
    520,
    470,
    650,
    "C",
    468,
    820,
    382,
    936,
    240,
    944,
    "C",
    98,
    936,
    12,
    820,
    10,
    650,
    "C",
    8,
    520,
    48,
    400,
    118,
    300,
    "C",
    128,
    262,
    112,
    232,
    110,
    170,
    "C",
    108,
    90,
    150,
    20,
    240,
    20,
    "Z",
  ];
  fill(body, TONE.tip);
  const belly: Cmds = [
    "M",
    150,
    324,
    "C",
    190,
    286,
    290,
    286,
    330,
    324,
    "C",
    400,
    426,
    430,
    556,
    428,
    668,
    "C",
    426,
    820,
    350,
    912,
    240,
    918,
    "C",
    130,
    912,
    54,
    820,
    52,
    668,
    "C",
    50,
    556,
    80,
    426,
    150,
    324,
    "Z",
  ];
  fill(belly);
  pen(body, { closed: true });
  pen(["M", 150, 324, "C", 190, 286, 290, 286, 330, 324], {
    w: 1.2,
    light: false,
    op: 0.6,
  });
  hatch(
    [
      "M",
      380,
      640,
      "L",
      410,
      610,
      "M",
      384,
      700,
      "L",
      414,
      670,
      "M",
      380,
      760,
      "L",
      408,
      732,
      "M",
      360,
      820,
      "L",
      392,
      790,
    ],
    { op: 0.3 },
  );
  // 눈테와 부리
  for (const x of [192, 288]) {
    fill(ell(x, 150, 28, 28));
    fill(ell(x + 2, 152, 11, 12), TONE.dark);
    fill(ell(x + 5, 148, 3.5, 3.5), "#FFFFFF");
  }
  const beak: Cmds = [
    "M",
    216,
    186,
    "C",
    230,
    178,
    250,
    178,
    264,
    186,
    "L",
    244,
    234,
    "Q",
    240,
    240,
    236,
    234,
    "Z",
  ];
  fill(beak, TONE.ear);
  pen(beak, { closed: true, w: 1.3 });
  // 오른쪽 날개
  const wingR: Cmds = [
    "M",
    420,
    360,
    "C",
    470,
    420,
    500,
    520,
    496,
    640,
    "C",
    494,
    666,
    474,
    668,
    468,
    644,
    "C",
    452,
    560,
    432,
    480,
    404,
    420,
    "Z",
  ];
  fill(wingR, TONE.tip);
  pen(wingR, { closed: true, w: 1.6 });
  // 옆구리에 낀 책과 왼쪽 날개
  const bc = rectCorners(90, 560, 150, 200, -0.18) as [number, number][];
  fill([...pts(bc), "Z"], held);
  pen([...pts(bc), "Z"], { closed: true, w: 1.5 });
  const pages = [lerp(bc[1], bc[2], 0.0), lerp(bc[1], bc[2], 1)];
  pen(
    [
      "M",
      pages[0][0] - 8,
      pages[0][1] + 4,
      "L",
      pages[1][0] - 8,
      pages[1][1] - 4,
    ],
    { w: 1, light: false, op: 0.55 },
  );
  const wingL: Cmds = [
    "M",
    70,
    350,
    "C",
    30,
    420,
    12,
    540,
    30,
    660,
    "C",
    34,
    690,
    58,
    690,
    64,
    664,
    "C",
    76,
    580,
    96,
    480,
    116,
    420,
    "Z",
  ];
  fill(wingL, TONE.tip);
  pen(wingL, { closed: true, w: 1.6 });
}

/** 옆을 보고 선 황제펭귄. 귀 옆 무늬가 최근 읽은 책 색 */
function drawEmperor(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  const feet: Cmds = [
    "M",
    130,
    990,
    "C",
    132,
    962,
    160,
    952,
    200,
    954,
    "C",
    250,
    954,
    290,
    962,
    300,
    990,
    "Q",
    250,
    1002,
    216,
    994,
    "Q",
    170,
    1002,
    130,
    990,
    "Z",
  ];
  fill(feet, TONE.metal);
  pen(feet, { closed: true, w: 1.4 });
  const body: Cmds = [
    "M",
    250,
    20,
    "C",
    320,
    20,
    356,
    70,
    350,
    150,
    "C",
    346,
    210,
    380,
    290,
    400,
    400,
    "C",
    430,
    560,
    440,
    760,
    400,
    900,
    "C",
    390,
    940,
    370,
    962,
    330,
    970,
    "L",
    140,
    970,
    "C",
    90,
    960,
    70,
    920,
    72,
    860,
    "C",
    74,
    740,
    90,
    600,
    110,
    470,
    "C",
    124,
    380,
    150,
    300,
    180,
    230,
    "C",
    170,
    190,
    170,
    150,
    178,
    120,
    "C",
    196,
    60,
    220,
    20,
    250,
    20,
    "Z",
  ];
  fill(body, TONE.tip);
  const belly: Cmds = [
    "M",
    180,
    236,
    "C",
    232,
    250,
    254,
    300,
    264,
    400,
    "C",
    284,
    560,
    304,
    760,
    304,
    950,
    "L",
    150,
    952,
    "C",
    110,
    942,
    96,
    900,
    96,
    850,
    "C",
    98,
    730,
    112,
    600,
    130,
    480,
    "C",
    142,
    390,
    160,
    300,
    180,
    236,
    "Z",
  ];
  fill(belly);
  pen(body, { closed: true });
  hatch(
    [
      "M",
      170,
      320,
      "L",
      196,
      300,
      "M",
      160,
      370,
      "L",
      200,
      340,
      "M",
      156,
      420,
      "L",
      210,
      380,
      "M",
      150,
      470,
      "L",
      214,
      424,
    ],
    { op: 0.22 },
  );
  hatch(
    [
      "M",
      250,
      700,
      "L",
      280,
      674,
      "M",
      256,
      760,
      "L",
      288,
      732,
      "M",
      262,
      820,
      "L",
      292,
      792,
      "M",
      264,
      880,
      "L",
      296,
      850,
    ],
    { op: 0.3 },
  );
  // 귀 옆 무늬
  const patch: Cmds = [
    "M",
    268,
    140,
    "C",
    306,
    164,
    318,
    230,
    290,
    300,
    "C",
    270,
    344,
    226,
    348,
    200,
    324,
    "C",
    236,
    292,
    258,
    224,
    268,
    140,
    "Z",
  ];
  fill(patch, held);
  pen(patch, { closed: true, w: 1.3 });
  // 부리. 길고 아래로 휜다
  const beak: Cmds = [
    "M",
    192,
    108,
    "C",
    150,
    116,
    92,
    138,
    36,
    176,
    "C",
    92,
    168,
    150,
    160,
    196,
    150,
    "Z",
  ];
  fill(beak, TONE.tip);
  pen(beak, { closed: true, w: 1.4 });
  hatch(["M", 186, 142, "C", 150, 150, 110, 160, 70, 170], {
    color: "#E7E5E4",
    w: 1.8,
    op: 0.8,
  });
  fill(ell(232, 98, 9, 9), "#FFFFFF");
  fill(ell(233, 99, 5, 5), TONE.dark);
  // 날개
  const wing: Cmds = [
    "M",
    330,
    330,
    "C",
    382,
    420,
    402,
    560,
    382,
    700,
    "C",
    376,
    740,
    352,
    724,
    352,
    692,
    "C",
    354,
    560,
    342,
    450,
    318,
    360,
    "Z",
  ];
  fill(wing, TONE.collar);
  pen(wing, { closed: true, w: 1.6 });
}

/** 농구 골대. 앞에서 본 모습이고 높이는 림(최근 읽은 책 색)까지 잰다 */
function drawHoop(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  // 받침과 기둥
  const base: Cmds = [
    "M",
    108,
    1000,
    "L",
    116,
    930,
    "Q",
    118,
    916,
    132,
    916,
    "L",
    324,
    916,
    "Q",
    338,
    916,
    340,
    930,
    "L",
    348,
    1000,
    "Z",
  ];
  fill(base, TONE.collar);
  pen(base, { closed: true });
  const pole: Cmds = pts([
    [214, 262],
    [242, 262],
    [244, 918],
    [212, 918],
  ]);
  fill([...pole, "Z"], TONE.metal);
  pen([...pole, "Z"], { closed: true, w: 1.5 });
  hatch(["M", 234, 320, "L", 234, 900], { op: 0.35, w: 2 });
  // 백보드
  const board: Cmds = pts([
    [0, 0],
    [456, 0],
    [456, 268],
    [0, 268],
  ]);
  fill([...board, "Z"]);
  pen([...board, "Z"], { closed: true, w: 2.2 });
  pen(
    pts([
      [14, 14],
      [442, 14],
      [442, 254],
      [14, 254],
      [14, 14],
    ]),
    { w: 1, light: false, op: 0.5 },
  );
  pen(
    pts([
      [156, 110],
      [300, 110],
      [300, 226],
      [156, 226],
      [156, 110],
    ]),
    { w: 1.8 },
  );
  // 그물
  const net: Cmds = [];
  for (let i = 0; i <= 6; i++) {
    const x = 170 + i * 19.3;
    const xb = 190 + i * 12.7;
    net.push("M", x, 236, "L", xb + (i % 2 ? 8 : -8), 330);
  }
  net.push(
    "M",
    176,
    270,
    "L",
    280,
    270,
    "M",
    184,
    302,
    "L",
    272,
    302,
    "M",
    192,
    330,
    "L",
    266,
    330,
  );
  pen(net, { w: 1, light: false, op: 0.75 });
  // 림
  fill(ell(228, 236, 60, 11), held);
  pen(ell(228, 236, 60, 11), { closed: true, w: 2.2 });
  hatch(["M", 60, 40, "L", 30, 80, "M", 110, 40, "L", 50, 120], {
    color: "#FFFFFF",
    op: 0.9,
    w: 3,
  });
}

/** 머리에 책을 얹은 기린. 높은 어깨에서 낮은 엉덩이로 이어지는 옆모습 */
function drawGiraffe(p: Pencil, held: string) {
  const { pen, fill, hatch } = p;
  const patch = (points: [number, number][], tone = TONE.spot) =>
    fill([...pts(points), "Z"], tone);

  // 먼 다리는 몸 뒤에 두고, 무릎과 비절의 꺾임을 서로 다르게 잡는다.
  const farFront: Cmds = [
    "M",
    309,
    605,
    "C",
    321,
    639,
    337,
    701,
    339,
    758,
    "Q",
    346,
    775,
    340,
    800,
    "L",
    329,
    973,
    "L",
    312,
    978,
    "L",
    318,
    799,
    "Q",
    312,
    779,
    317,
    758,
    "L",
    284,
    641,
    "Z",
  ];
  const farHind: Cmds = [
    "M",
    530,
    598,
    "C",
    551,
    641,
    546,
    692,
    526,
    731,
    "L",
    561,
    804,
    "Q",
    567,
    815,
    560,
    832,
    "L",
    548,
    977,
    "L",
    531,
    978,
    "L",
    537,
    828,
    "L",
    496,
    757,
    "Q",
    485,
    729,
    495,
    691,
    "L",
    501,
    624,
    "Z",
  ];
  for (const limb of [farFront, farHind]) {
    fill(limb, TONE.spot);
    pen(limb, { closed: true, w: 1.3 });
  }
  // 꼬리 끝은 물방울 대신 흩어진 털 다발.
  pen(["M", 555, 537, "C", 587, 578, 569, 657, 596, 701], { w: 1.6 });
  fill(
    [
      "M",
      594,
      692,
      "C",
      606,
      709,
      615,
      722,
      608,
      746,
      "L",
      601,
      736,
      "L",
      598,
      748,
      "Q",
      584,
      725,
      590,
      708,
      "Z",
    ],
    TONE.tip,
  );
  hatch(["M", 596, 705, "Q", 600, 720, 603, 734], { w: 0.8, color: TONE.fur });

  // 목 밑이 가슴으로 이어지고, 등은 어깨부터 엉덩이까지 기울어진다.
  const body: Cmds = [
    "M",
    144,
    128,
    "C",
    173,
    233,
    205,
    377,
    228,
    479,
    "C",
    213,
    519,
    221,
    574,
    248,
    623,
    "C",
    275,
    655,
    317,
    662,
    356,
    669,
    "C",
    411,
    683,
    475,
    677,
    522,
    653,
    "C",
    552,
    638,
    571,
    592,
    562,
    553,
    "C",
    555,
    528,
    536,
    514,
    511,
    509,
    "C",
    456,
    500,
    410,
    484,
    363,
    476,
    "C",
    343,
    471,
    330,
    453,
    318,
    424,
    "C",
    273,
    318,
    241,
    202,
    219,
    106,
    "Z",
  ];
  fill(body, TONE.fur);
  fill(
    [
      "M",
      156,
      151,
      "C",
      190,
      262,
      223,
      418,
      245,
      477,
      "C",
      234,
      544,
      260,
      610,
      309,
      640,
      "C",
      385,
      670,
      468,
      673,
      525,
      643,
      "C",
      503,
      680,
      421,
      691,
      356,
      669,
      "C",
      285,
      656,
      247,
      650,
      229,
      587,
      "Q",
      217,
      532,
      228,
      479,
      "C",
      205,
      377,
      173,
      233,
      144,
      128,
      "Z",
    ],
    "#D2CCC5",
  );

  // 불규칙한 다각형을 엇갈려 놓고 목 양쪽에도 밝은 그물 간격을 남긴다.
  const patches: [number, number][][] = [
    [
      [161, 166],
      [170, 155],
      [191, 164],
      [200, 191],
      [182, 208],
      [168, 195],
    ],
    [
      [198, 209],
      [208, 201],
      [232, 240],
      [221, 258],
      [205, 249],
    ],
    [
      [184, 222],
      [198, 221],
      [209, 262],
      [200, 284],
      [190, 269],
    ],
    [
      [211, 279],
      [231, 269],
      [249, 303],
      [239, 329],
      [222, 318],
    ],
    [
      [203, 304],
      [218, 333],
      [222, 362],
      [214, 369],
      [205, 337],
    ],
    [
      [244, 345],
      [258, 321],
      [277, 360],
      [268, 393],
      [245, 384],
      [231, 361],
    ],
    [
      [228, 389],
      [240, 403],
      [247, 439],
      [232, 455],
      [221, 422],
    ],
    [
      [259, 407],
      [278, 403],
      [303, 445],
      [294, 473],
      [266, 462],
      [251, 436],
    ],
    [
      [250, 483],
      [272, 479],
      [290, 508],
      [277, 538],
      [249, 523],
      [242, 502],
    ],
    [
      [293, 486],
      [327, 480],
      [349, 503],
      [335, 532],
      [304, 535],
      [289, 512],
    ],
    [
      [360, 494],
      [393, 496],
      [413, 522],
      [395, 550],
      [362, 543],
      [349, 520],
    ],
    [
      [421, 509],
      [453, 516],
      [470, 544],
      [450, 568],
      [420, 554],
      [411, 536],
    ],
    [
      [480, 525],
      [514, 529],
      [536, 552],
      [525, 582],
      [493, 574],
      [473, 550],
    ],
    [
      [285, 552],
      [314, 548],
      [339, 572],
      [324, 602],
      [295, 601],
      [278, 578],
    ],
    [
      [347, 554],
      [379, 567],
      [385, 598],
      [358, 618],
      [335, 596],
      [337, 573],
    ],
    [
      [399, 570],
      [428, 579],
      [445, 607],
      [420, 632],
      [392, 621],
      [387, 596],
    ],
    [
      [460, 585],
      [485, 589],
      [502, 615],
      [482, 645],
      [454, 639],
      [449, 613],
    ],
    [
      [530, 593],
      [548, 584],
      [545, 616],
      [520, 639],
      [510, 618],
    ],
    [
      [333, 627],
      [358, 637],
      [384, 633],
      [401, 656],
      [361, 655],
    ],
  ];
  patches.forEach((points) => patch(points));
  pen(body, { closed: true, w: 1.8 });
  // 어깨와 배의 입체감은 짧은 선으로만 남긴다.
  pen(
    [
      "M",
      305,
      482,
      "C",
      294,
      522,
      305,
      560,
      324,
      578,
      "M",
      353,
      655,
      "Q",
      402,
      667,
      437,
      657,
    ],
    { w: 1, op: 0.55, light: false },
  );
  hatch(
    [
      "M",
      251,
      549,
      "L",
      267,
      569,
      "M",
      256,
      574,
      "L",
      272,
      592,
      "M",
      376,
      663,
      "L",
      388,
      648,
      "M",
      406,
      664,
      "L",
      417,
      651,
      "M",
      435,
      663,
      "L",
      446,
      650,
    ],
    { op: 0.28 },
  );

  // 목 뒤를 따라 눕는 짧은 갈기. 등까지 같은 간격의 빗살로 잇지 않는다.
  const mane: Cmds = [
    "M",
    216,
    119,
    "C",
    244,
    228,
    278,
    338,
    321,
    435,
    "L",
    337,
    462,
    "L",
    318,
    448,
    "C",
    270,
    344,
    235,
    231,
    211,
    124,
    "Z",
  ];
  fill(mane, TONE.tip);
  hatch(
    [
      "M",
      219,
      139,
      "L",
      229,
      153,
      "M",
      232,
      187,
      "L",
      244,
      203,
      "M",
      247,
      236,
      "L",
      259,
      252,
      "M",
      262,
      284,
      "L",
      276,
      301,
      "M",
      280,
      334,
      "L",
      294,
      349,
      "M",
      302,
      391,
      "L",
      316,
      407,
    ],
    { color: TONE.fur, op: 0.65, w: 0.8 },
  );

  const front: Cmds = [
    "M",
    253,
    571,
    "C",
    278,
    575,
    292,
    610,
    287,
    651,
    "L",
    279,
    761,
    "Q",
    288,
    779,
    279,
    798,
    "L",
    270,
    978,
    "L",
    250,
    978,
    "L",
    254,
    798,
    "Q",
    246,
    781,
    254,
    762,
    "L",
    247,
    654,
    "C",
    232,
    625,
    237,
    594,
    253,
    571,
    "Z",
  ];
  const hind: Cmds = [
    "M",
    505,
    575,
    "C",
    534,
    577,
    553,
    610,
    541,
    647,
    "C",
    536,
    670,
    518,
    697,
    502,
    726,
    "L",
    523,
    802,
    "Q",
    530,
    817,
    523,
    832,
    "L",
    509,
    978,
    "L",
    489,
    978,
    "L",
    499,
    832,
    "L",
    477,
    747,
    "Q",
    472,
    730,
    480,
    707,
    "L",
    488,
    642,
    "Q",
    480,
    601,
    505,
    575,
    "Z",
  ];
  for (const limb of [front, hind]) {
    fill(limb, TONE.fur);
    pen(limb, { closed: true, w: 1.5 });
  }
  patch([
    [256, 604],
    [274, 606],
    [281, 634],
    [271, 655],
    [253, 643],
  ]);
  patch([
    [257, 674],
    [278, 667],
    [276, 696],
    [260, 707],
  ]);
  patch([
    [258, 720],
    [276, 712],
    [273, 745],
    [259, 750],
  ]);
  patch([
    [505, 608],
    [527, 605],
    [537, 628],
    [523, 653],
    [499, 643],
  ]);
  patch([
    [496, 665],
    [520, 664],
    [505, 695],
    [491, 707],
  ]);
  hatch(
    [
      "M",
      256,
      778,
      "Q",
      267,
      784,
      278,
      778,
      "M",
      502,
      811,
      "L",
      520,
      817,
      "M",
      260,
      824,
      "L",
      258,
      925,
      "M",
      507,
      847,
      "L",
      499,
      941,
    ],
    { w: 0.8, op: 0.42 },
  );
  // 납작한 굽과 갈라진 발굽 끝으로 가는 다리의 무게를 받친다.
  for (const [x, y] of [
    [312, 975],
    [532, 975],
    [249, 977],
    [488, 977],
  ]) {
    const hoof: Cmds = [
      "M",
      x + 2,
      y - 5,
      "L",
      x + 19,
      y - 5,
      "Q",
      x + 22,
      y + 6,
      x + 25,
      y + 17,
      "Q",
      x + 11,
      y + 21,
      x - 8,
      y + 18,
      "L",
      x - 6,
      y + 9,
      "Z",
    ];
    fill(hoof, TONE.tip);
    pen(hoof, { closed: true, w: 1, light: false });
    hatch(["M", x + 6, y + 7, "L", x + 5, y + 17], {
      color: TONE.fur,
      w: 0.8,
      op: 0.65,
    });
  }

  // 귀와 뿔 뒤에 얼굴을 겹쳐 목으로 자연스럽게 이어지게 한다.
  const farEar: Cmds = [
    "M",
    155,
    74,
    "C",
    138,
    72,
    115,
    62,
    109,
    47,
    "C",
    131,
    45,
    151,
    53,
    164,
    65,
    "Z",
  ];
  fill(farEar, TONE.fur);
  pen(farEar, { closed: true, w: 1.1 });
  fill(
    ["M", 146, 66, "Q", 129, 60, 121, 53, "Q", 144, 55, 155, 66, "Z"],
    TONE.spot,
  );
  const horn = (x: number, lean: number, top: number) => {
    const stalk: Cmds = [
      "M",
      x - 5,
      65,
      "Q",
      x - 3,
      45,
      x + lean - 4,
      top,
      "L",
      x + lean + 4,
      top,
      "Q",
      x + 5,
      43,
      x + 6,
      64,
      "Z",
    ];
    fill(stalk, TONE.fur);
    pen(stalk, { closed: true, w: 1.1 });
    fill(ell(x + lean, top, 7, 5), TONE.tip);
  };
  horn(165, -7, 28);
  horn(195, 1, 25);

  // 머리를 조금 넓고 깊게 잡아 긴 목과 균형을 맞춘다.
  const head: Cmds = [
    "M",
    157,
    59,
    "C",
    179,
    49,
    211,
    51,
    223,
    71,
    "C",
    236,
    94,
    222,
    119,
    203,
    132,
    "Q",
    179,
    151,
    153,
    155,
    "L",
    110,
    162,
    "C",
    91,
    167,
    72,
    156,
    71,
    141,
    "Q",
    69,
    128,
    86,
    122,
    "L",
    120,
    110,
    "C",
    139,
    100,
    138,
    78,
    157,
    59,
    "Z",
  ];
  fill(head, TONE.fur);
  fill(
    [
      "M",
      86,
      124,
      "Q",
      103,
      125,
      113,
      138,
      "Q",
      119,
      149,
      111,
      160,
      "C",
      91,
      166,
      72,
      156,
      71,
      141,
      "Q",
      71,
      130,
      86,
      124,
      "Z",
    ],
    "#DAD6D0",
  );
  pen(head, { closed: true, w: 1.6 });

  const ear: Cmds = [
    "M",
    213,
    77,
    "C",
    222,
    61,
    241,
    49,
    262,
    47,
    "C",
    264,
    61,
    247,
    82,
    223,
    87,
    "Q",
    212,
    87,
    213,
    77,
    "Z",
  ];
  fill(ear, TONE.fur);
  pen(ear, { closed: true, w: 1.2 });
  fill(
    ["M", 225, 77, "Q", 238, 60, 253, 56, "Q", 246, 73, 226, 81, "Z"],
    TONE.spot,
  );

  // 작은 무대에서도 표정이 과해지지 않게 점눈 하나만 둔다.
  fill(ell(177, 100, 4.8, 4.8), TONE.dark);
  fill(ell(86, 136, 3.2, 2.4), TONE.dark);
  pen(["M", 78, 148, "Q", 93, 154, 108, 149], {
    w: 0.9,
    light: false,
    op: 0.65,
  });

  // 책은 뿔 위에 얹고 흰 책장과 책등으로 두께를 드러낸다.
  const book: Cmds = [
    "M",
    138,
    3,
    "L",
    222,
    0,
    "L",
    231,
    8,
    "L",
    230,
    23,
    "L",
    145,
    27,
    "L",
    138,
    20,
    "Z",
  ];
  fill(book, held);
  fill(["M", 146, 10, "L", 225, 7, "L", 224, 18, "L", 146, 22, "Z"], p.C.paper);
  pen(book, { closed: true, w: 1.1 });
  pen(
    [
      "M",
      145,
      8,
      "L",
      145,
      23,
      "M",
      146,
      10,
      "L",
      225,
      7,
      "M",
      146,
      22,
      "L",
      224,
      18,
    ],
    { w: 0.8, light: false },
  );
  hatch(["M", 157, 16, "L", 217, 13], { w: 0.7, op: 0.3 });
}

const DRAW: Record<StackObject, (p: Pencil, held: string) => void> = {
  sugar: drawSugar,
  eraser: drawEraser,
  egg: drawEgg,
  hamster: drawHamster,
  pencil: drawPencil,
  soju: drawSoju,
  dachshund: drawDachshund,
  bowlingPin: drawBowlingPin,
  extinguisher: drawExtinguisher,
  adelie: drawAdelie,
  emperor: drawEmperor,
  hoop: drawHoop,
  giraffe: drawGiraffe,
};

export function drawObject(
  p: Pencil,
  o: { object: StackObject; heldColor: string },
) {
  DRAW[o.object](p, o.heldColor);
}
