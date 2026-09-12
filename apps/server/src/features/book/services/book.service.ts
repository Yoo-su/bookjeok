import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ReadingLogService } from '@/features/reading-log/services/reading-log.service';
import { WishlistService } from '@/features/wishlist/services/wishlist.service';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { Book } from '../entities/book.entity';

/** 인기 도서 노출 개수. 홈 화면 슬라이더가 이 수만큼 받는다. */
const POPULAR_BOOK_LIMIT = 10;

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly readingLogService: ReadingLogService,
    private readonly wishlistService: WishlistService,
  ) {}

  /**
   * ISBN이 `books`에 존재함을 보장하고 그 도서를 반환합니다.
   *
   * `BookResolvePipe`가 판매글·리뷰·독서기록·위시리스트 등록 앞단에서 호출해,
   * 서비스 레이어에 도달했을 때는 항상 유효한 도서가 있음을 보장합니다. 여기서
   * 막지 않으면 각 서비스가 `books`를 참조하는 행을 만들다 외래키 위반으로 500이
   * 나고, `reading_logs`처럼 FK가 없는 테이블에서는 고아 행이 조용히 생깁니다.
   *
   * 2026-09-08 이전에는 없는 도서를 외부 공급처에서 받아와 만들었습니다. 공급처
   * 체인에서 알라딘을 제거하면서 그 경로가 사라졌습니다. 지금은 우리가 가진 것이
   * 곧 전부이고, 신규 도서는 운영자가 주기적으로 돌리는 스크립트로 확보합니다.
   *
   * 공급처 포트(`BookCatalogService`)는 여기서 쓰지 않습니다. 그쪽은 정규화된
   * `BookInfo`를 돌려주는 "발견" 경로이고, 이 메서드는 우리 마스터 레코드를
   * 확인하는 경로입니다. 나중에 지연 생성을 되살리려면 이 함수에 분기를 다시
   * 넣으면 됩니다.
   *
   * @param isbn 조회할 도서의 ISBN
   * @returns 해당 도서
   * @throws BOOK_NOT_FOUND 자체 DB에 없을 때
   */
  async resolveBook(isbn: string): Promise<Book> {
    const book = await this.bookRepository.findOneBy({ isbn });
    if (!book) {
      throw new BusinessException('BOOK_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return book;
  }

  /**
   * 책 상세페이지 조회수를 증가시킵니다.
   */
  async incrementBookViewCount(isbn: string): Promise<void> {
    await this.bookRepository.increment({ isbn }, 'viewCount', 1);
  }

  /**
   * 인기 도서 목록을 조회합니다.
   *
   * 인기도 = (독서기록 × 10) + (위시리스트 × 8) + (리뷰 × 5) + ln(판매지수 + 1)
   *
   * 활동 테이블(독서기록, 위시리스트, 리뷰)을 사전에 집계하여 조인하고,
   * 사용자 활동 신호와 정규화된 판매지수를 가중 합산하여 상위 도서를 선별합니다.
   *
   * @returns 인기도 상위 10권
   */
  async findPopularBooks(): Promise<Book[]> {
    const rawResults = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoin(
        (qb) =>
          qb
            .select('log.isbn', 'isbn')
            .addSelect('COUNT(*)', 'cnt')
            .from('reading_logs', 'log')
            .groupBy('log.isbn'),
        'rl',
        'rl.isbn = book.isbn',
      )
      .leftJoin(
        (qb) =>
          qb
            .select('wish.isbn', 'isbn')
            .addSelect('COUNT(*)', 'cnt')
            .from('wishlists', 'wish')
            .where('wish.isbn IS NOT NULL')
            .groupBy('wish.isbn'),
        'wl',
        'wl.isbn = book.isbn',
      )
      .leftJoin(
        (qb) =>
          qb
            .select('review.isbn', 'isbn')
            .addSelect('COUNT(*)', 'cnt')
            .from('reviews', 'review')
            .groupBy('review.isbn'),
        'rv',
        'rv.isbn = book.isbn',
      )
      // 사용자 활동도 없고 판매 실적도 없는 도서는 순위에 오를 수 없다.
      // viewCount를 조건에서 뺀 이유는 그 값이 대부분 크롤러 흔적이기 때문이다.
      // 대신 salesPoint를 넣지 않으면 도서의 75%(viewCount 0)가 후보에서 통째로
      // 빠진다.
      .where(
        'book.salesPoint > 0 OR rl.isbn IS NOT NULL OR wl.isbn IS NOT NULL OR rv.isbn IS NOT NULL',
      )
      // 순위를 가리는 단계에서는 isbn과 점수만 읽는다. 상세 컬럼을 여기서
      // 끌고 가면 정렬 대상 전체를 들고 다니게 되는데, 특히 description은
      // books 370MB 중 200MB 이상을 차지하는 TOAST 컬럼이다. 10권을 뽑으려고
      // 5만 권의 책 소개를 읽어 정렬하던 것이 호출당 3.8초의 원인이었다.
      .select('book.isbn', 'isbn')
      // 우리 사용자의 활동을 시장 인기도보다 위에 둔다. 여기는 독서 커뮤니티라
      // 누가 실제로 읽고 담고 쓴 책이 곧 인기책이다.
      //
      // 판매지수는 0~6만 범위라 그대로 더하면 활동 신호를 완전히 덮어버린다.
      // 자연로그를 씌우면 0~11로 눌려서, 최다 판매 도서 한 권이 독서기록 한 건과
      // 비슷한 무게가 된다. 활동이 있는 도서가 140종뿐인 현재 분포에서, 나머지
      // 5만여 권의 순서를 판매지수가 가른다.
      .addSelect(
        `COALESCE(rl.cnt, 0) * 10
         + COALESCE(wl.cnt, 0) * 8
         + COALESCE(rv.cnt, 0) * 5
         + LN(COALESCE(book."salesPoint", 0) + 1)`,
        'popularity',
      )
      .orderBy('popularity', 'DESC')
      .addOrderBy('book.salesPoint', 'DESC', 'NULLS LAST')
      // 동점일 때 순서가 흔들리지 않도록 고정한다.
      .addOrderBy('book.isbn', 'ASC')
      .limit(POPULAR_BOOK_LIMIT)
      .getRawMany<{ isbn: string }>();

    const isbns = rawResults.map((raw) => raw.isbn);
    if (isbns.length === 0) return [];

    // 상세는 10건만 따로 가져온다. 순위 쿼리가 매긴 순서를 그대로 지킨다.
    const books = await this.findBooksByIsbns(isbns);
    const byIsbn = new Map(books.map((book) => [book.isbn, book]));

    return isbns
      .map((isbn) => byIsbn.get(isbn))
      .filter((book): book is Book => !!book)
      .map((book) => ({ ...book, usedBookSales: [] })) as Book[];
  }

  /**
   * 특정 책의 통계 정보를 조회합니다 (읽은 유저 수, 위시리스트 유저 수).
   * @param isbn - 책 ISBN
   */
  async getBookStats(
    isbn: string,
  ): Promise<{ readingUserCount: number; wishlistUserCount: number }> {
    const readingUserCount =
      await this.readingLogService.countUniqueReaders(isbn);
    const wishlistUserCount =
      await this.wishlistService.countUniqueWishlistUsers(isbn);

    return {
      readingUserCount,
      wishlistUserCount,
    };
  }

  /**
   * ISBN으로 도서를 단건 조회합니다. (외부 생성 흐름 없이 단순 조회 전용)
   */
  async findBookByIsbn(isbn: string): Promise<Book | null> {
    return await this.bookRepository.findOneBy({ isbn });
  }

  /**
   * ISBN 목록으로 도서들을 일괄 조회합니다. (N+1 쿼리 최적화)
   */
  async findBooksByIsbns(isbns: string[]): Promise<Book[]> {
    if (isbns.length === 0) return [];
    return await this.bookRepository.findBy({ isbn: In(isbns) });
  }
}
