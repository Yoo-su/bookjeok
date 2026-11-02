import { sleep } from "../http";

export class WebAccessError extends Error {
  readonly fatal = true;
}

export type HtmlRequest = (
  url: string,
  headers?: Record<string, string>,
) => Promise<string>;

/** A single queue per host, shared by scans/retries in this process. No bot impersonation. */
export function createHtmlRequest({
  fetcher = fetch,
  intervalMs = 3000,
  wait = sleep,
  now = Date.now,
}: {
  fetcher?: typeof fetch;
  intervalMs?: number;
  wait?: (ms: number) => Promise<void>;
  now?: () => number;
} = {}): HtmlRequest {
  const queues = new Map<string, Promise<unknown>>();
  const lastStart = new Map<string, number>();
  return async (url, extraHeaders = {}) => {
    const target = new URL(url);
    if (
      target.protocol !== "https:" ||
      !["www.aladin.co.kr", "www.yes24.com"].includes(target.hostname)
    ) {
      throw new WebAccessError("허용하지 않은 웹 공급처 주소입니다");
    }
    const prior = queues.get(target.hostname) ?? Promise.resolve();
    const next = prior
      .catch(() => {})
      .then(async () => {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const last = lastStart.get(target.hostname);
          if (last !== undefined)
            await wait(Math.max(0, intervalMs - (now() - last)));
          lastStart.set(target.hostname, now());
          let response: Response;
          try {
            response = await fetcher(url, {
              redirect: "manual",
              signal: AbortSignal.timeout(20000),
              headers: {
                "User-Agent": "bookjeok-ingest/1.0 (+https://bookjeok.com)",
                Accept: "text/html",
                ...extraHeaders,
              },
            });
          } catch {
            throw new WebAccessError(
              `${target.hostname}: 네트워크 연결 실패·시간 초과. 적재를 중단합니다`,
            );
          }
          if (
            [401, 403, 429].includes(response.status) ||
            (response.status >= 300 && response.status < 400)
          ) {
            throw new WebAccessError(
              `${target.hostname} 접근 제한 (HTTP ${response.status}). 적재를 중단합니다`,
            );
          }
          if (response.status >= 500 && attempt === 0) {
            await response.body?.cancel();
            await wait(intervalMs);
            continue;
          }
          if (response.status >= 500)
            throw new WebAccessError(
              `${target.hostname} 일시 장애가 계속됩니다 (HTTP ${response.status})`,
            );
          if (!response.ok)
            throw new Error(
              `${target.hostname} 요청 실패 (HTTP ${response.status})`,
            );
          const html = await response.text();
          if (!html.trim()) throw new Error(`${target.hostname}: 빈 HTML 응답`);
          if (html.length > 2 * 1024 * 1024)
            throw new Error("웹 응답 크기 초과");
          if (
            /captcha|cf-chl-|access denied|로봇이 아닙니다|비정상적인 접근/i.test(
              html.slice(0, 12000),
            )
          ) {
            throw new WebAccessError(
              `${target.hostname}: 접근 확인 화면입니다. 적재를 중단합니다`,
            );
          }
          return html;
        }
        throw new Error(`${target.hostname} 응답 실패`);
      });
    queues.set(target.hostname, next);
    return next;
  };
}
