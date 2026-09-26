// 실행: node scripts/generate-share-titles.cjs /path/to/opentype.js
// opentype.js 1.3.4로 제목을 윤곽선 SVG로 저장한다. PNG 재생성에는 이 도구가 필요 없다.
const fs = require("node:fs");
const path = require("node:path");
const opentype = require(process.argv[2] || "opentype.js");
const font = opentype.loadSync(
  path.join(__dirname, "fonts/nanum-pen-script/NanumPenScript-Regular.ttf"),
);
const titles = {
  home: "책으로 이어지는 일상",
  market: "중고책 마켓",
  reviews: "도서 리뷰",
  lounge: "독서 라운지",
  "reading-height": "독서 키재기",
};
for (const [key, text] of Object.entries(titles)) {
  const outline = font.getPath(text, 0, 0, 86);
  const box = outline.getBoundingBox();
  const width = Math.ceil(box.x2 - box.x1) + 4;
  const height = Math.ceil(box.y2 - box.y1) + 4;
  if (width > 645) throw new Error(`Title too wide: ${key}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${box.x1 - 2} ${box.y1 - 2} ${width} ${height}" fill="#242424"><title>${text}</title>${outline.toSVG(2).replace(" d=", ' fill="#242424" d=')}</svg>`;
  fs.writeFileSync(path.join(__dirname, `share-titles/ko-${key}.svg`), svg);
}
