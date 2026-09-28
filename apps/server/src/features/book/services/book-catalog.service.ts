import { BookInfo } from '@bookjeok/core';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { clampNumber } from '@/shared/utils/clamp-number';

import {
  BOOK_DETAIL_PROVIDERS,
  BOOK_SEARCH_PROVIDERS,
  BookCatalogProvider,
  BookCatalogSearchParams,
  BookCatalogSearchResult,
} from '../providers/book-catalog.types';

const DEFAULT_DISPLAY = 10;
const DEFAULT_START = 1;
/**
 * 공개 엔드포인트라 클라이언트 값을 그대로 믿을 수 없다.
 * 음수는 Postgres에서 `LIMIT must not be negative`로 500을 내고,
 * 상한이 없으면 한 요청이 수만 행을 힙에 올린다.
 */
const MAX_DISPLAY = 100;

/**
 * 도서 서지 조회의 단일 진입점.
 *
 * 등록된 공급처를 순서대로 시도합니다. 한 공급처가 던지면 로그를 남기고 다음으로
 * 넘어가므로, 공급처 하나가 죽어도 조회 전체가 죽지는 않습니다.
 *
 * 검색과 상세는 체인이 다릅니다. 같은 공급처라도 경로에 따라 유불리가 반대라서
 * 그렇습니다. 순서는 book.module.ts에서 정합니다.
 *
 * 컨트롤러와 `BookService`는 이 서비스만 알면 됩니다. 공급처가 바뀔 때
 * 손대는 곳은 `book.module.ts`의 등록 순서 하나입니다.
 */
@Injectable()
export class BookCatalogService {
  private readonly logger = new Logger(BookCatalogService.name);

  constructor(
    @Inject(BOOK_SEARCH_PROVIDERS)
    private readonly searchProviders: BookCatalogProvider[],
    @Inject(BOOK_DETAIL_PROVIDERS)
    private readonly detailProviders: BookCatalogProvider[],
  ) {}

  async search(
    params: Partial<BookCatalogSearchParams> & { query: string },
  ): Promise<BookCatalogSearchResult & { lastBuildDate: string }> {
    const normalized: BookCatalogSearchParams = {
      query: params.query,
      display: clampNumber(params.display, DEFAULT_DISPLAY, 1, MAX_DISPLAY),
      start: clampNumber(
        params.start,
        DEFAULT_START,
        1,
        Number.MAX_SAFE_INTEGER,
      ),
      sort: params.sort ?? 'sim',
      field: params.field ?? 'Keyword',
    };

    const result = await this.runChain(
      this.searchProviders,
      (provider) => provider.search(normalized),
      (value) => value.items.length > 0,
      {
        total: 0,
        start: normalized.start,
        display: normalized.display,
        items: [],
      },
      `검색(${normalized.query})`,
    );

    return { ...result, lastBuildDate: new Date().toISOString() };
  }

  async findByIsbn(isbn: string): Promise<BookInfo | null> {
    return await this.runChain(
      this.detailProviders,
      (provider) => provider.findByIsbn(isbn),
      (value) => value !== null,
      null,
      `상세(${isbn})`,
    );
  }

  /**
   * 공급처를 순서대로 시도해 처음으로 쓸 만한 결과를 반환합니다.
   *
   * 빈 결과를 도서 없음으로 인정하려면 판정 자격이 있는 공급처가 하나는 정상
   * 응답해야 합니다. 아무도 응답하지 못했다면 장애이므로 예외를 전파합니다.
   * 여기서 빈 결과를 반환하면 장애가 404로 둔갑해 ISR 캐시에 고착됩니다.
   *
   * 판정 자격은 외부 공급처에만 있습니다. 자체 DB는 결과가 없어도 예외를 던지지
   * 않으므로, 판정에 포함하면 외부가 모두 죽어도 늘 도서 없음이 됩니다.
   * 외부 공급처가 하나도 없는 구성에서는 자체 DB가 그 자격을 대신합니다.
   *
   * @param providers 시도할 공급처 체인
   * @param call 공급처에 실행할 조회
   * @param isUsable 반환값을 쓸 만한 결과로 볼지 판단하는 함수
   * @param emptyValue 결과가 없을 때 반환할 값
   * @param context 로그에 남길 조회 설명
   */
  private async runChain<T>(
    providers: BookCatalogProvider[],
    call: (provider: BookCatalogProvider) => Promise<T>,
    isUsable: (value: T) => boolean,
    emptyValue: T,
    context: string,
  ): Promise<T> {
    let lastError: Error | null = null;
    let decided = false;

    const hasExternal = providers.some((p) => p.kind === 'external');
    const canDecide = (provider: BookCatalogProvider) =>
      hasExternal ? provider.kind === 'external' : true;

    for (const provider of providers) {
      try {
        const value = await call(provider);
        if (canDecide(provider)) decided = true;
        if (isUsable(value)) return value;
        this.logger.debug(`${provider.name} 결과 없음 — ${context}`);
      } catch (error) {
        // 원본 예외 종류(HttpException 등)는 그대로 살려 상위 처리에 맡긴다.
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `${provider.name} 실패 — ${context}: ${lastError.message}`,
        );
      }
    }

    if (!decided && lastError !== null) throw lastError;

    return emptyValue;
  }
}
