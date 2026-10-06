import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, readdir } from "node:fs/promises";
import vm from "node:vm";
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const ts = require("typescript");
const publicDir = new URL("../public/", import.meta.url);
const source = await readFile(
  new URL("../src/shared/constants/brand.ts", import.meta.url),
  "utf8",
);
const sandbox = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  sandbox,
);
const assets = sandbox.exports.BRAND_ASSETS;
const paths = [
  ...Object.values(assets).filter((p) => typeof p === "string"),
  ...["ko", "en"].flatMap((locale) =>
    ["home", "market", "reviews", "lounge", "reading-height"].map((page) =>
      assets.shareCard(locale, page),
    ),
  ),
];
for (const path of paths)
  assert.ok((await readFile(new URL(path.slice(1), publicDir))).length, path);
const expectedPngs = {
  "symbol.png": 512,
  "symbol-256.png": 256,
  "symbol-1024.png": 1024,
  "symbol-2048.png": 2048,
  "icon-192.png": 192,
  "icon-512.png": 512,
  "apple-touch-icon.png": 180,
  "icon-maskable-512.png": 512,
  "social-profile.png": 1080,
};
for (const [name, size] of Object.entries(expectedPngs)) {
  const meta = await sharp(
    await readFile(new URL(`brand/pen-v1/${name}`, publicDir)),
  ).metadata();
  assert.equal(meta.width, size, name);
  assert.equal(meta.height, size, name);
  assert.equal(meta.format, "png", name);
}
for (const path of paths.filter(
  (p) => p.endsWith(".png") && (p.includes("/og/") || p === assets.share),
)) {
  const meta = await sharp(
    await readFile(new URL(path.slice(1), publicDir)),
  ).metadata();
  assert.equal(meta.width, 1200, path);
  assert.equal(meta.height, 630, path);
}
const master = await readFile(
  new URL("../../../assets/brand/pen-v1/symbol.svg", import.meta.url),
);
assert.deepEqual(
  await readFile(new URL(assets.symbol.slice(1), publicDir)),
  master,
);
assert.ok(
  !/<image|href=/.test(master.toString()),
  "Symbol must contain vector paths only",
);
for (const [canonical, alias] of [
  [assets.symbol, "logo-square-sketch.svg"],
  [assets.symbolPng, "logo-square-sketch.png"],
  [assets.share, "logo-og-sketch.png"],
  [assets.favicon, "favicon.ico"],
  [assets.icon192, "icon-192.png"],
  [assets.icon512, "icon-512.png"],
])
  assert.deepEqual(
    await readFile(new URL(canonical.slice(1), publicDir)),
    await readFile(new URL(alias, publicDir)),
    alias,
  );
for (const locale of ["ko", "en"]) {
  const canonical = await readFile(
    new URL(`brand/pen-v1/lockup-${locale}.svg`, publicDir),
  );
  for (const path of [
    `logo-full-${locale}.svg`,
    `images/logos/logo-full-${locale}.svg`,
  ])
    assert.deepEqual(await readFile(new URL(path, publicDir)), canonical, path);
  for (const page of ["home", "market", "reviews", "lounge", "reading-height"])
    assert.deepEqual(
      await readFile(new URL(`og/${locale}-${page}.png`, publicDir)),
      await readFile(
        new URL(assets.shareCard(locale, page).slice(1), publicDir),
      ),
    );
}
const ico = await readFile(new URL(assets.favicon.slice(1), publicDir));
assert.equal(ico.readUInt16LE(0), 0);
assert.equal(ico.readUInt16LE(2), 1);
assert.equal(ico.readUInt16LE(4), 3);
for (let i = 0; i < 3; i++) {
  const entry = 6 + i * 16,
    offset = ico.readUInt32LE(entry + 12),
    size = ico.readUInt32LE(entry + 8);
  const meta = await sharp(ico.subarray(offset, offset + size)).metadata();
  assert.equal(meta.width, [16, 32, 48][i]);
  assert.equal(meta.height, [16, 32, 48][i]);
}
const crops = [];
for (const [path, radius] of [
  [assets.maskableIcon, 0.4],
  ["/brand/pen-v1/social-profile.png", 0.5],
]) {
  const { data, info } = await sharp(
    await readFile(new URL(path.slice(1), publicDir)),
  )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let maxDistance = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const p = (y * info.width + x) * 4;
      if (
        data[p + 3] > 128 &&
        Math.min(data[p], data[p + 1], data[p + 2]) < 235
      )
        maxDistance = Math.max(
          maxDistance,
          Math.hypot(x + 0.5 - info.width / 2, y + 0.5 - info.height / 2) /
            info.width,
        );
    }
  assert.ok(maxDistance < radius, `${path} exceeds circle safe area`);
  crops.push({ path, maxDistance, radius });
}
const b = await sharp(
  await readFile(
    new URL(
      "../../../assets/brand/archive/paper-cut/source.png",
      import.meta.url,
    ),
  ),
).metadata();
assert.ok(b.width > 500);
assert.ok(
  !(await readdir(new URL("brand/", publicDir))).some((name) =>
    /paper-cut|brush/.test(name),
  ),
  "Archived designs must not be deployed",
);
console.log(
  JSON.stringify(
    {
      checkedUrls: paths.length,
      icoSizes: [16, 32, 48],
      crops,
      bPreserved: true,
    },
    null,
    2,
  ),
);
