import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface HtmlCache {
  read(key: string): Promise<string | null>;
  write(key: string, html: string): Promise<void>;
}

/** Only validated successful pages are cached. Expiry also refreshes sales snapshots. */
export function createHtmlCache(dir: string, now = Date.now): HtmlCache {
  const pathOf = (key: string) =>
    resolve(dir, `${createHash("sha256").update(key).digest("hex")}.json`);
  const maxAge = 24 * 60 * 60 * 1000;
  return {
    async read(key) {
      try {
        const data = JSON.parse(await readFile(pathOf(key), "utf8"));
        if (
          data.version !== 1 ||
          typeof data.html !== "string" ||
          !Number.isFinite(data.at) ||
          now() - data.at < 0 ||
          now() - data.at > maxAge
        )
          return null;
        return data.html;
      } catch {
        return null;
      }
    },
    async write(key, html) {
      await mkdir(dir, { recursive: true });
      const path = pathOf(key);
      const temp = `${path}.${randomUUID()}.tmp`;
      try {
        await writeFile(temp, JSON.stringify({ version: 1, at: now(), html }), {
          mode: 0o600,
        });
        await rename(temp, path);
      } finally {
        await unlink(temp).catch(() => {});
      }
    },
  };
}
