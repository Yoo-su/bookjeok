// 실행: node scripts/generate-share-images.mjs (한국어 글꼴이 설치된 환경)
// 코드로 그리는 정적 카드. 런타임 이미지 생성/API 호출은 없다.
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const output = new URL("../public/og/", import.meta.url);
await mkdir(output, { recursive: true });

// 헤더에서 사용하는 실제 심벌과 벡터 워드마크를 그대로 사용한다.
const asset = async (name) =>
  `data:image/svg+xml;base64,${(await readFile(new URL(`../public/${name}.svg`, import.meta.url))).toString("base64")}`;
const symbol = await asset("logo-square-sketch");
const wordmarks = {
  ko: await asset("logo-text-ko"),
  en: await asset("logo-text-en"),
};

const pages = [
  {
    key: "home",
    ko: ["책으로 이어지는 일상", "도서 추천 · 독서 기록 · 리뷰 · 중고책 거래"],
    en: ["A life with books", "Discover · Track · Review · Buy & sell"],
  },
  {
    key: "market",
    ko: ["중고책 마켓", "다 읽은 책, 새로운 독자에게."],
    en: ["Used book market", "A new chapter for your books."],
  },
  {
    key: "reviews",
    ko: ["도서 리뷰", "한 권의 책, 서로 다른 생각."],
    en: ["Book reviews", "One book. Different perspectives."],
  },
  {
    key: "lounge",
    ko: ["독서 라운지", "함께 읽는 오늘의 책."],
    en: ["Reading lounge", "Discover what others are reading."],
  },
];
for (const page of pages) {
  for (const locale of ["ko", "en"]) {
    const [title, description] = page[locale].map((text) =>
      text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;"),
    );
    let titleMarkup = `<text x="80" y="331" font-size="62" font-weight="700">${title}</text>`;
    if (locale === "ko") {
      // 나눔손글씨 펜체 윤곽선: OS에 글꼴을 설치하지 않아도 동일하게 렌더한다.
      const titleSvg = await readFile(
        new URL(`./share-titles/ko-${page.key}.svg`, import.meta.url),
      );
      const { width, height } = await sharp(titleSvg).metadata();
      titleMarkup = `<image href="data:image/svg+xml;base64,${titleSvg.toString("base64")}" x="80" y="${337 - height}" width="${width}" height="${height}"/>`;
    }
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#ffffff"/>
      <image href="${wordmarks[locale]}" x="80" y="65" width="${locale === "ko" ? 220 : 320}" height="126" preserveAspectRatio="xMinYMid meet"/>
      <image href="${symbol}" x="765" y="115" width="355" height="355"/>
      <g font-family="Apple SD Gothic Neo, Pretendard, sans-serif" fill="#242424">
        ${titleMarkup}
        <text x="84" y="395" font-size="29" fill="#666666">${description}</text>
        <text x="84" y="575" font-size="23" fill="#777777">bookjeok.com</text>
      </g>
      <path d="M80 526H1120" stroke="#e8e8e8" stroke-width="2"/>
    </svg>`;
    await sharp(Buffer.from(svg))
      .png()
      .toFile(fileURLToPath(new URL(`${locale}-${page.key}.png`, output)));
  }
}
