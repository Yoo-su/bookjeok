import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Book } from './book.entity';

/**
 * 도서 실측 판형과 표지 대표색. 독서기록 「독서 키재기」가 책을 쌓는 데 쓴다.
 *
 * 알라딘 Open API 종료(2026-10-30) 전에 전량 수확한 스냅샷이라 갱신하지 않는다.
 * 값이 없는 책은 행이 없고, 조회 시 `estimateBookSize`(core)가 채운다.
 * 추정값은 저장하지 않는다. 실측과 섞이면 나중에 가려낼 수 없다.
 *
 * `books`에 컬럼을 늘리지 않고 떼어 둔 이유는 docs/manual-ddl-log.md 11절.
 */
@Entity({ name: 'book_dimensions' })
export class BookDimension {
  /** 제약 이름은 운영에 손으로 붙인 것과 맞춘다. 다르면 synchronize가 FK를 지우고 다시 만든다 */
  @PrimaryColumn({ primaryKeyConstraintName: 'PK_book_dimensions_isbn' })
  isbn: string;

  /** 기본키가 곧 외래키라 한 책에 한 행뿐이다. OneToOne은 쓸데없는 유니크 제약을 하나 더 만든다 */
  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'isbn',
    foreignKeyConstraintName: 'FK_book_dimensions_isbn',
  })
  book: Book;

  /** mm. 가로·세로가 뒤바뀐 원본은 수확 때 큰 값을 height로 맞췄다 */
  @Column({ type: 'smallint', nullable: true })
  width?: number | null;

  @Column({ type: 'smallint', nullable: true })
  height?: number | null;

  @Column({ type: 'smallint', nullable: true })
  depth?: number | null;

  @Column({ type: 'smallint', nullable: true })
  pages?: number | null;

  /** g */
  @Column({ type: 'smallint', nullable: true })
  weight?: number | null;

  /** 알라딘 styleDesc (양장본·반양장본 등) */
  @Column({ type: 'varchar', length: 20, nullable: true })
  binding?: string | null;

  /** 표지 대표색 #rrggbb */
  @Column({ type: 'varchar', length: 7, nullable: true })
  coverColor?: string | null;
}
