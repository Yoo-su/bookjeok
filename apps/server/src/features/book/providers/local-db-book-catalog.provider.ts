import { BookInfo, BookSearchField } from '@bookjeok/core';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Book } from '../entities/book.entity';
import {
  BookCatalogProvider,
  BookCatalogProviderKind,
  BookCatalogSearchParams,
  BookCatalogSearchResult,
} from './book-catalog.types';

/** 검색 대상이 될 수 있는 `books` 컬럼. */
export type BookSearchColumn = 'title' | 'author' | 'publisher';

const COLUMNS_BY_FIELD: Record<BookSearchField, readonly BookSearchColumn[]> = {
  Title: ['title'],
  Author: ['author'],
  Publisher: ['publisher'],
  // 통합 검색. 배열 순서가 곧 관련도 우선순위다. relevanceCaseSql 참조.
  Keyword: ['title', 'author', 'publisher'],
};

/**
 * 검색 필드에 따라 조회할 컬럼을 반환합니다.
 * 이 값을 무시하면 출판사 검색(도서 상세의 같은 출판사 책, 홈 출판사 슬라이더)이
 * 자체 DB에서 항상 0건이 됩니다.
 * @param field 검색 필드
 * @returns 조회 대상 컬럼 목록 (우선순위 순)
 */
export function searchColumnsFor(
  field: BookSearchField,
): readonly BookSearchColumn[] {
  return COLUMNS_BY_FIELD[field] ?? COLUMNS_BY_FIELD.Keyword;
}

/**
 * 검색어의 %와 _가 ILIKE 와일드카드로 동작하지 않도록 이스케이프합니다.
 * Postgres의 LIKE 기본 이스케이프 문자가 백슬래시라 별도 ESCAPE 절은 필요 없습니다.
 * @param value 사용자 검색어
 * @returns 이스케이프된 검색어
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** 일치 강도. 쿼리 파라미터 이름과 같다. */
type MatchKind = 'exact' | 'prefix' | 'like';

/**
 * 통합 검색의 관련도 순위. 앞에 올수록 상위입니다.
 *
 * **출판사 완전일치가 제목 접두·부분일치보다 위에 있는 것이 이 배열의 요점입니다.**
 * 근거는 `docs/book-data-migration-plan.md` 8-d에 있습니다.
 */
const KEYWORD_RELEVANCE_ORDER: ReadonlyArray<
  readonly [BookSearchColumn, MatchKind]
> = [
  ['title', 'exact'],
  // "민음사"처럼 출판사명을 그대로 친 검색은 그 출판사 책을 보려는 의도다.
  // 제목에 출판사명이 든 전집 세트가 카탈로그 전체를 밀어내면 안 된다.
  ['publisher', 'exact'],
  ['title', 'prefix'],
  ['title', 'like'],
  // 저자는 승격하지 않는다. `김영하` / `김영하 (지은이)`로 표기가 섞여 있어
  // (괄호 13% · 다중저자 15%) 완전일치 티어가 한 저자의 책을 갈라놓는다.
  ['author', 'exact'],
  ['author', 'prefix'],
  ['author', 'like'],
  ['publisher', 'prefix'],
  ['publisher', 'like'],
];

/**
 * 관련도 정렬용 CASE 식을 만듭니다. 값이 낮을수록 상위입니다.
 * 알라딘의 Sort=Accuracy를 대신하는 부분입니다.
 * @param alias 테이블 별칭
 * @param columns 검색 대상 컬럼
 * @returns ORDER BY에 넣을 CASE 식
 */
export function relevanceCaseSql(
  alias: string,
  columns: readonly BookSearchColumn[],
): string {
  // 단일 필드 검색은 그 필드 안에서 완전 → 접두 → 부분 순이면 충분하다.
  const order =
    columns.length === 1
      ? (['exact', 'prefix', 'like'] as const).map(
          (kind) => [columns[0], kind] as const,
        )
      : KEYWORD_RELEVANCE_ORDER.filter(([column]) => columns.includes(column));

  const branches = order.map(
    ([column, kind], rank) =>
      `WHEN ${alias}.${column} ILIKE :${kind} THEN ${rank}`,
  );

  return `CASE ${branches.join(' ')} ELSE ${branches.length} END`;
}

/**
 * 아직 오지 않은 출간일을 뒤로 미는 정렬 키입니다.
 *
 * `books`에는 예약 판매 도서의 미래 출간일이 22건 있습니다(최대 2030-12-31).
 * 그냥 pubDate DESC로 두면 신간순 1페이지를 이것들이 통째로 차지합니다.
 * 걸러내지 않고 뒤로만 미는 이유는 예약 판매도 정상 도서라 검색 결과에서
 * 사라지면 안 되기 때문입니다.
 *
 * NULLS LAST를 빼면 pubDate가 없는 276건이 Postgres 기본값(DESC → NULLS FIRST)
 * 때문에 맨 앞으로 올라옵니다.
 */
const PUBLISHED_FIRST_SQL = 'book."pubDate" <= CURRENT_DATE';

/**
 * 자체 DB 공급처 어댑터.
 *
 * 이미 적재된 `books`를 공급처처럼 다룹니다. 외부 공급처가 죽어도 우리가 가진
 * 도서는 계속 찾을 수 있게 하는 최후 방어선입니다.
 *
 * 상세 체인에서는 1순위입니다. ISBN이 PK라 인덱스 단건 조회입니다.
 * 2026-09-08에 알라딘 어댑터를 제거해 **두 체인의 유일한 공급처**가 되었습니다.
 * 검색 품질은 title·author·publisher의 pg_trgm GIN 인덱스와 아래 관련도 정렬이
 * 담당합니다. 체인 구성은 book.module.ts에서 정합니다.
 *
 * kind가 local인 이유는 이 어댑터의 결과 없음이 도서의 부재가 아니라 미확보를
 * 뜻하기 때문입니다. BookCatalogService가 장애와 도서 없음을 구분할 때 씁니다.
 */
@Injectable()
export class LocalDbBookCatalogProvider implements BookCatalogProvider {
  readonly name = 'local-db';
  readonly kind: BookCatalogProviderKind = 'local';

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  /**
   * 자체 DB에서 도서를 검색합니다.
   * - sort='date': 출간일 최신순 (예약 판매분은 뒤로, pubDate DESC NULLS LAST)
   * - sort='sim' (기본): 관련도 순 (완전/접두/부분일치) -> 판매지수(salesPoint) 순
   * @param params 검색 조건
   * @returns 정규화된 검색 결과
   */
  async search(
    params: BookCatalogSearchParams,
  ): Promise<BookCatalogSearchResult> {
    const { query, display, start, field, sort } = params;
    // 공백만 있는 검색어를 통과시키면 ILIKE '% %'가 되어 공백이 든 모든 도서가
    // 매칭된다(실측 57,577행 / 카운트에만 3초). 빈 문자열 검사로는 못 막는다.
    const trimmed = query?.trim() ?? '';
    if (!trimmed) {
      return { total: 0, start, display, items: [] };
    }

    const columns = searchColumnsFor(field);
    const escaped = escapeLike(trimmed);

    const qb = this.bookRepository
      .createQueryBuilder('book')
      .where(columns.map((c) => `book.${c} ILIKE :like`).join(' OR '), {
        like: `%${escaped}%`,
        prefix: `${escaped}%`,
        exact: escaped,
      });

    if (sort === 'date') {
      qb.orderBy(PUBLISHED_FIRST_SQL, 'DESC', 'NULLS LAST')
        .addOrderBy('book.pubDate', 'DESC', 'NULLS LAST')
        .addOrderBy('book.salesPoint', 'DESC', 'NULLS LAST')
        .addOrderBy('book.isbn', 'ASC');
    } else {
      qb.orderBy(relevanceCaseSql('book', columns), 'ASC')
        .addOrderBy('book.salesPoint', 'DESC', 'NULLS LAST')
        .addOrderBy('book.isbn', 'ASC');
    }

    const [books, total] = await qb
      .skip(Math.max(start - 1, 0))
      .take(display)
      .getManyAndCount();

    return {
      total,
      start,
      display,
      items: books.map((book) => this.toBookInfo(book)),
    };
  }

  async findByIsbn(isbn: string): Promise<BookInfo | null> {
    const book = await this.bookRepository.findOneBy({ isbn });
    return book ? this.toBookInfo(book) : null;
  }

  /** 엔티티를 서비스 표준 형태로 옮긴다. `link`는 자체 DB에 없으므로 비운다. */
  private toBookInfo(book: Book): BookInfo {
    return {
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      description: book.description,
      image: book.image,
      discount: book.discount,
    };
  }
}
