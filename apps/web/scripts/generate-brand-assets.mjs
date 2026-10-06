// Run from any directory: node apps/web/scripts/generate-brand-assets.mjs
// All deployed derivatives come from the approved, versioned SVG master.
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, copyFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const publicDir = new URL("../public/", import.meta.url);
const version = new URL("brand/pen-v1/", publicDir);
const archive = new URL(
  "../../../assets/brand/archive/brush/",
  import.meta.url,
);
const source = new URL(
  "../../../assets/brand/pen-v1/symbol.svg",
  import.meta.url,
);
const read = (url) => readFile(url, "utf8");
await mkdir(version, { recursive: true });
await mkdir(archive, { recursive: true });
// Snapshot only once; regeneration must never replace the original archive.
for (const file of [
  "logo-square-sketch.svg",
  "logo-square-sketch.png",
  "logo-og-sketch.png",
  "logo-full-ko.svg",
  "logo-full-en.svg",
  "logo-text-ko.svg",
  "logo-text-en.svg",
  "favicon.ico",
  "icon-192.png",
  "icon-512.png",
]) {
  const saved = new URL(file, archive);
  try {
    await access(saved);
  } catch {
    await copyFile(new URL(file, publicDir), saved);
  }
}
const symbol = await read(source);
const light = symbol
  .replace("#20201c", "#f5f5f0")
  .replace("#5c6848", "#a3b183");
await writeFile(new URL("symbol.svg", version), symbol);
await writeFile(new URL("symbol-light.svg", version), light);
const faviconSvg = symbol
  .replace(
    '<path fill="#20201c"',
    '<style>@media(prefers-color-scheme:dark){.ink{fill:#f5f5f0}.moss{fill:#a3b183}}</style><path class="ink" fill="#20201c"',
  )
  .replace('<path fill="#5c6848"', '<path class="moss" fill="#5c6848"');
await writeFile(new URL("favicon.svg", version), faviconSvg);
const transparent = async (size, name) =>
  sharp(Buffer.from(symbol))
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(name, version)));
const onWhite = async (size, name, ratio = 1) => {
  const edge = Math.round(size * ratio);
  const rendered = await sharp(Buffer.from(symbol))
    .resize(edge, edge)
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: rendered, gravity: "centre" }])
    .png()
    .toFile(fileURLToPath(new URL(name, version)));
};
await transparent(512, "symbol.png");
await transparent(256, "symbol-256.png");
await transparent(1024, "symbol-1024.png");
await transparent(2048, "symbol-2048.png");
await onWhite(192, "icon-192.png");
await onWhite(512, "icon-512.png");
await onWhite(180, "apple-touch-icon.png");
await onWhite(512, "icon-maskable-512.png", 0.8);
await onWhite(1080, "social-profile.png", 0.92);
await sharp(await readFile(new URL("social-profile.png", version)))
  .flatten({ background: "#ffffff" })
  .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
  .toFile(fileURLToPath(new URL("social-profile.jpg", version)));
// PNG-compressed ICO frames supported by current browsers and Windows.
const sizes = [16, 32, 48];
const frames = [];
for (const size of sizes)
  frames.push(
    await sharp(Buffer.from(symbol))
      .resize(size, size)
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer(),
  );
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, i) => {
  const entry = 6 + i * 16;
  header[entry] = sizes[i];
  header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await writeFile(
  new URL("favicon.ico", version),
  Buffer.concat([header, ...frames]),
);
const glyphSource = await read(
  new URL(
    "../src/shared/components/icons/bookjeok-text-logo.tsx",
    import.meta.url,
  ),
);
const names = {
  ko: "ko",
  en: "en",
  "ko-regular": "ko-regular",
  "ko-nanum": "ko-nanum",
  "en-kalam": "en-kalam",
  "en-patrick": "en-patrick",
};
const glyphs = {};
for (const [name, key] of Object.entries(names)) {
  const entry = glyphSource.match(
    new RegExp(
      `\\n  ${key.includes("-") ? '"' + key + '"' : key}: \\{([\\s\\S]*?)\\n  \\},`,
    ),
  );
  if (!entry) throw Error(`Missing wordmark ${key}`);
  const value = (field) =>
    entry[1].match(new RegExp(`${field}: "([^"]+)"`))?.[1];
  const viewBox = value("viewBox"),
    transform = value("transform"),
    d = value("d");
  if (!viewBox || !transform || !d) throw Error(`Incomplete wordmark ${key}`);
  glyphs[name] =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path fill="#242424" transform="${transform}" d="${d}"/></svg>\n`;
}
const symbolNested = symbol.replace(
  /<svg[^>]+>/,
  '<svg x="0" y="0" width="48" height="48" viewBox="0 0 512 512">',
);
for (const locale of ["ko", "en"]) {
  const width = locale === "ko" ? 110 : 160;
  const wordmarkNested = glyphs[locale].replace(
    '<svg xmlns="http://www.w3.org/2000/svg"',
    `<svg x="52" y="${locale === "ko" ? 9 : 6}" width="${width - 52}" height="${locale === "ko" ? 30 : 36}"`,
  );
  const full = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="48" viewBox="0 0 ${width} 48">${symbolNested}${wordmarkNested}</svg>\n`;
  await writeFile(new URL(`logo-full-${locale}.svg`, publicDir), full);
  await writeFile(
    new URL(`images/logos/logo-full-${locale}.svg`, publicDir),
    full,
  );
  await writeFile(
    new URL(`logo-text-${locale}.svg`, publicDir),
    glyphs[locale],
  );
  await writeFile(
    new URL(`images/logos/logo-text-${locale}.svg`, publicDir),
    glyphs[locale],
  );
  await writeFile(new URL(`lockup-${locale}.svg`, version), full);
}
for (const name of ["ko-regular", "ko-nanum", "en-kalam", "en-patrick"])
  await writeFile(
    new URL(`images/logos/logo-text-${name}.svg`, publicDir),
    glyphs[name],
  );
const ogSymbol = await sharp(Buffer.from(symbol))
  .resize(512, 512)
  .png()
  .toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: "#ffffff" },
})
  .composite([{ input: ogSymbol, gravity: "centre" }])
  .png()
  .toFile(fileURLToPath(new URL("share.png", version)));
for (const [from, to] of [
  ["symbol.svg", "logo-square-sketch.svg"],
  ["symbol.png", "logo-square-sketch.png"],
  ["share.png", "logo-og-sketch.png"],
  ["icon-192.png", "icon-192.png"],
  ["icon-512.png", "icon-512.png"],
  ["favicon.ico", "favicon.ico"],
])
  await copyFile(new URL(from, version), new URL(to, publicDir));
console.log(
  "Generated A symbol, lockups, ICO, app icons, social profile and compatibility aliases.",
);
