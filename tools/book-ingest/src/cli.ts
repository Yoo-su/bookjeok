import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { DATA_DIR, describeDatabase, loadEnv, requireEnv } from "./config";
import { openJournal } from "./journal";
import { KAKAO_MAX_PAGE } from "./kakao";
import {
  EXCLUDE_REASON_LABEL,
  type ExcludeReason,
  localToday,
} from "./normalize";
import { createIngestDeps, createScanDeps, openDb } from "./runtime";
import { createIngestServer } from "./server";
import { runApply, runScan, summarizeScan } from "./workflow";

const USAGE = `사용법: pnpm --filter @bookjeok/book-ingest ingest <명령> [옵션]

  serve                          로컬 화면(127.0.0.1)을 띄웁니다
      --port <n>                 기본 4700
  scan  --publishers 민음사,창비  DB에 없는 신간을 찾기만 합니다(쓰기 없음)
      --max-pages <n>            출판사당 최대 페이지(1~20, 기본 20)
  apply --publishers 민음사 --yes 찾은 신간 전부를 적재합니다
      --isbn a,b                 이 ISBN만 적재
  publishers [--limit 50]        DB 보유 수 상위 출판사`;

const FAVORITES = resolve(DATA_DIR, "favorites.json");

async function main() {
  loadEnv();
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      publishers: { type: "string" },
      "max-pages": { type: "string" },
      isbn: { type: "string" },
      yes: { type: "boolean", default: false },
      port: { type: "string" },
      limit: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  const command = positionals[0];
  if (!command || values.help) return console.log(USAGE);

  const db = openDb();
  console.log(`DB: ${describeDatabase(requireEnv("INGEST_DATABASE_URL"))}`);
  const today = localToday();
  const maxPages = values["max-pages"]
    ? Number(values["max-pages"])
    : KAKAO_MAX_PAGE;

  if (command === "serve") {
    const port = Number(values.port ?? 4700);
    const token = randomBytes(24).toString("hex");
    const scanDeps = createScanDeps(db);
    const server = createIngestServer({
      port,
      token,
      services: {
        target: describeDatabase(requireEnv("INGEST_DATABASE_URL")),
        publisherStats: (limit) => db.publisherStats(limit),
        scan: (publishers, pages, onPage) =>
          runScan(publishers, scanDeps, openJournal("scan"), {
            maxPages: pages,
            today,
            onPage,
          }),
        async apply(books, onBook) {
          const journal = openJournal("apply");
          const summary = await runApply(
            books,
            createIngestDeps(db),
            journal,
            onBook,
          );
          return { ...summary, journal: journal.path };
        },
        getFavorites: readFavorites,
        setFavorites: writeFavorites,
      },
    });
    server.listen(port, "127.0.0.1", () => {
      console.log(
        `http://127.0.0.1:${port} 에서 열려 있습니다. 끝내려면 Ctrl+C`,
      );
    });
    const shutdown = () => server.close(() => void db.close());
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
    return;
  }

  try {
    if (command === "publishers") {
      const rows = await db.publisherStats(Number(values.limit ?? 50));
      for (const row of rows)
        console.log(`${String(row.count).padStart(6)}  ${row.publisher}`);
      return;
    }

    const publishers = (values.publishers ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (publishers.length === 0)
      throw new Error("--publishers가 필요합니다\n\n" + USAGE);

    if (command === "scan" || command === "apply") {
      const scanJournal = openJournal("scan");
      const scans = await runScan(publishers, createScanDeps(db), scanJournal, {
        maxPages,
        today,
        onPage: (p) =>
          process.stdout.write(
            `\r${p.publisher} ${p.page}페이지 — 신규 ${p.fresh} · 보유 ${p.known} · 제외 ${p.excluded}      `,
          ),
      });
      process.stdout.write("\n");
      for (const scan of scans) printSummary(summarizeScan(scan));
      console.log(`조회 기록: ${scanJournal.path}`);

      if (command === "scan") return;

      const onlyIsbns = values.isbn
        ? new Set(values.isbn.split(",").map((s) => s.trim()))
        : null;
      const books = scans
        .flatMap((s) => s.fresh)
        .filter((b) => !onlyIsbns || onlyIsbns.has(b.isbn));
      if (books.length === 0) return console.log("적재할 책이 없습니다.");
      if (!values.yes) {
        return console.log(
          `\n${books.length}권을 적재하려면 --yes를 붙여 다시 실행하세요.`,
        );
      }

      const journal = openJournal("apply");
      const summary = await runApply(
        books,
        createIngestDeps(db),
        journal,
        (o, i) => {
          const tail =
            o.status === "failed"
              ? ` — ${o.error}`
              : o.cover.reused
                ? " (표지 재사용)"
                : "";
          console.log(`${i + 1}/${books.length} ${o.status} ${o.isbn}${tail}`);
        },
      );
      console.log(
        `\n적재 ${summary.inserted} · 이미 있음 ${summary.alreadyExists} · 실패 ${summary.failed}` +
          ` · 표지 재사용 ${summary.reusedCovers} · 저자 없음 ${summary.emptyAuthor}`,
      );
      console.log(`적재 기록: ${journal.path}`);
      if (summary.failed > 0) process.exitCode = 1;
      return;
    }

    throw new Error(`알 수 없는 명령: ${command}\n\n${USAGE}`);
  } finally {
    await db.close();
  }
}

function printSummary(s: ReturnType<typeof summarizeScan>) {
  const reasons = Object.entries(s.excludedByReason)
    .map(
      ([reason, n]) => `${EXCLUDE_REASON_LABEL[reason as ExcludeReason]} ${n}`,
    )
    .join(", ");
  console.log(
    `${s.publisher}: 카카오 ${s.totalCount}권 중 ${s.pages}페이지 — 신규 ${s.fresh} (예약 ${s.preorder}, 저자 없음 ${s.emptyAuthor}) · 보유 ${s.known} · 제외 ${s.excluded}${reasons ? ` (${reasons})` : ""}`,
  );
}

function readFavorites(): string[] {
  if (!existsSync(FAVORITES)) return [];
  try {
    const parsed = JSON.parse(readFileSync(FAVORITES, "utf8"));
    return Array.isArray(parsed)
      ? parsed.filter((p) => typeof p === "string")
      : [];
  } catch {
    return [];
  }
}

function writeFavorites(publishers: string[]) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FAVORITES, `${JSON.stringify(publishers, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
