import { BookInfo } from '@bookjeok/core';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Book } from '../entities/book.entity';
import {
  BookCatalogProvider,
  BookCatalogProviderKind,
  BookCatalogSearchParams,
  BookCatalogSearchResult,
} from './book-catalog.types';
import {
  buildAdjacentProbe,
  buildCountQuery,
  buildSearchQuery,
  canMatchAdjacent,
  searchColumnsFor,
  tokenize,
} from './book-search-query';

/**
 * 자체 DB 공급처 어댑터.
 *
 * 이미 적재된 `books`를 공급처처럼 다룹니다. 외부 공급처가 죽어도 우리가 가진
 * 도서는 계속 찾을 수 있게 하는 최후 방어선입니다.
 *
 * 상세 체인에서는 1순위입니다. ISBN이 PK라 인덱스 단건 조회입니다.
 * 2026-09-08에 알라딘 어댑터를 제거해 **두 체인의 유일한 공급처**가 되었습니다.
 * 검색은 제목·저자·출판사를 공백·기호 없이 이어 붙인 검색 키의 pg_trgm 인덱스와
 * 관련도 정렬이 담당합니다(`book-search-query.ts`). 체인 구성은 book.module.ts에서 정합니다.
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
   * 자체 DB에서 도서를 검색합니다. 검색어를 단어로 나눠 **모든 단어가 들어 있는**
   * 책을 찾고, 공백·기호는 무시합니다("사탄 탱고" → 『사탄탱고』, "라슬로 사탄" →
   * 저자+제목).
   * - sort='date': 출간일 최신순 (예약 판매분은 뒤로, pubDate DESC NULLS LAST)
   * - sort='sim' (기본): 관련도 순 (완전/접두/부분일치) -> 판매지수(salesPoint) 순
   * @param params 검색 조건
   * @returns 정규화된 검색 결과
   */
  async search(
    params: BookCatalogSearchParams,
  ): Promise<BookCatalogSearchResult> {
    const { query, display, start, field, sort } = params;
    // 공백·기호뿐인 검색어는 조건이 비어 모든 도서가 걸린다(실측 57,577행 /
    // 카운트에만 3초). 단어가 하나도 남지 않으면 질의하지 않는다.
    const tokens = tokenize(query ?? '');
    if (tokens.length === 0) {
      return { total: 0, start, display, items: [] };
    }

    const columns = searchColumnsFor(field);
    const adjacent =
      canMatchAdjacent(tokens) &&
      (await this.exists(buildAdjacentProbe(tokens, columns)));
    const offset = Math.max(start - 1, 0);

    const page = buildSearchQuery({
      tokens,
      columns,
      sort,
      adjacent,
      limit: display,
      offset,
    });
    const rows: { isbn: string; total: string }[] =
      await this.bookRepository.query(page.sql, page.params);

    let total = rows.length > 0 ? Number(rows[0].total) : 0;
    if (rows.length === 0 && offset > 0) {
      // 마지막 페이지를 넘긴 요청은 행이 없어 건수도 못 얻는다.
      const count = buildCountQuery({ tokens, columns, adjacent });
      const [row] = await this.bookRepository.query(count.sql, count.params);
      total = Number(row?.total ?? 0);
    }

    return {
      total,
      start,
      display,
      items: (await this.findBooksInOrder(rows.map((r) => r.isbn))).map(
        (book) => this.toBookInfo(book),
      ),
    };
  }

  private async exists(probe: { sql: string; params: unknown[] }) {
    const rows: unknown[] = await this.bookRepository.query(
      probe.sql,
      probe.params,
    );
    return rows.length > 0;
  }

  /**
   * 순위 쿼리가 고른 ISBN의 상세를 그 순서대로 가져옵니다. 순위를 매기는 단계에서
   * `description`(books 용량의 절반 이상인 TOAST 컬럼)을 끌고 다니지 않기 위해
   * 둘로 나눴습니다. `findPopularBooks`와 같은 방식입니다.
   */
  private async findBooksInOrder(isbns: string[]): Promise<Book[]> {
    if (isbns.length === 0) return [];
    const books = await this.bookRepository.findBy({ isbn: In(isbns) });
    const byIsbn = new Map(books.map((book) => [book.isbn, book]));
    return isbns.flatMap((isbn) => byIsbn.get(isbn) ?? []);
  }

  async findByIsbn(isbn: string): Promise<BookInfo | null> {
    const book = await this.bookRepository.findOneBy({ isbn });
    return book ? this.toBookInfo(book) : null;
  }

  /**
   * 엔티티를 서비스 표준 형태로 옮긴다. `link`는 자체 DB에 없으므로 비운다.
   *
   * `pubdate`는 계약(`BookInfo`)이 소문자를 쓴다. 네이버·알라딘 API 시절의
   * 이름이 그대로 남은 것이다. 엔티티는 `pubDate`라서 여기서 맞춰 준다.
   * 이 매핑이 빠져 있어 위시리스트와 리뷰 상세의 출간일이 계속 비어 있었다.
   */
  private toBookInfo(book: Book): BookInfo {
    return {
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      description: book.description,
      image: book.image,
      discount: book.discount,
      pubdate: book.pubDate ?? undefined,
    };
  }
}
