/**
 * 첫 화면 고정 문구(상단 메뉴·홈 머리글)의 글자만 담은 작은 글꼴을 Google Fonts에서 받아 미리 받기용으로 둔다.
 * 문구를 바꾸면 다시 실행: node scripts/fonts/subset.mjs
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const messages = ["ko", "en"].map((l) =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, `src/shared/i18n/messages/${l}.json`),
      "utf8",
    ),
  ),
);
const stripTags = (s) => s.replace(/<[^>]*>/g, "");

const SUBSETS = [
  {
    family: "Gowun Batang",
    slug: "gowun-batang",
    query: "Gowun+Batang:wght@400;700",
    text:
      messages.flatMap((m) => Object.values(m.header.nav)).join("") +
      "0123456789.",
  },
  {
    family: "Gaegu",
    slug: "gaegu",
    query: "Gaegu:wght@400",
    // h1 안 sr-only 「북적 — 」까지 담는다
    text: messages
      .map(
        (m) => `${m.home.heading.title} — ${stripTags(m.home.heading.tagline)}`,
      )
      .join(""),
  },
];

const get = async (url, bin) => {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return bin ? Buffer.from(await res.arrayBuffer()) : res.text();
};

const outDir = path.join(root, "public/fonts/subset");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

let css =
  "/* 생성물: node scripts/fonts/subset.mjs. 첫 화면 고정 문구만 담은 글꼴(google-fonts.css 스택 맨 앞) */\n";
const preload = [];
for (const s of SUBSETS) {
  const text = [...new Set(s.text + " ")].sort().join("");
  const src = await get(
    `https://fonts.googleapis.com/css2?family=${s.query}&text=${encodeURIComponent(text)}&display=swap`,
  );
  for (const face of src.match(/@font-face\s*{[^}]*}/g)) {
    const weight = face.match(/font-weight:\s*(\d+)/)[1];
    const buf = await get(face.match(/url\((https:[^)]+)\)/)[1], true);
    const hash = createHash("sha256").update(buf).digest("hex").slice(0, 8);
    const file = `${s.slug}-${weight}-${hash}.woff2`;
    fs.writeFileSync(path.join(outDir, file), buf);
    preload.push(`/fonts/subset/${file}`);
    css += `\n@font-face {\n  font-family: "${s.family} Subset";\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url(/fonts/subset/${file}) format("woff2");\n}\n`;
    console.log(file, `${(buf.length / 1024).toFixed(1)}KB`);
  }
}

fs.writeFileSync(path.join(root, "src/styles/font-subsets.css"), css);
fs.writeFileSync(
  path.join(root, "src/styles/font-subsets.json"),
  JSON.stringify(preload, null, 2) + "\n",
);
