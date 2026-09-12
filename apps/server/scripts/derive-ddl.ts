/**
 * 운영에 나갈 DDL을 추측하지 않고 뽑아내는 스크립트.
 *
 * `docs/manual-ddl-log.md`에 적힌 절차를 실행 가능한 형태로 옮긴 것입니다.
 * 운영 DB는 `synchronize: false`이므로 사람이 SQL을 직접 돌려야 하는데,
 * 손으로 쓴 DDL은 인덱스 이름이나 제약 이름이 TypeORM이 만드는 것과
 * 어긋나기 쉽습니다. 그래서 "운영과 같은 형태"로 되돌린 사본 DB를 향해
 * TypeORM이 직접 계산한 upQueries를 받아 씁니다.
 *
 * 사용법:
 *   1. 운영과 같은 스키마 상태의 빈 DB를 하나 준비한다
 *      (예: 로컬 postgres에 `bookjeok_ddl` 생성 후 운영 덤프의 스키마만 복원)
 *   2. DDL_TARGET_DATABASE_URL 을 그 DB로 지정해 실행한다
 *
 *   DDL_TARGET_DATABASE_URL=postgres://user:pass@localhost:5432/bookjeok_ddl \
 *     pnpm --filter @bookjeok/server exec ts-node -r tsconfig-paths/register scripts/derive-ddl.ts
 *
 * 출력된 SQL이 곧 운영에 필요한 DDL 전부입니다. 실행 후 반드시
 * `docs/manual-ddl-log.md`에 남기세요.
 */
import 'reflect-metadata';

import { DataSource } from 'typeorm';

const url =
  process.env.DDL_TARGET_DATABASE_URL ?? process.env.DATABASE_URL ?? '';

if (!url) {
  console.error(
    'DDL_TARGET_DATABASE_URL(또는 DATABASE_URL)이 필요합니다.\n' +
      '운영 DB가 아니라 "운영과 같은 형태로 되돌린 사본"을 가리켜야 합니다.',
  );
  process.exit(1);
}

/**
 * TypeORM 데코레이터로 표현할 수 없어 운영에만 존재하는 객체들.
 * 스크립트는 엔티티에 없다는 이유로 이들을 지우자고 하는데, 전부 오탐입니다.
 */
const DB_ONLY_OBJECTS = [
  // pg_trgm GIN. 연산자 클래스를 데코레이터로 지정할 수 없음 (manual-ddl-log.md 4절)
  'IDX_books_title_trgm',
  'IDX_books_author_trgm',
  'IDX_books_publisher_trgm',
  // ll_to_earth() 표현식 인덱스 (manual-ddl-log.md 8절)
  'used_book_sales_location_idx',
];

/**
 * 되돌릴 수 없거나 되돌리기 비싼 DDL인지 판정합니다.
 * 컬럼·테이블 삭제와 위 DB 전용 객체의 삭제를 걸러냅니다.
 */
function isDestructive(query: string): boolean {
  const q = query.toUpperCase();

  if (q.includes('DROP COLUMN') || q.includes('DROP TABLE')) {
    return true;
  }

  return DB_ONLY_OBJECTS.some(
    (name) => q.includes('DROP INDEX') && query.includes(name),
  );
}

async function main(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    url,
    synchronize: false,
    // 엔티티를 전부 읽어 현재 코드가 기대하는 스키마를 계산한다.
    entities: ['src/**/*.entity.ts'],
  });

  await dataSource.initialize();

  try {
    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

    if (sqlInMemory.upQueries.length === 0) {
      console.log('-- 적용할 DDL이 없습니다. 스키마가 이미 최신입니다.');
      return;
    }

    const destructive = sqlInMemory.upQueries.filter((q) =>
      isDestructive(q.query),
    );
    const safe = sqlInMemory.upQueries.filter((q) => !isDestructive(q.query));

    if (safe.length > 0) {
      console.log('-- 운영에 적용할 DDL (위에서부터 순서대로)');
      console.log('BEGIN;');
      for (const query of safe) {
        console.log(`${query.query};`);
      }
      console.log('COMMIT;');
    }

    if (destructive.length > 0) {
      console.log('\n-- ====================================================');
      console.log(
        '-- 파괴적 DDL: 위 블록에서 제외했습니다. 그대로 돌리지 마세요.',
      );
      console.log('-- ====================================================');
      for (const query of destructive) {
        console.log(`-- ${query.query};`);
      }
      console.error(
        '\n파괴적 DDL이 감지되어 본 블록에서 제외했습니다.\n' +
          '엔티티에 선언이 빠진 컬럼·인덱스를 스크립트가 "없어야 할 것"으로 보고\n' +
          '지우자고 하는 경우가 대부분입니다. 아래를 먼저 확인하세요.\n' +
          '  1. 정말 없애려던 것인가? 아니면 엔티티 선언이 빠진 것인가?\n' +
          '  2. 데이터가 들어 있는가? 다시 채울 수 있는가?\n' +
          '  3. docs/manual-ddl-log.md에 그 객체의 이력이 있는가?\n' +
          '의도한 삭제라면 손으로 옮겨 적어 실행하고 반드시 로그를 남기세요.',
      );
      process.exitCode = 1;
    }

    console.log('\n-- 되돌릴 때 (downQueries, 역순)');
    for (const query of [...sqlInMemory.downQueries].reverse()) {
      console.log(`-- ${query.query};`);
    }
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
