import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

// 운영에는 TypeORM 데코레이터로 표현할 수 없는 인덱스가 셋 있다.
//   IDX_books_title_trgm / IDX_books_author_trgm / IDX_books_publisher_trgm
//   → gin (컬럼 gin_trgm_ops). 연산자 클래스를 지정할 수 없어 여기 선언할 수 없다.
// 지우지 말 것. 검색이 전부 풀스캔으로 돌아간다 (docs/manual-ddl-log.md 4절).
@Entity({ name: 'books' })
export class Book {
  @PrimaryColumn()
  isbn: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column()
  publisher: string;

  /**
   * 기준가. 알라딘 종료(2026-10-30) 전까지는 알라딘 판매가가 들어 있었으나,
   * 판매가는 벤더의 프로모션이라 갱신이 끊기면 곧 썩습니다. 그래서 **정가**로
   * 의미를 바꿉니다. 정가는 판(edition)의 속성이라 갱신할 필요가 없습니다.
   * 중고 판매글의 "N% OFF"도 정가 기준이 맞습니다.
   */
  @Column({ type: 'varchar', length: 255, default: '' })
  discount: string;

  /**
   * 출간일. 최초 스키마가 네이버 API 기준이라 이 필드가 없었고, 그래서
   * 신간순 정렬을 구현할 수 없었습니다(`createdAt`은 우리가 적재한 시각이라
   * 대신 쓸 수 없습니다).
   *
   * 공급처가 주지 않거나 알라딘에 없는 도서가 있어 nullable입니다.
   */
  @Column({ type: 'date', nullable: true })
  pubDate?: Date | null;

  /**
   * 알라딘 판매지수. 국내 도서 시장의 사실상 표준 인기도 지표입니다.
   *
   * 이 값이 없을 때 검색은 `viewCount`로 동점을 갈랐는데, 도서의 75%가 0회이고
   * 값이 있는 것도 대부분 크롤러 흔적이라 사실상 난수였습니다. 실측에서 스테디셀러가
   * 오히려 바닥에 깔렸습니다(`docs/book-data-migration-plan.md` 8-c).
   *
   * 알라딘 종료(2026-10-30) 후에는 갱신할 수 없는 스냅샷입니다. 그래도 스테디셀러의
   * 순위는 잘 변하지 않아 신호가 아예 없는 것보다 낫습니다. 지속 가능한 대체재는
   * 도서관 정보나루 대출 통계입니다(미결 D5).
   *
   * 0은 "판매 실적 없음"이라는 알라딘의 실제 값이고, NULL은 "수확하지 못함"입니다.
   * 둘은 다른 뜻이라 nullable로 둡니다.
   */
  @Column({ type: 'int', nullable: true })
  salesPoint?: number | null;

  @Column({ type: 'text' })
  description: string;

  @Column()
  image: string;

  /**
   * 시맨틱 검색용 임베딩(gemini-embedding-001, 768차원 정규화).
   *
   * 운영에는 처음부터 있었으나 엔티티에 선언이 없어, `derive-ddl.ts`가 이 컬럼을
   * DROP하는 DDL을 뱉는 상태였습니다. 비용과 무료 티어 한계 때문에 일괄 생성만
   * 하고 상시 생성을 두지 않은 값이라 한 번 지우면 되돌리기 어렵습니다.
   *
   * `select: false`인 이유는 도서 조회가 768개 실수를 매번 실어 나르지 않게
   * 하려는 것입니다. `match_books()` RPC는 이 컬럼을 DB 안에서만 읽습니다.
   */
  @Column({ type: 'vector', length: 768, nullable: true, select: false })
  embedding?: string | null;

  @OneToMany(() => UsedBookSale, (sale) => sale.book)
  usedBookSales: UsedBookSale[];

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
