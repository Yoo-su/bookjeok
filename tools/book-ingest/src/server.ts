import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import type { PublisherStat } from "./db";
import type { IngestOutcome } from "./ingest";
import type { Candidate } from "./normalize";
import {
  type PageProgress,
  parseKeywordQuery,
  type ScanResult,
  type ScanTarget,
  SEARCH_FIELDS,
  SEARCH_SORTS,
} from "./scan";
import type { SearchField, SearchSort, SourceInfo } from "./sources";
import { type ApplySummary, summarizeScan } from "./workflow";

export interface IngestServices {
  publisherStats(limit: number): Promise<PublisherStat[]>;
  scan(
    source: string,
    targets: ScanTarget[],
    maxPages: number,
    onPage: (progress: PageProgress) => void,
  ): Promise<ScanResult[]>;
  apply(
    books: Candidate[],
    onBook: (outcome: IngestOutcome, index: number, book: Candidate) => void,
  ): Promise<ApplySummary & { journal: string }>;
  getFavorites(): string[];
  setFavorites(publishers: string[]): void;
  /** 화면 상단에 보여줄 접속 대상 요약(자격증명 없음). */
  target: string;
  sources: SourceInfo[];
}

export interface ServerOptions {
  port: number;
  token: string;
  services: IngestServices;
  /** 미리보기 표지를 불러올 출처. 공급처 정의에서 모읍니다. */
  imageOrigins?: string[];
  html?: string;
}

const MAX_BODY = 1024 * 1024;
const MAX_PUBLISHERS = 30;

/**
 * 127.0.0.1에만 붙는 운영자용 화면입니다. 브라우저가 열어 둔 다른 사이트가
 * localhost로 요청을 보내 적재를 일으키지 못하도록 두 겹으로 막습니다.
 * - Host 헤더가 127.0.0.1/localhost가 아니면 거절(DNS 리바인딩 방지)
 * - API는 실행마다 새로 만드는 토큰을 커스텀 헤더로 요구(교차 출처 요청은
 *   프리플라이트에서 막히고, CORS 헤더를 내지 않으므로 통과하지 못함)
 */
export function createIngestServer({
  port,
  token,
  services,
  imageOrigins = [],
  html,
}: ServerOptions): Server {
  const page = (
    html ?? readFileSync(new URL("./ui.html", import.meta.url), "utf8")
  ).replace("__INGEST_TOKEN__", token);
  const scans = new Map<string, Map<string, Candidate>>();
  let applying = false;

  return createServer(async (req, res) => {
    try {
      const host = req.headers.host ?? "";
      if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
        return sendJson(res, 403, { error: "허용되지 않은 Host" });
      }
      const url = new URL(req.url ?? "/", `http://${host}`);

      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "content-security-policy":
            "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; " +
            `img-src ${imageOrigins.join(" ") || "'none'"}; connect-src 'self'; base-uri 'none'; form-action 'none'`,
          "referrer-policy": "no-referrer",
        });
        return res.end(page);
      }

      if (!url.pathname.startsWith("/api/"))
        return sendJson(res, 404, { error: "없음" });
      if (req.headers["x-ingest-token"] !== token) {
        return sendJson(res, 403, { error: "토큰이 맞지 않습니다" });
      }

      if (req.method === "GET" && url.pathname === "/api/meta") {
        return sendJson(res, 200, {
          target: services.target,
          sources: services.sources,
        });
      }

      if (req.method === "GET" && url.pathname === "/api/publishers") {
        const limit = clamp(
          Number(url.searchParams.get("limit") ?? 300),
          1,
          2000,
        );
        return sendJson(res, 200, await services.publisherStats(limit));
      }

      if (req.method === "GET" && url.pathname === "/api/favorites") {
        return sendJson(res, 200, services.getFavorites());
      }

      if (req.method === "PUT" && url.pathname === "/api/favorites") {
        const body = await readJson(req);
        if (!isStringArray(body))
          return sendJson(res, 400, { error: "문자열 배열이 필요합니다" });
        services.setFavorites([
          ...new Set(body.map((p) => p.trim()).filter(Boolean)),
        ]);
        return sendJson(res, 200, services.getFavorites());
      }

      // 출판사 신간(`publishers`)이나 자유 검색(`query`) 중 하나를 받습니다
      if (req.method === "POST" && url.pathname === "/api/scan") {
        const body = (await readJson(req)) as {
          source?: unknown;
          publishers?: unknown;
          query?: { text?: unknown; field?: unknown; sort?: unknown };
          maxPages?: unknown;
        };
        const source = services.sources.find(
          (s) => s.id === body?.source && s.available,
        );
        if (!source) {
          return sendJson(res, 400, { error: "쓸 수 있는 공급처를 고르세요" });
        }
        const targets = body.query
          ? keywordTargets(body.query)
          : publisherTargets(body.publishers);
        if (typeof targets === "string") {
          return sendJson(res, 400, { error: targets });
        }
        const maxPages = clamp(
          Number(body.maxPages ?? source.maxPages),
          1,
          source.maxPages,
        );
        const emit = openStream(res);
        try {
          const result = await services.scan(
            source.id,
            targets,
            maxPages,
            (p) => emit({ type: "page", ...p }),
          );
          const scanId = randomUUID();
          scans.set(
            scanId,
            new Map(
              result.flatMap((s) => s.fresh.map((b) => [b.isbn, b] as const)),
            ),
          );
          emit({ type: "result", scanId, sections: result.map(toScanView) });
        } catch (error) {
          emit({ type: "error", message: messageOf(error) });
        }
        return res.end();
      }

      if (req.method === "POST" && url.pathname === "/api/apply") {
        const body = (await readJson(req)) as {
          scanId?: unknown;
          isbns?: unknown;
        };
        const scan =
          typeof body?.scanId === "string" ? scans.get(body.scanId) : undefined;
        if (!scan)
          return sendJson(res, 404, {
            error: "조회 결과가 없습니다. 다시 찾아 주세요",
          });
        if (!isStringArray(body.isbns) || body.isbns.length === 0) {
          return sendJson(res, 400, { error: "적재할 책을 고르세요" });
        }
        // 화면이 보낸 데이터가 아니라 서버가 조회해 둔 후보만 적재합니다.
        const books = body.isbns.map((isbn) => scan.get(isbn));
        if (books.some((b) => !b)) {
          return sendJson(res, 400, {
            error: "조회 결과에 없는 ISBN이 있습니다",
          });
        }
        if (applying)
          return sendJson(res, 409, { error: "이미 적재 중입니다" });

        applying = true;
        const emit = openStream(res);
        try {
          const summary = await services.apply(
            books as Candidate[],
            (outcome, index, book) =>
              emit({
                type: "book",
                index,
                total: books.length,
                title: book.title,
                outcome,
              }),
          );
          emit({ type: "done", summary });
        } catch (error) {
          emit({ type: "error", message: messageOf(error) });
        } finally {
          applying = false;
        }
        return res.end();
      }

      return sendJson(res, 404, { error: "없음" });
    } catch (error) {
      if (!res.headersSent)
        return sendJson(res, 500, { error: messageOf(error) });
      res.end();
    }
  });
}

/** 오류면 화면에 보여 줄 문구를 돌려줍니다. */
function publisherTargets(value: unknown): ScanTarget[] | string {
  const publishers = isStringArray(value)
    ? [...new Set(value.map((p) => p.trim()).filter(Boolean))]
    : [];
  if (publishers.length === 0 || publishers.length > MAX_PUBLISHERS) {
    return `출판사를 1~${MAX_PUBLISHERS}곳 고르세요`;
  }
  return publishers.map((publisher) => ({ kind: "publisher", publisher }));
}

function keywordTargets(query: {
  text?: unknown;
  field?: unknown;
  sort?: unknown;
}): ScanTarget[] | string {
  const field = query.field ?? "all";
  const sort = query.sort ?? "accuracy";
  if (!SEARCH_FIELDS.includes(field as SearchField))
    return "검색 필드가 잘못됐습니다";
  if (!SEARCH_SORTS.includes(sort as SearchSort)) return "정렬이 잘못됐습니다";
  const parsed =
    typeof query.text === "string"
      ? parseKeywordQuery(query.text, field as SearchField, sort as SearchSort)
      : null;
  if (!parsed) return "검색어를 1~100자로 넣으세요";
  return [{ kind: "keyword", query: parsed }];
}

/** 화면에 보낼 모양. 공급처 원본(`raw`)은 보내지 않습니다. */
function toScanView(scan: ScanResult) {
  return {
    summary: summarizeScan(scan),
    fresh: scan.fresh.map(({ raw: _raw, coverUrls: _covers, ...book }) => book),
    // 자유 검색에서 "이미 있는지"를 확인하는 용도라 목록 표시에 필요한 것만 보냅니다
    known: scan.known.map(({ isbn, title, author, pubDate }) => ({
      isbn,
      title,
      author,
      pubDate,
    })),
    excluded: scan.excluded.map(({ raw: _raw, ...item }) => item),
  };
}

function openStream(res: ServerResponse) {
  res.writeHead(200, {
    "content-type": "application/x-ndjson; charset=utf-8",
    "cache-control": "no-store",
  });
  return (event: Record<string, unknown>) =>
    res.write(`${JSON.stringify(event)}\n`);
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  if (!(req.headers["content-type"] ?? "").startsWith("application/json")) {
    throw new Error("application/json 본문이 필요합니다");
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("본문이 너무 큽니다");
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "null");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : min;
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
