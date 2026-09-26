// 실행(apps/web): npx tsx scripts/generate-reading-height-art.ts
// 독서 키재기 OG 카드 오른쪽 그림. 화면과 같은 장면 코드로 쌓은 책과 캐릭터를 SVG로 남긴다.
// 카드는 sharp가 시스템 글꼴로 그리므로 손글씨 글자(말풍선·눈금 숫자·주석)는 뺀다.
import { writeFileSync } from "node:fs";

import { SAMPLE_BOOKS } from "../src/features/reading-log/components/stack-view/lib/sample-books";
import { buildStackScene } from "../src/features/reading-log/components/stack-view/lib/scene";
import { stackStatus } from "../src/features/reading-log/components/stack-view/lib/status";
import type { SceneItem } from "../src/features/reading-log/components/stack-view/lib/types";

const W = 400;
const H = 420;
const USER_MM = 1610;
const stackMm = SAMPLE_BOOKS.reduce((a, b) => a + b.depth, 0);
const scene = buildStackScene({
  width: W,
  height: H,
  books: SAMPLE_BOOKS,
  stackMm,
  userMm: USER_MM,
  character: "F",
  status: stackStatus(stackMm, USER_MM),
  labels: {
    myHeight: "",
    remain: "",
    approxBooks: "",
    stackHeight: "",
    bubble: ["", ""],
  },
  colors: {
    paper: "#FFFFFF",
    ink: "#1C1917",
    pen: "#047857",
    muted: "#78716C",
    faint: "#A8A29E",
  },
  measure: () => 0,
  u: 1.2,
  boil: false,
});

const DROP = new Set(["bubble", "annotations"]);
const attr = (name: string, v: string | number | undefined) =>
  v === undefined
    ? ""
    : ` ${name}="${typeof v === "number" ? v.toFixed(2) : v}"`;
const toSvg = (items: SceneItem[]): string =>
  items
    .map((it) => {
      if (it.id && DROP.has(it.id)) return "";
      if (it.k === "g") return `<g>${toSvg(it.children)}</g>`;
      if (it.k === "t") return "";
      return `<path d="${it.d}" fill="${it.fill ?? "none"}"${attr("stroke", it.stroke)}${attr("stroke-width", it.sw)}${attr("stroke-linecap", it.cap)}${attr("stroke-linejoin", it.join)}${attr("stroke-dasharray", it.dash?.map((v) => v.toFixed(1)).join(" "))}${attr("opacity", it.op)}/>`;
    })
    .join("");

writeFileSync(
  new URL("./share-art/reading-height.svg", import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${toSvg(scene.items)}</svg>\n`,
);
