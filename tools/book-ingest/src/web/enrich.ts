import type { Candidate } from "../normalize";
import { localToday } from "../normalize";
import type { HtmlCache } from "./cache";
import {
  completeCandidate,
  parseAladinDetail,
  parseDescription,
  parseYes24Depth,
  type WebCandidate,
  yes24ProductIds,
} from "./fields";
import { type HtmlRequest, WebAccessError } from "./request";

export function createWebEnricher(
  request: HtmlRequest,
  cache: HtmlCache,
  today = localToday(),
) {
  async function page<T>(
    key: string,
    url: string,
    parse: (html: string) => T,
    headers?: Record<string, string>,
  ) {
    const cached = await cache.read(key);
    if (cached !== null) {
      try {
        return parse(cached);
      } catch {
        /* Stale markup: fetch once again. */
      }
    }
    const html = await request(url, headers);
    const result = parse(html);
    await cache.write(key, html);
    return result;
  }

  return async (candidate: WebCandidate): Promise<Candidate> => {
    const isbn = candidate.isbn;
    const detailUrl = `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${isbn}`;
    const detail = await page(`aladin:detail:${isbn}`, detailUrl, (html) =>
      parseAladinDetail(html, isbn),
    );
    let description: string | undefined;
    for (const kind of ["PublisherDesc", "Introduce"] as const) {
      try {
        const query = new URLSearchParams({
          ISBN: detail.productCode,
          name: kind,
          type: "0",
          date: String(new Date().getHours()),
        });
        description = await page(
          `aladin:${kind}:${isbn}`,
          `https://www.aladin.co.kr/shop/product/getContents.aspx?${query}`,
          (html) => parseDescription(html, kind),
          {
            Referer: detail.draft.link || detailUrl,
            "X-Requested-With": "XMLHttpRequest",
          },
        );
        break;
      } catch (error) {
        if (error instanceof WebAccessError) throw error;
      }
    }
    if (!description) throw new Error(`알라딘 소개 전문 미확보: ${isbn}`);
    const searchUrl = new URL("https://www.yes24.com/Product/Search");
    searchUrl.searchParams.set("domain", "BOOK");
    searchUrl.searchParams.set("query", isbn);
    const ids = await page(
      `yes24:search:${isbn}`,
      searchUrl.toString(),
      (html) => {
        const found = yes24ProductIds(html);
        if (!found.length)
          throw new Error(`YES24 종이책 검색 결과 없음: ${isbn}`);
        return found;
      },
    );
    let depth: number | undefined;
    const errors: string[] = [];
    let yes24Id: string | undefined;
    for (const id of ids) {
      try {
        depth = await page(
          `yes24:depth:${isbn}:${id}`,
          `https://www.yes24.com/product/goods/${id}`,
          (html) => parseYes24Depth(html, isbn),
        );
        yes24Id = id;
        break;
      } catch (error) {
        if (error instanceof WebAccessError) throw error;
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (depth === undefined)
      throw new Error(`YES24 두께 미확보: ${isbn} (${errors.join("; ")})`);
    const enriched = completeCandidate(
      detail,
      description,
      depth,
      candidate,
      today,
    );
    return {
      ...enriched,
      raw: {
        discovery: candidate.raw,
        aladin: { ...detail, description },
        yes24: { isbn, productId: yes24Id, depth },
        assembledAt: new Date().toISOString(),
      },
    };
  };
}
