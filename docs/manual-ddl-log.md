# 운영 DDL 수동 적용 이력

**운영 DB(Supabase)에 사람이 직접 실행한 DDL의 유일한 기록입니다.**
운영에 SQL을 직접 돌렸다면 반드시 여기에 남기세요. 안 남기면 다음 사람은
스키마가 왜 그 모양인지 알아낼 방법이 없습니다.

## 왜 수동 반영인가

`apps/server/src/app/app.module.ts`의 TypeORM 설정은 `synchronize`를 **운영에서만 끕니다.**

```ts
synchronize: configService.get<string>('NODE_ENV') !== 'production',
```

마이그레이션 도구도, `migrations/` 디렉터리도, TypeORM CLI 설정도 없습니다.
그래서 개발 환경은 엔티티 변경이 자동 반영되지만 **운영은 사람이 SQL을 직접 돌려야 합니다.**

### 운영에 나갈 DDL을 추측하지 않고 뽑는 방법

1. 로컬 DB 스키마를 다른 DB로 복제
2. 그 사본을 "운영과 같은 형태"로 되돌림 (이번 변경으로 생길 것들을 제거)
3. 그 사본을 향해 `dataSource.driver.createSchemaBuilder().log()` 실행
4. 나온 `upQueries`가 곧 운영에 필요한 DDL 전부

워터마크 전환 때 실제로 쓴 방법입니다. "이것 말고는 없다"를 추측이 아니라
증명할 수 있습니다.

이 절차는 `apps/server/scripts/derive-ddl.ts`로 실행할 수 있습니다.

```bash
DDL_TARGET_DATABASE_URL=postgres://user:pass@localhost:5432/bookjeok_ddl   pnpm --filter @bookjeok/server exec ts-node -r tsconfig-paths/register scripts/derive-ddl.ts
```

## 적용 이력

| 날짜       | 내용                                                                           | 관련 커밋               |
| ---------- | ------------------------------------------------------------------------------ | ----------------------- |
| 2026-09-02 | 채팅 테이블 인덱스 5개 추가                                                    | `e0eed214`              |
| 2026-09-02 | 읽음 워터마크 컬럼 추가·백필, `read_receipts` 드롭                             | `778ef588`              |
| 2026-09-05 | 거래 완료(`trade_completions`) 도입, `trade_reviews` 재구성                    | `f34ba26b` ~ `390b4fcc` |
| 2026-09-07 | `books` 검색용 pg_trgm GIN 인덱스 3개 추가                                     | (미커밋)                |
| 2026-09-08 | `books.pubDate` 컬럼 추가 (출간일)                                             | `026abfd5`              |
| 2026-09-09 | 위 컬럼 값 채움 + `books.discount` 판매가 → 정가 (DDL 아님, 데이터 반영)       | (스크립트)              |
| 2026-09-09 | `books.salesPoint` 컬럼 추가 (알라딘 판매지수)                                 | (미커밋)                |
| 2026-09-09 | `reading_logs.isbn` 외래키 추가 (누락돼 있던 제약)                             | (미커밋)                |
| 2026-09-12 | 인덱스 정리 (제거 4·교체 3·외래키 16 추가·유니크 이름 2 변경) + 고아 enum 드롭 | (미커밋)                |

현재 운영에 남아 있는 채팅 인덱스는 **4개**입니다
(`idx_read_receipts_message`는 테이블과 함께 사라졌습니다).

---

## 1. 채팅 테이블 인덱스 5개 (2026-09-02)

### 배경

채팅 테이블에는 인덱스가 하나도 없었습니다. PostgreSQL은 외래 키 컬럼에 인덱스를
자동으로 만들지 않으므로 `chatRoomId`, `senderId`, `messageId` 모두 인덱스가 없는 상태였고,
아래 쿼리들이 전부 테이블 전체를 훑고 있었습니다.

| 쿼리                                 | 위치                                                      |
| ------------------------------------ | --------------------------------------------------------- |
| 방별 마지막 메시지 (`DISTINCT ON`)   | `ChatService.getChatRooms`                                |
| 방별 안 읽음 개수 집계               | `ChatService.getChatRooms`, `markMessagesAsRead`          |
| 메시지 커서 페이지네이션             | `ChatService.getChatMessages`                             |
| 메시지 전송 시 상대방 참여 상태 확인 | `ChatService.saveMessage`                                 |
| 판매글 단위 방 조회                  | `ChatService.resolveChatRoom`, `notifyOtherBuyersTrading` |

`chat_participants`와 `read_receipts`에는 `@Unique`가 만든 인덱스가 있지만
각각 `(userId, chatRoomId)`, `(userId, messageId)` 순서라 **선행 컬럼이 userId**입니다.
방 기준·메시지 기준 조회는 그 인덱스를 쓸 수 없어 아래 인덱스를 따로 추가합니다.

> 아래에 나오는 `read_receipts`는 지금은 없는 테이블입니다. 당시 기록 그대로 둡니다.
> 읽음 처리가 워터마크로 바뀌면서 테이블과 인덱스를 함께 드롭했습니다(아래 "이후 변경").

### 실행한 SQL

인덱스 이름은 엔티티의 `@Index('...')`에 지정한 이름과 같습니다.
이름과 컬럼이 일치하므로 개발 환경의 `synchronize`가 이 인덱스를 다시 만들거나 지우지 않습니다.

```sql
-- 서비스 중단 없이 만들기 위해 CONCURRENTLY를 사용합니다.
-- CONCURRENTLY는 트랜잭션 블록 안에서 실행할 수 없으니 한 줄씩 실행하세요.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_messages_room_created_at"
  ON "chat_messages" ("chatRoomId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_messages_room_sender"
  ON "chat_messages" ("chatRoomId", "senderId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_read_receipts_message"
  ON "read_receipts" ("messageId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_participants_room"
  ON "chat_participants" ("chatRoomId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_rooms_used_book_sale"
  ON "chat_rooms" ("usedBookSaleId");
```

`CONCURRENTLY`가 실패하면 인덱스가 `INVALID` 상태로 남습니다.
아래로 확인하고, 무효한 인덱스는 지운 뒤 다시 실행하세요.

```sql
SELECT c.relname, i.indisvalid
FROM pg_class c
JOIN pg_index i ON i.indexrelid = c.oid
WHERE c.relname LIKE 'idx_chat%' OR c.relname LIKE 'idx_read_receipts%';
```

### 확인

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN ('chat_messages', 'read_receipts', 'chat_participants', 'chat_rooms')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

당시에는 5개 행이 나왔습니다. 지금은 아래 이유로 **4개 행**이 정상입니다.

## 2. 읽음 워터마크 전환 (2026-09-02)

읽음 처리가 `chat_participants.lastReadMessageId` 워터마크로 바뀌면서
`read_receipts` 테이블을 드롭했습니다. `idx_read_receipts_message`도 함께 사라졌고,
남은 인덱스는 4개입니다.

### 실행한 SQL

아래 순서 그대로 실행했습니다.

```sql
-- 1) 컬럼 추가 (코드 배포 전. 구버전 코드는 이 컬럼을 모르므로 무해)
ALTER TABLE chat_participants
  ADD COLUMN IF NOT EXISTS "lastReadMessageId" integer;

-- 2) 백필: 영수증의 방별 최대 메시지 ID가 곧 워터마크
--    GREATEST를 쓰면 여러 번 돌려도 워터마크가 뒤로 가지 않습니다.
UPDATE chat_participants cp
SET "lastReadMessageId" = GREATEST(COALESCE(cp."lastReadMessageId", 0), sub.watermark)
FROM (
  SELECT r."userId", m."chatRoomId", MAX(m.id) AS watermark
  FROM read_receipts r
  JOIN chat_messages m ON m.id = r."messageId"
  GROUP BY r."userId", m."chatRoomId"
) sub
WHERE cp."userId" = sub."userId" AND cp."chatRoomId" = sub."chatRoomId";

-- 3) 코드 배포 후, 관찰을 거쳐 정리
DROP TABLE read_receipts;
```

백필 전에 "읽음 집합에 구멍이 없는지"를 먼저 확인했고(운영 결과 0),
백필 후에는 두 방식의 안 읽음 개수가 모든 참여자에 대해 일치하는지 검증했습니다
(결과 0). 검증 쿼리는 `perf(server): 읽음 처리를 참여자 워터마크로 전환` 커밋을
되짚을 일이 있을 때 그 시점 문서(`docs/chat-read-watermark-plan.md`, 전환 완료 후 삭제)
이력에서 찾을 수 있습니다.

워터마크는 인덱스를 두지 않았습니다. 이 컬럼은 항상 `(userId, chatRoomId)`로 찾은
행에서 읽고 쓰기만 하고 — 그 조합은 `@Unique`가 만든 인덱스가 커버합니다 —
조건으로 거는 쪽은 언제나 `chat_messages.id`입니다.

설계 설명은 `apps/server/src/features/chat/README.md`의 "4. 읽음 처리: 워터마크"에 있습니다.

---

## 3. 거래 완료(`trade_completions`) 도입과 `trade_reviews` 재구성 (2026-09-05)

> **명명 규칙**: 운영 스키마는 손으로 붙인 이름(`IDX_{테이블}_{컬럼}`, `UQ_`, `PK_`,
> `FK_`, 컬럼은 camelCase 유지)을 씁니다. 아래 DDL도 그 규칙을 따르고, 인덱스·유니크
> 이름은 엔티티 데코레이터에도 같은 값으로 박아두어 개발(`synchronize`)과 어긋나지
> 않게 했습니다. PK·FK 이름은 TypeORM 데코레이터로 지정할 수 없어 개발 환경과는
> 다를 수 있습니다(기존 테이블도 이미 그런 상태입니다).
>
> **2026-09-05 운영 DB(Supabase)에 적용 완료되었습니다.**
> 엔티티 정의 및 derive-ddl.ts 결과를 대조하여 아래 순서대로 실행되었습니다.

### 배경

거래 후기가 `orders`에 1:1로 매달려 있어서, 결제를 거치지 않는 직거래에서는
후기를 남길 수 없었습니다. 결제(`Order`)는 거래의 한 가지 수단일 뿐인데 후기와
신뢰 지표가 거기에만 붙어 있던 게 원인입니다.

"거래가 성사됐다"는 사실을 `trade_completions`로 분리하고, 후기는 그쪽에 붙입니다.
결제 거래도 구매확정 시점에 완료 기록을 하나 만들므로 두 경로가 하나로 합쳐집니다.

### 사전 확인

`trade_reviews`와 `orders`가 **비어 있어야** 아래 절차를 그대로 쓸 수 있습니다
(결제 기능이 봉인되어 있어 운영 데이터가 없는 상태를 전제로 합니다).

```sql
SELECT 'trade_reviews' AS table_name, COUNT(*) AS rows FROM trade_reviews
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;
```

둘 다 0이 아니면 `trade_reviews`를 드롭하지 말고 마이그레이션 계획을 다시 세우세요.

> **개발 DB 주의.** 개발 환경은 `synchronize: true`라 엔티티의
> `UQ_trade_completions_saleId`를 자동으로 만들려 합니다. 판매글당 완료 기록이
> 2건 이상 쌓여 있으면 제약 생성이 실패해 서버가 뜨지 않습니다. 아래로 확인하고
> 중복이 있으면 오래된 행을 지운 뒤 띄우세요.
>
> ```sql
> SELECT "saleId", COUNT(*) FROM trade_completions GROUP BY 1 HAVING COUNT(*) > 1;
> ```

### 적용 체크리스트

1. **위 사전 확인 쿼리를 돌려 두 값이 모두 0인지 확인한다.**
2. `derive-ddl.ts`로 DDL을 뽑아 아래 SQL과 대조하고, 차이가 있으면 **스크립트 결과를 따른다.**
   다만 `DROP COLUMN`·`DROP TABLE`은 예외다. 엔티티에 선언이 빠진 것을 스크립트가
   "없어야 할 것"으로 보고 지우자고 하는 경우가 있다(8절 참고). 지금은 스크립트가
   그런 구문을 본 블록에서 빼고 경고와 함께 따로 보여준다.
3. 0단계(알림 enum 값 추가)를 먼저 실행한다.
4. 1단계 SQL을 한 트랜잭션으로 실행한다.
5. 서버를 배포한다. (코드가 먼저 나가면 `trade_completions`가 없어 500이 난다 —
   반드시 **DDL → 배포** 순서)
6. 판매글 하나로 직거래 예약 → 완료 → 후기까지 한 바퀴 돌려본다.
7. 이 문서의 이력 표에서 이 항목의 날짜와 커밋을 채운다.

#### 0단계 — 알림 enum 값 추가 (트랜잭션 밖에서 먼저)

`notifications.type`은 Postgres enum이라 값을 늘리려면 `ALTER TYPE`이 필요합니다.
`ADD VALUE`는 추가한 값을 **같은 트랜잭션 안에서 쓸 수 없으므로** 아래 두 줄은
본 트랜잭션과 분리해 먼저 실행합니다.

```sql
ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'TRADE_RESERVED';
ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'TRADE_COMPLETED';
```

> **타입 이름이 테이블 이름과 다릅니다.** 테이블은 `notifications`(복수)인데 enum은
> `notification_type_enum`(단수)입니다. Postgres는 테이블 이름을 바꿔도 enum 타입
> 이름을 따라 바꾸지 않기 때문입니다. 같은 흔적으로 `used_book_posts_status_enum`이
> 쓰이지 않는 채 남아 있습니다(`used_book_posts` → `used_book_sales` 개명).
>
> **그래서 enum 이름은 추측하지 말고 항상 조회해서 확인하세요.**

```sql
SELECT n.nspname AS schema,
       t.typname AS enum_type,
       string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS values
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY 1, 2
ORDER BY 2;
```

#### 1단계 — 본 DDL

```sql
BEGIN;

-- 1) 예약 상대. 예약중은 다른 구매희망자에게 보내는 신호이므로
--    "누구와 예약했는지"가 남아야 다른 채팅방에 안내를 띄울 수 있다.
ALTER TABLE used_book_sales
  ADD COLUMN IF NOT EXISTS "reservedForUserId" integer;

ALTER TABLE used_book_sales
  ADD CONSTRAINT "FK_used_book_sales_reservedForUserId"
  FOREIGN KEY ("reservedForUserId") REFERENCES users(id) ON DELETE SET NULL;

-- 2) 거래 완료 기록
--    새로 만드는 테이블이라 TypeORM 규칙({테이블}_{컬럼}_enum)과 이름이 일치한다.
--    개명 이력이 있는 기존 테이블과 달리 여기서는 추측이 아니다.
CREATE TYPE "trade_completions_method_enum" AS ENUM ('DIRECT', 'DELIVERY');

CREATE TABLE trade_completions (
  id            SERIAL,
  "saleId"      integer NOT NULL REFERENCES used_book_sales(id) ON DELETE CASCADE,
  "sellerId"    integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "buyerId"     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "chatRoomId"  integer NULL REFERENCES chat_rooms(id) ON DELETE SET NULL,
  method        "trade_completions_method_enum" NOT NULL DEFAULT 'DIRECT',
  "orderId"     varchar NULL,
  "completedAt" timestamptz NOT NULL,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_trade_completions_id" PRIMARY KEY (id),
  CONSTRAINT "UQ_trade_completions_orderId" UNIQUE ("orderId"),
  CONSTRAINT "UQ_trade_completions_saleId" UNIQUE ("saleId")
);

-- 신뢰 지표는 사용자별 완료 건수를 세므로 두 방향 모두 인덱스가 필요하다.
CREATE INDEX "IDX_trade_completions_sellerId_completedAt"
  ON trade_completions ("sellerId", "completedAt");
CREATE INDEX "IDX_trade_completions_buyerId_completedAt"
  ON trade_completions ("buyerId", "completedAt");

-- 3) 후기를 주문이 아니라 완료 기록에 매단다.
--    비어 있는 테이블이므로 재생성이 가장 깔끔하다.
DROP TABLE trade_reviews;

CREATE TABLE trade_reviews (
  id             SERIAL,
  "completionId" integer NOT NULL REFERENCES trade_completions(id) ON DELETE CASCADE,
  "reviewerId"   integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "targetUserId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags           text NOT NULL,
  content        text NULL,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_trade_reviews_id" PRIMARY KEY (id),
  -- 한 거래당 양쪽이 각각 한 건씩
  CONSTRAINT "UQ_trade_reviews_completionId_reviewerId"
    UNIQUE ("completionId", "reviewerId")
);

-- 드롭 전과 같은 이름으로 다시 만든다.
CREATE INDEX "IDX_trade_reviews_targetUserId_createdAt"
  ON trade_reviews ("targetUserId", "createdAt");

COMMIT;
```

### 되돌리기

```sql
BEGIN;
DROP TABLE IF EXISTS trade_reviews;
DROP TABLE IF EXISTS trade_completions;
DROP TYPE IF EXISTS "trade_completions_method_enum";
ALTER TABLE used_book_sales DROP CONSTRAINT IF EXISTS "FK_used_book_sales_reservedForUserId";
ALTER TABLE used_book_sales DROP COLUMN IF EXISTS "reservedForUserId";
COMMIT;
```

되돌리면 후기 데이터가 사라집니다. 배포 후 후기가 쌓이기 시작했다면
이 스크립트를 그대로 쓰지 마세요.

`notifications_type_enum`에 추가한 값은 되돌리지 않습니다. Postgres는 enum 값
삭제를 지원하지 않고, 남아 있어도 쓰지 않으면 해가 없습니다.

설계 설명은 `apps/server/src/features/trade/README.md`에 있습니다.

---

## 4. `books` 검색용 pg_trgm GIN 인덱스 3개 (2026-09-07)

### 배경

알라딘 Open API 종료(2026-10-30)에 대비해 도서 검색을 자체 DB로 옮기는 작업입니다
(`docs/book-data-migration-plan.md` Phase 3). `books`에는 PK(`isbn`) 말고 인덱스가
없어서 `LocalDbBookCatalogProvider.search()`의 `ILIKE '%query%'`가 58,550행
전체(274MB)를 매번 훑고 있었습니다.

### 사전 측정

`apps/server/scripts/measure-book-search.ts`(읽기 전용)로 실측했습니다.
검색어는 `search_keywords`의 실제 사용자 검색어를 썼습니다.

| 항목                  | 값                         |
| --------------------- | -------------------------- |
| 도서 수 / 테이블 크기 | 58,550행 / 274MB           |
| 기존 인덱스           | PK 하나 (1,816kB)          |
| `pg_trgm`             | **1.6 설치돼 있음**        |
| `pgroonga`            | 3.2.5 사용 가능하나 미설치 |
| 2글자 이하 검색 비중  | **8.3%** (217건 중 18건)   |

`pgroonga` 대신 `pg_trgm`을 고른 이유는 두 가지입니다. 이미 설치돼 있어 확장
도입 결정이 필요 없고, `pg_trgm`의 약점(2글자 부분일치는 패턴에서 트라이그램을
뽑을 수 없어 인덱스가 걸리지 않음)이 닿는 범위가 8.3%뿐이었습니다. 그 8.3%는
느려지지 않고 그대로 남으므로 손해 보는 검색이 없습니다.

### 실행한 SQL

```sql
BEGIN;

CREATE INDEX "IDX_books_title_trgm"     ON books USING gin (title     gin_trgm_ops);
CREATE INDEX "IDX_books_author_trgm"    ON books USING gin (author    gin_trgm_ops);
CREATE INDEX "IDX_books_publisher_trgm" ON books USING gin (publisher gin_trgm_ops);

COMMIT;
```

```sql
ANALYZE books;
```

`publisher`까지 거는 이유는 어댑터가 통합 검색(`Keyword`)에서 제목·저자·출판사
셋을 함께 보기 때문입니다. 58,550행이라 몇 초 만에 끝나고, 그동안 `books` 쓰기가
잠깁니다. 이 테이블 쓰기는 하루 100건 수준이라 영향이 없습니다.

### 확인

```sql
SELECT c.relname AS index_name,
       pg_size_pretty(pg_relation_size(c.oid)) AS size
FROM pg_class c
JOIN pg_index i ON i.indexrelid = c.oid
JOIN pg_class t ON t.oid = i.indrelid
WHERE t.relname = 'books'
ORDER BY pg_relation_size(c.oid) DESC;
```

> `pg_indexes`의 `indexname`을 `::regclass`로 바로 캐스팅하면 안 됩니다.
> 따옴표 없는 식별자로 파싱되면서 대문자가 소문자로 접혀
> `relation "idx_books_title_trgm" does not exist`가 납니다. 위처럼 `pg_class`의
> OID로 재세요.

PK 포함 4개 행이 나오면 정상입니다. 인덱스 총량은 1,816kB에서 **24MB**가 됐습니다.

### 결과

같은 측정 스크립트를 다시 돌린 값입니다.

| 구간               | 목록(전 → 후)       | 카운트(전 → 후)     | 체감(전 → 후)    |
| ------------------ | ------------------- | ------------------- | ---------------- |
| 3글자 이상 (91.7%) | 158.5ms → **0.1ms** | 236.5ms → **0.2ms** | 628ms → **29ms** |
| 2글자 이하 (8.3%)  | 152.0ms → 149.8ms   | 225.2ms → 228.0ms   | 변화 없음        |

실행 계획이 `Seq Scan`에서 `Bitmap Heap Scan + Bitmap Index Scan`으로 바뀌었습니다.
2글자 검색이 `Seq Scan`으로 남는 것은 `pg_trgm`의 알려진 한계이며 예상된 결과입니다.

### 되돌리기

```sql
DROP INDEX IF EXISTS "IDX_books_title_trgm";
DROP INDEX IF EXISTS "IDX_books_author_trgm";
DROP INDEX IF EXISTS "IDX_books_publisher_trgm";
```

인덱스만 지우는 것이라 데이터 손실이 없습니다. 되돌리면 검색이 다시 풀스캔으로
돌아갈 뿐입니다.

## 5. `books.pubDate` 컬럼 추가 (2026-09-08)

### 배경

최초 스키마를 네이버 책 검색 API 기준으로 만들면서 출간일 필드가 빠졌습니다.
그래서 `LocalDbBookCatalogProvider.search()`가 출간일순 정렬을 구현하지 못하고
있었습니다. `createdAt`은 우리가 적재한 시각이라 대신 쓸 수 없습니다.

알라딘 API가 2026-10-30에 종료되므로 **출간일을 받아올 수 있는 마지막 기회**라,
정가 수확(아래)과 함께 전량을 걷어오기로 하고 컬럼을 먼저 추가했습니다.

같은 순회에서 `discount`의 의미도 바꿉니다. 지금은 알라딘 *판매가*가 들어 있는데
벤더 프로모션이라 갱신이 끊기면 썩습니다. **정가**는 판(edition)의 속성이라
갱신이 필요 없습니다. 중고 판매글의 "N% OFF"도 정가 기준이 맞습니다.

### 적용한 DDL

```sql
ALTER TABLE books ADD COLUMN "pubDate" date;
```

nullable 컬럼 추가는 Postgres에서 테이블 재작성이 없는 메타데이터 변경이라
운영 중에 적용해도 락이 걸리지 않습니다.

`date`를 쓴 이유는 알라딘 `pubDate`가 날짜 단위(`2024-03-15`)이고 시간대 개념이
없기 때문입니다. `timestamptz`로 두면 없는 정밀도를 흉내내게 됩니다.

nullable인 이유는 공급처가 주지 않는 도서가 있고, 알라딘에 아예 없는 도서
(Cloudinary 잔재 1,235건 등)는 영영 채울 수 없기 때문입니다.

> **이 문서의 다른 항목과 달리 `derive-ddl.ts`로 뽑지 않고 손으로 썼습니다.**
> 그 스크립트는 운영과 같은 스키마의 로컬 DB가 필요한데 작업 머신에 로컬
> Postgres가 없습니다. 이번 건은 인덱스도 제약도 없는 nullable 컬럼 하나라
> TypeORM이 만들 이름과 어긋날 여지가 없어 예외로 두었습니다. **제약이나
> 인덱스가 붙는 DDL에는 이 예외를 적용하지 마세요.**

### 엔티티

```ts
@Column({ type: 'date', nullable: true })
pubDate?: Date | null;
```

옵셔널(`?`)로 선언한 이유는 `findPopularBooks()`처럼 raw 결과를 `Book[]`로
캐스팅하는 코드가 있어서입니다. 필수로 두면 그 지점들이 전부 타입 에러가 납니다.

### 배포 순서 주의

**DDL을 배포보다 먼저 적용해야 합니다.** 엔티티에 컬럼이 있는데 DB에 없으면
TypeORM이 만드는 SELECT에 `"pubDate"`가 들어가 도서 조회가 전부 실패합니다
(`column does not exist`). `synchronize: false`라 자동 생성되지도 않습니다.

### 값 채우기 — **2026-09-09 완료**

`~/bookjeok-migration/scripts/harvest-aladin.mjs`가 알라딘에서 정가·출간일·결측
설명을 수확하고, `apply-harvest.mjs`가 반영합니다. 반영은 기본이 dry-run이며
`--apply`를 붙였을 때만 씁니다.

수확은 2026-09-08(58,707건 조회), 반영은 2026-09-09에 끝났습니다.
**57,183행 갱신 / 12.5분**, `pubDate` 커버리지 **99.5%**(57,182 / 57,458).
같은 순회에서 `discount`가 판매가에서 **정가**로 바뀌었습니다(55,318행).
상세 수치와 검증 내역은 `docs/book-data-migration-plan.md` 7-f에 있습니다.

### 되돌리기

```sql
ALTER TABLE books DROP COLUMN "pubDate";
```

**값을 채운 뒤이므로 이 DDL은 이제 데이터 손실입니다.** 알라딘 종료 이후에는
출간일을 다시 받을 방법이 없습니다. 컬럼을 지우지 말고, 값만 비우려면
`UPDATE books SET "pubDate" = NULL`을 쓰세요.

`discount`를 판매가로 되돌리려면 `~/bookjeok-migration/data/harvest.jsonl`의 각 줄에
반영 전 값이 `dbDiscount`로 보존돼 있습니다.

## 6. `books.salesPoint` 컬럼 추가 (2026-09-09)

### 배경

자체 DB 검색으로 전환한 뒤 "키워드는 맞는데 스테디셀러가 안 나온다"는 문제가
있었습니다. 원인을 실측했더니 랭킹 알고리즘이 아니라 **인기도 신호의 부재**였습니다.

검색 정렬은 `관련도 버킷 → viewCount DESC → isbn`인데, 흔한 키워드는 대부분 한
버킷에 뭉치므로("사랑" 제목 부분일치만 791건) **`viewCount`가 사실상 체감 순서를
결정**하고 있었습니다. 그런데 그 값은 신호가 아닙니다.

| 항목                  | 값                                                                  |
| --------------------- | ------------------------------------------------------------------- |
| `viewCount` 0인 도서  | **43,001 / 56,836 (75.7%)**                                         |
| 평균 · 최대           | 0.60 · 381                                                          |
| 참여 신호가 있는 도서 | 독서기록 37 · 위시리스트 32 · 리뷰 71 · 판매글 27 (**전체의 0.1%**) |

값이 있는 것도 대부분 크롤러가 연관도서 링크를 타고 다닌 흔적입니다
(`book-data-migration-plan.md` 7-b에서 규명한 경로). 참여 신호로 보정하는 것도
0.1%에만 닿아 불가능했습니다.

"사랑" 접두일치 251건을 전량 조회해 대조한 결과는 아래와 같습니다.
**현재 랭킹이 인기도와 음의 상관**이었습니다.

| 현재 상위                  | 판매지수 |     | 판매지수 상위                    | 조회수 |
| -------------------------- | -------- | --- | -------------------------------- | ------ |
| 사랑이 있는 곳에 신이 있다 | 30       |     | 사랑해 사랑해 사랑해             | 1      |
| 사랑의 메신저              | 27       |     | 사랑의 기술 (에리히 프롬)        | 1      |
| 사랑에 관하여              | 121      |     | 사랑을 무게로 안 느끼게 (박완서) | 0      |

알라딘 `ItemLookUp`이 `salesPoint`를 주고 **2026-10-30 이후에는 받을 수 없으므로**,
정가·출간일과 같은 이유로 지금 컬럼을 만들고 수확했습니다.

### 적용한 DDL

```sql
ALTER TABLE books ADD COLUMN "salesPoint" integer;
```

`pubDate`와 같이 nullable 컬럼 추가라 테이블 재작성이 없는 메타데이터 변경입니다.
운영 중에 적용해도 락이 걸리지 않습니다.

**nullable인 이유가 pubDate와 다릅니다.** `0`은 "판매 실적 없음"이라는 알라딘의
**실제 값**이고, `NULL`은 "수확하지 못함"입니다. 둘은 뜻이 달라 구분해야 합니다.
검색 정렬에서 `NULLS LAST`로 미수확분만 뒤로 보냅니다.

> `pubDate`와 마찬가지로 `derive-ddl.ts`를 쓰지 않고 손으로 썼습니다. 제약도
> 인덱스도 없는 nullable 컬럼 하나라 TypeORM이 만들 이름과 어긋날 여지가
> 없습니다. **제약이나 인덱스가 붙는 DDL에는 이 예외를 적용하지 마세요.**

### 엔티티

```ts
@Column({ type: 'int', nullable: true })
salesPoint?: number | null;
```

`pubDate`와 같은 이유로 옵셔널입니다. `findPopularBooks()`가 raw 결과를 `Book[]`로
캐스팅하고 있어 필수로 두면 그 지점이 타입 에러가 납니다.

### 배포 순서 주의

**DDL을 배포보다 먼저 적용해야 합니다.** 엔티티에 컬럼이 있는데 DB에 없으면
TypeORM이 만드는 SELECT에 `"salesPoint"`가 들어가 도서 조회가 전부 실패합니다.
2026-09-09에 DDL을 먼저 적용했습니다.

### 값 채우기

`~/bookjeok-migration/scripts/harvest-aladin.mjs`가 `salesPoint`·`customerReviewRank`·
`categoryName`을 함께 수확하고, `apply-harvest.mjs`가 `salesPoint`만 DB에
반영합니다. 나머지 둘은 지금 쓸 데가 없지만 **재수확이 불가능하므로** 수확
JSONL에는 남겨 둡니다. 나중에 필요해지면 재조회 없이 그 파일에서 채우면 됩니다.

### 되돌리기

```sql
ALTER TABLE books DROP COLUMN "salesPoint";
```

**알라딘 종료 이후에는 다시 받을 수 없습니다.** 컬럼을 지우지 말고, 값만 비우려면
`UPDATE books SET "salesPoint" = NULL`을 쓰세요. 수확 JSONL
(`~/bookjeok-migration/data/harvest-v2/harvest.jsonl`)에서 언제든 다시 채울 수 있습니다.

## 7. `reading_logs.isbn` 외래키 추가 (2026-09-09)

### 배경

`books`를 참조하는 컬럼 다섯 중 **`reading_logs`만 외래키가 없었습니다.**

| 테이블              | isbn NULL 허용 | 삭제 규칙       |
| ------------------- | -------------- | --------------- |
| `ai_book_summaries` | NO             | CASCADE         |
| `reviews`           | YES            | NO ACTION       |
| `used_book_sales`   | YES            | SET NULL        |
| `wishlists`         | YES            | CASCADE         |
| **`reading_logs`**  | **NO**         | **제약 없음** ← |

엔티티는 `onDelete: 'SET NULL'`로 선언돼 있었는데 `isbn` 컬럼이 NOT NULL이라
**성립할 수 없는 조합**이었습니다. 운영에 제약이 아예 없어서 그 모순이 드러나지
않고 있었습니다.

2026-09-09에 표지 없는 도서 622건을 지울 때 참조 여부를 **사람이 손으로 세서**
확인해야 했습니다. 제약이 있었으면 DB가 막아줬을 일입니다.

### 삭제 규칙을 NO ACTION으로 정한 이유

독서기록은 사용자가 직접 남긴 기록이라 도서 행이 사라진다고 조용히 끊기거나
사라지면 안 됩니다. `reviews`와 같은 규칙이며, `isbn`을 NOT NULL로 둔 현재
설계와도 모순이 없습니다.

`SET NULL`로 가려면 컬럼을 nullable로 바꾸는 DDL이 추가로 필요하고, `book`
관계가 `eager: true`라 서버·웹 양쪽에 null 처리를 넣어야 합니다. 얻는 것에 비해
작업이 큽니다.

### 적용한 DDL

```sql
-- 고아 행이 있으면 실패한다. 적용 직전에 0건임을 확인했다(49행 중 0건).
ALTER TABLE reading_logs
  ADD CONSTRAINT "FK_reading_logs_isbn"
  FOREIGN KEY (isbn) REFERENCES books(isbn)
  ON DELETE NO ACTION ON UPDATE NO ACTION
  NOT VALID;

ALTER TABLE reading_logs VALIDATE CONSTRAINT "FK_reading_logs_isbn";
```

`NOT VALID`로 먼저 걸고 검증을 분리한 이유는 `ADD CONSTRAINT`가 참조 대상인
`books`(56,836행)에도 락을 잡기 때문입니다. `reading_logs`가 49행뿐이라 실익은
작지만, **운영 DB에 외래키를 거는 기본 절차로 둡니다.** 큰 테이블에서는 이 차이가
장애와 무장애를 가릅니다.

적용 후 `pg_constraint.convalidated = true`를 확인했습니다.

### 엔티티

```ts
@ManyToOne(() => Book)
@JoinColumn({ name: 'isbn' })
book: Book;
```

`onDelete` 옵션을 제거해 기본값(NO ACTION)이 되게 했습니다. 선언과 운영 스키마가
이제 일치합니다.

> **개발 DB 주의.** 개발 환경은 `synchronize: true`라 이 변경으로 FK를 다시
> 만들려 합니다. `reading_logs`에 `books`에 없는 isbn이 남아 있으면 제약 생성이
> 실패해 서버가 뜨지 않습니다. 아래로 확인하고 정리한 뒤 띄우세요.
>
> ```sql
> SELECT r.isbn FROM reading_logs r
> WHERE NOT EXISTS (SELECT 1 FROM books b WHERE b.isbn = r.isbn);
> ```

### 배포 순서

**DDL이 먼저입니다.** 다만 이번 건은 코드가 먼저 나가도 깨지지 않습니다.
제약은 DB 차원의 방어일 뿐이고 쿼리 모양이 바뀌지 않기 때문입니다.

### 되돌리기

```sql
ALTER TABLE reading_logs DROP CONSTRAINT "FK_reading_logs_isbn";
```

데이터 손실이 없습니다. 되돌리면 도서 삭제 시 독서기록이 다시 조용히 고아가
될 수 있는 상태로 돌아갈 뿐입니다.

---

## 8. 인덱스 정리 (2026-09-12)

> **2026-09-12 운영 DB(Supabase)에 적용 완료되었습니다.**
> 1단계·2단계 모두 성공했고, 적용 후 확인 쿼리가 전부 통과했습니다.
>
> | 확인 항목           | 결과                                             |
> | ------------------- | ------------------------------------------------ |
> | `should_be_gone`    | `[]` — 제거 대상 8개가 모두 사라짐               |
> | `missing`           | `[]` — 생성 대상 21개가 모두 존재                |
> | `invalid`           | `[]` — 무효 인덱스 없음                          |
> | `email_uniques`     | `UQ_97672ac88f789774dd47f7c8be3` 1개만 남음      |
> | `index_count`       | **46** — 엔티티 메타데이터 46개와 일치           |
> | `ai_book_summaries` | `createdAt`·`updatedAt` 모두 `attnotnull = true` |
>
> 마지막에서 두 번째 줄이 이번 작업의 판정 기준입니다. 코드가 기대하는 인덱스
> 집합과 운영의 실제 인덱스 집합이 **개수까지 일치**합니다. 다음에 어긋났는지
> 보려면 같은 두 숫자를 다시 재면 됩니다(재는 법은 아래 「확인」 절).

### 배경

운영 인덱스와 엔티티 선언을 전수 대조했습니다. 계기는 "인덱스가 잘못 잡힌 게
없는지" 점검이었는데, 실제로 나온 것은 **운영과 코드가 서로 모르는 채 각자
자라 있었다**는 사실이었습니다.

`synchronize: false`라 운영은 자동 반영이 없고, 손으로 만든 인덱스는 코드에
남지 않고, 엔티티에서 지운 선언은 운영에 남습니다. 양쪽을 강제로 맞춰주는
장치가 없으니 시간이 지나면 반드시 갈라집니다.

판정 기준을 이렇게 뒀습니다.

- **지운다**: 완전 중복이거나, 쿼리가 원리적으로 쓸 수 없는 모양일 때만.
- **남긴다 + 엔티티에 선언한다**: 그 밖의 "운영에만 있는" 인덱스 전부.

두 번째가 중요합니다. 실제로 쓰이는 인덱스를 "코드에 안 적혀 있다"는 이유로
지우면 손해만 봅니다. `idx_users_nickname`이 그 함정이었습니다. `idx_scan`이
0이라 죽은 인덱스로 보였지만 `findByNickname()`이 닉네임 중복 검사에 쓰고
있었고, 0인 이유는 단지 `users`가 31행이라 순차 스캔이 더 싸서였습니다.

> **`idx_scan = 0`을 "안 쓰임"으로 읽으려면 먼저 통계 초기화 시점을 보세요.**
> `SELECT stats_reset FROM pg_stat_database WHERE datname = current_database();`
> 이번에는 `NULL`(초기화된 적 없음)이라 누적치를 신뢰할 수 있었습니다. 그래도
> 행이 적은 테이블에서는 플래너가 인덱스를 안 고를 뿐이라는 점을 함께 봐야
> 합니다.

### 발견한 것 중 가장 위험했던 것 — `books.embedding`

운영 `books`에는 시맨틱 검색용 `embedding`(`vector(768)`) 컬럼이 있는데
**엔티티에 선언이 없었습니다.** 이 문서에도 이력이 없었습니다.

`derive-ddl.ts`는 "엔티티가 기대하는 스키마"와의 차이를 DDL로 뱉습니다. 그래서
그 상태로 스크립트를 돌리면 `ALTER TABLE "books" DROP COLUMN "embedding"`이
`upQueries`에 섞여 나옵니다. 위 3절 체크리스트의 "차이가 있으면 스크립트
결과를 따른다"를 그대로 실행했다면 **임베딩 5.6만 건이 전부 날아갔을
것입니다.** 비용과 무료 티어 한계 때문에 일괄 생성만 하고 상시 생성을 두지
않은 값이라 되돌리기가 비쌉니다.

두 가지를 함께 고쳤습니다.

- `Book` 엔티티에 `@Column({ type: 'vector', length: 768, nullable: true, select: false })`로 선언.
  `select: false`라 도서 조회 SQL은 전과 완전히 같습니다.
- `derive-ddl.ts`에 가드를 넣어 `DROP COLUMN`·`DROP TABLE`과 DB 전용 객체의
  `DROP INDEX`를 본 블록에서 빼고, 경고와 함께 따로 출력하고 종료 코드를 1로
  둡니다.

### TypeORM 데코레이터로 표현할 수 없어 운영에만 남는 객체

아래 넷은 엔티티에 선언할 방법이 없습니다. 스크립트가 지우자고 하면 오탐이며,
`derive-ddl.ts`의 `DB_ONLY_OBJECTS`에 등록해 뒀습니다.

| 객체                           | 이유                                   |
| ------------------------------ | -------------------------------------- |
| `IDX_books_title_trgm`         | `gin (... gin_trgm_ops)` 연산자 클래스 |
| `IDX_books_author_trgm`        | 위와 같음                              |
| `IDX_books_publisher_trgm`     | 위와 같음                              |
| `used_book_sales_location_idx` | `ll_to_earth(...)` 표현식 인덱스       |

### 이름 불일치 — 이번 사태의 구조적 원인

`@Index([...])`에 이름을 주지 않으면 TypeORM은 `IDX_<26자리 해시>`를 기대합니다.
그런데 운영에는 사람이 붙인 이름이 들어 있었습니다. 서로를 모르는 상태입니다.

`DefaultNamingStrategy`로 직접 계산해 어느 쪽이 TypeORM 소유인지 가렸습니다.
추측하지 않는 방법이라 남겨 둡니다.

```bash
node -e "
const { DefaultNamingStrategy } = require('typeorm');
const ns = new DefaultNamingStrategy();
console.log(ns.indexName('reviews', ['category','createdAt']));
console.log(ns.uniqueConstraintName('users', ['email']));
"
```

이걸로 확인한 것들:

- `IDX_dee5bccf79cd6823cb25de1baf` = `reviews(category, createdAt)`의 TypeORM 이름
  → 엔티티에서 사라진 옛 선언의 잔재가 맞음. 제거 대상.
- `UQ_97672ac88f789774dd47f7c8be3` = `users(email)`의 TypeORM 이름
  → `users_email_key`가 잉여. **후자를 제거.**
- `UQ_4c6ab594791b82a95bcbf63d8f5`(`wishlists`)는 현재 어떤 컬럼 조합으로도
  재현되지 않음 → `bookId`를 쓰던 시절의 잔재. 읽을 수 있는 이름으로 변경.

**앞으로의 규칙: 인덱스와 유니크 제약은 엔티티 데코레이터에 이름을 반드시
명시합니다.** 무명으로 두면 해시 이름이 되어 운영과 어긋납니다. PK·FK만
데코레이터로 이름을 줄 수 없어 예외입니다(3절 명명 규칙 참고).

### 배포 순서

**이번에는 순서를 맞출 필요가 없습니다.** 코드 변경이 생성되는 SQL을 바꾸지
않기 때문입니다.

- 인덱스·유니크 선언 추가 → 운영은 `synchronize: false`라 아무 일도 안 일어나고,
  쿼리에도 등장하지 않습니다.
- `books.embedding`은 `select: false`라 SELECT 목록에 들어가지 않습니다.
  선언 전과 생성되는 SQL이 동일합니다.
- `varchar` 길이 명시는 DDL도 쿼리도 바꾸지 않습니다.
- 거리 검색의 `earth_box` 조건은 이미 있는 인덱스를 쓰는 것뿐이라, 인덱스가
  없어도 정상 동작합니다.

다만 **`derive-ddl.ts`를 돌린다면 반드시 이번 코드가 반영된 뒤**에 돌리세요.
그전에는 위 `embedding` DROP이 계속 나옵니다.

> **개발 DB 주의.** `synchronize: true`라 다음 기동에서 해시 이름 인덱스를 지우고
> 이름 붙은 인덱스를 다시 만듭니다. 개발 DB가 운영 사본이라면 위 표의 DB 전용
> 객체 4개도 지우려 합니다. 그건 이번 변경 때문이 아니라 원래 그런 상태였습니다.

### 실행한 SQL

0단계(사전 확인) → 1단계(본 DDL) → 2단계 순서로 실행했습니다. 전문은
`docs/ddl/2026-09-12-index-cleanup.sql`에 있습니다.

`CONCURRENTLY`를 쓰지 않고 한 트랜잭션으로 묶었습니다. 대상 테이블이 전부
0~3,142행이라 인덱스 생성이 밀리초 단위로 끝나고, `CONCURRENTLY`는 트랜잭션
밖에서만 되므로 25개를 따로 돌려야 하며 중간에 실패하면 `INVALID` 인덱스가
남기 때문입니다. 여기서는 전부 되거나 전부 안 되거나가 낫습니다.
`lock_timeout`을 5초로 걸어, 락을 못 잡으면 트래픽을 뒤에 줄 세우는 대신
깨끗이 실패하게 했습니다.

#### 제거 — 완전 중복

| 대상                         | 근거                                    |
| ---------------------------- | --------------------------------------- |
| `users_email_key`            | `UQ_97672...`와 동일한 `UNIQUE (email)` |
| `idx_ai_book_summaries_isbn` | PK가 이미 `isbn` 유니크 인덱스          |

#### 제거 — 쓰이지 않거나 낡음

| 대상                                  | 근거                                      |
| ------------------------------------- | ----------------------------------------- |
| `IDX_dee5bccf79cd6823cb25de1baf`      | 엔티티에서 사라진 선언의 잔재             |
| `IDX_notifications_recipient_created` | `createdAt`으로 정렬·필터하는 쿼리가 없음 |

#### 교체 — 모양이 어긋남

| 이전                                            | 이후                            | 이유                                                |
| ----------------------------------------------- | ------------------------------- | --------------------------------------------------- |
| `reviews (category, isPublic, createdAt, id)`   | `(category, isPublic, id)`      | 목록은 `ORDER BY id DESC`인데 `createdAt`이 `id` 앞 |
| `comments (targetType, targetId)`               | `(targetType, targetId, id)`    | 같은 이유로 정렬을 못 받음                          |
| `search_keywords (lastSearchedAt, searchCount)` | `(searchCount, lastSearchedAt)` | `ORDER BY searchCount DESC`가 먼저                  |

> 세 인덱스 모두 ASC로 만듭니다. 선행 컬럼이 등치로 묶이면 `DESC` 정렬은
> 역방향 스캔으로 받습니다. `@Index`는 컬럼별 `DESC`를 표현할 수 없으므로
> ASC로 두는 편이 코드와 맞습니다.

#### 추가 — 인덱스가 없던 외래키 16개

Postgres는 FK 컬럼에 인덱스를 자동으로 만들지 않습니다. 부모 삭제 시 자식
테이블 전체 스캔이 나고, 그 컬럼 기준 조회도 인덱스를 못 탑니다.

특히 `isbn` 셋은 통계에 흔적이 남아 있었습니다. 같은 "isbn으로 세는" 접근인데
인덱스가 있는 `reading_logs`만 인덱스 스캔으로 가고 나머지는 전부 풀스캔이었습니다.

| 테이블            | 누적 `seq_scan` | 누적 `seq_tup_read` | `isbn` 인덱스             |
| ----------------- | --------------- | ------------------- | ------------------------- |
| `reviews`         | 160,995,744     | 112억               | 없었음                    |
| `wishlists`       | 74,390,351      | 25억                | 없었음                    |
| `used_book_sales` | 43,430,368      | 10.4억              | 없었음                    |
| `reading_logs`    | 11,736,944      | 5.7억               | 있음 (`idx_scan` 6,273만) |

> **인덱스로 줄어드는 것은 한 번의 스캔 비용이지, 스캔 횟수가 아닙니다.**
> 1.6억 회라는 횟수 자체는 바깥 쿼리가 중첩 루프를 돌고 있다는 뜻이며 그건
> 쿼리 모양 문제입니다. `pg_stat_statements`가 설치돼 있으니(스키마는
> `extensions`) 어느 쿼리인지 특정할 수 있습니다. 아직 안 했습니다.

추가한 인덱스: `reviews(isbn)`, `reviews(userId)`, `used_book_sales(isbn)`,
`used_book_sales(userId)`, `used_book_sales(reservedForUserId)`,
`wishlists(isbn)`, `wishlists(usedBookSaleId)`, `comments(userId)`,
`comment_likes(userId)`, `review_reactions(userId)`, `chat_messages(senderId)`,
`notifications(actorId)`, `trade_reviews(reviewerId)`,
`trade_completions(chatRoomId)`, `orders(saleId)`, `orders(chatRoomId)`.

쓰기 비용은 확인했습니다. 자주 갱신되는 컬럼(`viewCount`, `reactionCount`)은
어느 인덱스에도 들어 있지 않아 HOT 업데이트가 그대로 유지됩니다.

#### 제거 — 고아 enum 타입

`used_book_posts_status_enum`(`FOR_SALE, RESERVED, SOLD`)은 쓰는 컬럼이 하나도
없었습니다. `used_book_posts` → `used_book_sales` 개명 때 남은 잔재입니다.
Postgres는 테이블 이름을 바꿔도 enum 타입 이름을 따라 바꾸지 않아서 이런 것이
생깁니다(3절 0단계의 경고와 같은 뿌리).

현행 enum은 값이 하나 더 많은 `used_book_sales_status_enum`
(`FOR_SALE, RESERVED, SOLD, WITHDRAWN`)이라 이름이 헷갈리기 쉬웠습니다.

```sql
DROP TYPE "used_book_posts_status_enum";
```

**`CASCADE`를 붙이지 않은 것이 안전장치입니다.** 컬럼·함수·도메인 등 무엇이라도
의존하고 있으면 Postgres가 거부하고 아무것도 바꾸지 않습니다. 그래서 사전 조사
없이 그냥 실행해도 됩니다. 되돌리려면 아래로 다시 만들 수 있지만, 쓰는 데가
없으므로 되돌릴 이유가 없습니다.

```sql
CREATE TYPE "used_book_posts_status_enum" AS ENUM ('FOR_SALE', 'RESERVED', 'SOLD');
```

### 함께 고친 코드

- **거리 검색이 GiST 인덱스를 타도록 수정.** `used_book_sales_location_idx`는
  `gist (ll_to_earth(latitude, longitude))`인데 쿼리는
  `earth_distance(...) <= :radius`였습니다. GiST는 `earth_box(...) @> ll_to_earth(...)`
  형태만 받으므로 **만들어진 이래 `idx_scan`이 0**이었습니다.
  `earth_box` 선필터를 앞에 두고 정확한 거리 조건을 그대로 남겼습니다.
  박스는 반지름의 외접 정육면체라 모서리가 더 딸려오는데, 뒤의 거리 조건이
  그것을 걸러내므로 **결과 집합은 전과 완전히 같습니다.**
- **`varchar` 길이 명시.** `users.role`(20), `users.password`(255),
  `books.discount`(255), `ai_book_summaries.isbn`(255). 운영에는 길이가 있는데
  엔티티가 무제한이라 `derive-ddl.ts`가 계속 차이로 잡던 것들입니다.

### 확인

DDL 전문 끝에 확인 쿼리가 있습니다. `should_be_gone`, `missing`, `invalid`
셋이 모두 빈 배열이고 `email_uniques`가 1개면 정상입니다.

고아 enum이 사라졌는지는 아래로 봅니다. 0행이면 정상입니다.

```sql
SELECT t.typname FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typname = 'used_book_posts_status_enum';
```

엔티티 쪽은 TypeORM 메타데이터를 직접 떠서 대조했습니다. 텍스트 검색이 아니라
`getMetadataArgsStorage()`로 읽으면 관계 프로퍼티가 실제 FK 컬럼으로 어떻게
풀리는지까지 함께 볼 수 있습니다(`user` → `userId`, `book` → `isbn`).

### 되돌리기

인덱스와 제약 이름만 건드리므로 **데이터 손실이 없습니다.** DDL 전문 끝에
역순 스크립트가 주석으로 있습니다. 되돌리면 중복 인덱스와 안 쓰이는 인덱스가
돌아올 뿐입니다.

단, `books.embedding` 엔티티 선언은 되돌리지 마세요. 그게 이번 점검에서 가장
위험했던 구멍입니다.
