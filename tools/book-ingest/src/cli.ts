import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { DATA_DIR, describeDatabase, loadEnv, requireEnv } from "./config";
import { formatDimensions } from "./dimensions";
import type { IngestOutcome } from "./ingest";
import { openJournal } from "./journal";
import { localToday } from "./normalize";
import { createIngestDeps, createScanDeps, openDb } from "./runtime";
import {
  parseKeywordQuery,
  type ScanTarget,
  SEARCH_FIELDS,
  SEARCH_SORTS,
} from "./scan";
import { createIngestServer } from "./server";
import {
  createSources,
  describeSources,
  imageOrigins,
  type SearchField,
  type SearchSort,
  SOURCES,
} from "./sources";
import { runApply, runScan, summarizeScan } from "./workflow";

const USAGE = `사용법: pnpm ingest <명령> [옵션]   (저장소 루트에서)

  serve                          로컬 화면(127.0.0.1)을 띄웁니다
      --port <n>                 기본 4700
  scan  --publishers 민음사,창비  DB에 없는 신간을 찾기만 합니다(쓰기 없음)
  scan  --query 사탄탱고          자유 검색으로 DB에 없는 책을 찾습니다(쓰기 없음)
      --field <f>                ${SEARCH_FIELDS.join(" | ")} (기본 all, ISBN은 자동 인식)
      --sort <s>                 ${SEARCH_SORTS.join(" | ")} (기본 accuracy)
      --source <id>              공급처: ${SOURCES.map((s) => s.id).join(" | ")} (기본 ${SOURCES[0].id})
      --max-pages <n>            최대 페이지(출판사 기본은 공급처 상한, 검색 기본은 1)
  apply --publishers 민음사 --yes 찾은 책 전부를 적재합니다 (--query도 같음)
      --isbn a,b                 이 ISBN만 적재
  publishers [--limit 50]        DB 보유 수 상위 출판사`;

const FAVORITES = resolve(DATA_DIR, "favorites.json");

async function main() {
  loadEnv();
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      publishers: { type: "string" },
      source: { type: "string" },
      query: { type: "string" },
      field: { type: "string" },
      sort: { type: "string" },
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
  const sources = createSources();

  if (command === "serve") {
    const port = Number(values.port ?? 4700);
    const token = randomBytes(24).toString("hex");
    const server = createIngestServer({
      port,
      token,
      imageOrigins: imageOrigins(),
      services: {
        target: describeDatabase(requireEnv("INGEST_DATABASE_URL")),
        sources: describeSources(),
        publisherStats: (limit) => db.publisherStats(limit),
        scan(sourceId, targets, pages, onPage) {
          const source = sources.get(sourceId);
          if (!source) throw new Error(`공급처 ${sourceId}의 키가 없습니다`);
          return runScan(
            targets,
            createScanDeps(db, source),
            openJournal("scan"),
            { maxPages: pages, today, onPage },
          );
        },
        async apply(books, onBook) {
          const journal = openJournal("apply");
          const summary = await runApply(
            books,
            createIngestDeps(db, sources),
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

    if (command === "scan" || command === "apply") {
      const targets = parseTargets(values);
      const sourceId = values.source ?? SOURCES[0].id;
      const definition = SOURCES.find((s) => s.id === sourceId);
      if (!definition) throw new Error(`알 수 없는 공급처: ${sourceId}`);
      requireEnv(definition.envKey);
      const source = sources.get(sourceId)!;
      console.log(`공급처: ${source.label}`);

      const scanJournal = openJournal("scan");
      const scans = await runScan(
        targets,
        createScanDeps(db, source),
        scanJournal,
        {
          maxPages: values["max-pages"]
            ? Number(values["max-pages"])
            : values.query
              ? 1
              : source.maxPages,
          today,
          onPage: (p) =>
            process.stdout.write(
              `\r${p.label} ${p.page}페이지 — 신규 ${p.fresh} · 보유 ${p.known} · 제외 ${p.excluded}      `,
            ),
        },
      );
      process.stdout.write("\n");
      for (const scan of scans) printSummary(summarizeScan(scan));
      console.log(`조회 기록: ${scanJournal.path}`);

      if (command === "scan") return;

      // 검색 결과에는 해외판·다른 판본이 섞이므로 전부 적재하지 않는다
      if (values.query !== undefined && !values.isbn) {
        throw new Error(
          "검색 결과는 --isbn으로 고른 책만 적재합니다. scan으로 찾은 뒤 ISBN을 넘기세요.",
        );
      }
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
        createIngestDeps(db, sources),
        journal,
        (o, i) =>
          console.log(
            `${i + 1}/${books.length} ${o.status} ${o.isbn}${describeOutcome(o)}`,
          ),
      );
      console.log(
        `\n적재 ${summary.inserted} · 이미 있음 ${summary.alreadyExists} · 실패 ${summary.failed}` +
          ` · 표지 재사용 ${summary.reusedCovers} · 저자 없음 ${summary.emptyAuthor}` +
          ` · 판형 행 ${summary.dimensionRows}(실측 ${summary.measured})` +
          (summary.colorFailed ? ` · 표지색 실패 ${summary.colorFailed}` : ""),
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

function parseTargets(values: {
  publishers?: string;
  query?: string;
  field?: string;
  sort?: string;
}): ScanTarget[] {
  if (values.query !== undefined) {
    if (values.publishers) {
      throw new Error("--publishers와 --query는 함께 쓸 수 없습니다");
    }
    const field = (values.field ?? "all") as SearchField;
    const sort = (values.sort ?? "accuracy") as SearchSort;
    if (!SEARCH_FIELDS.includes(field))
      throw new Error(`알 수 없는 --field: ${field}`);
    if (!SEARCH_SORTS.includes(sort))
      throw new Error(`알 수 없는 --sort: ${sort}`);
    const query = parseKeywordQuery(values.query, field, sort);
    if (!query) throw new Error("--query는 1~100자여야 합니다");
    return [{ kind: "keyword", query }];
  }
  const publishers = (values.publishers ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (publishers.length === 0) {
    throw new Error("--publishers나 --query가 필요합니다\n\n" + USAGE);
  }
  return publishers.map((publisher) => ({ kind: "publisher", publisher }));
}

function describeOutcome(o: IngestOutcome): string {
  if (o.status === "failed") return ` — ${o.error}`;
  const { dimensions, coverColor, colorError, written } = o.dimension;
  const parts = [
    o.cover.reused ? "표지 재사용" : null,
    dimensions
      ? `판형 ${formatDimensions(dimensions)} (${dimensions.source})`
      : "판형 없음",
    coverColor ?? `표지색 실패: ${colorError}`,
    written ? null : "판형 행 추가 안 함",
  ].filter(Boolean);
  return ` (${parts.join(" · ")})`;
}

function printSummary(s: ReturnType<typeof summarizeScan>) {
  const reasons = Object.entries(s.excludedByReason)
    .map(([label, n]) => `${label} ${n}`)
    .join(", ");
  console.log(
    `${s.label}: ${s.totalCount}권 중 ${s.pages}페이지 — 신규 ${s.fresh} (예약 ${s.preorder}, 저자 없음 ${s.emptyAuthor}) · 보유 ${s.known} · 제외 ${s.excluded}${reasons ? ` (${reasons})` : ""}`,
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
