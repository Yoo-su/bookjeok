-- ============================================================================
-- 2026-09-12 인덱스 정리 DDL
--
-- 0단계 → 1단계 → 2단계 순서로 실행하세요.
-- 0단계 결과가 예상과 다르면 멈추고 알려주세요.
--
-- 코드 배포와 순서를 맞출 필요가 없습니다. 이번 코드 변경은 생성되는 SQL을
-- 바꾸지 않아서(인덱스 선언, select:false 컬럼, 타입 길이 명시뿐) DDL을
-- 먼저 돌리든 나중에 돌리든 깨지지 않습니다.
-- ============================================================================


-- ############################################################################
-- 0단계 — 사전 확인 (읽기 전용). 셋 다 확인한 뒤 1단계로.
-- ############################################################################
SELECT jsonb_build_object(
  -- (1) 엔티티에 vector(768)로 선언했습니다. 다르면 알려주세요.
  'embedding_type', (
    SELECT format_type(a.atttypid, a.atttypmod)
    FROM pg_attribute a
    WHERE a.attrelid = 'public.books'::regclass AND a.attname = 'embedding'
  ),
  -- (2) 2단계 SET NOT NULL이 가능한지. 둘 다 0이어야 합니다.
  'ai_summary_nulls', (
    SELECT jsonb_build_object(
      'createdAt', count(*) FILTER (WHERE "createdAt" IS NULL),
      'updatedAt', count(*) FILTER (WHERE "updatedAt" IS NULL)
    ) FROM ai_book_summaries
  ),
  -- (3) email 유니크가 정말 두 벌인지. 2행이어야 합니다.
  'email_uniques', (
    SELECT jsonb_agg(conname ORDER BY conname)
    FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) = 'UNIQUE (email)'
  )
)::text AS precheck;


-- ############################################################################
-- 1단계 — 본 DDL (한 트랜잭션)
--
-- CONCURRENTLY를 쓰지 않습니다. 대상 테이블이 전부 0~3,142행이라 인덱스
-- 생성이 밀리초 단위로 끝나고, 한 트랜잭션으로 묶는 편이 안전하기 때문입니다.
-- CONCURRENTLY는 트랜잭션 밖에서만 되므로 25개를 따로 돌려야 하고, 중간에
-- 실패하면 INVALID 인덱스가 남습니다. 여기서는 전부 되거나 전부 안 되거나가
-- 낫습니다.
-- ############################################################################
BEGIN;

-- 운영 트래픽이 테이블 락을 잡고 있으면 뒤에 줄 세우지 말고 그냥 실패시킨다.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ── A. 완전 중복 제거 ──────────────────────────────────────────────────────

-- users(email) 유니크가 두 벌이었다. UQ_97672...는 TypeORM이 만드는 이름과
-- 일치하므로(DefaultNamingStrategy로 확인) 그쪽을 남기고 손이름을 지운다.
-- 유니크 보장은 남는 쪽이 그대로 한다.
ALTER TABLE users DROP CONSTRAINT "users_email_key";

-- PK(ai_book_summaries_pkey)가 이미 isbn 유니크 인덱스다. 완전 중복.
DROP INDEX "idx_ai_book_summaries_isbn";

-- ── A-2. 읽을 수 없는 제약 이름 정리 ───────────────────────────────────────
-- 두 이름 모두 해시인데, UQ_4c6ab5...는 현재 어떤 컬럼 조합으로도 재현되지
-- 않습니다(bookId를 쓰던 시절의 잔재). 엔티티에 그대로 박으면 읽는 사람이
-- 뜻을 알 수 없으므로 이름만 바꿉니다.
--
-- RENAME CONSTRAINT는 카탈로그만 고치는 연산이라 테이블 재작성이 없고,
-- 유니크 제약은 뒤에 붙은 인덱스 이름도 함께 바뀝니다.
ALTER TABLE wishlists
  RENAME CONSTRAINT "UQ_4c6ab594791b82a95bcbf63d8f5" TO "UQ_wishlists_userId_isbn";
ALTER TABLE wishlists
  RENAME CONSTRAINT "UQ_7bcdc864b7dfced5cd03c920d1c" TO "UQ_wishlists_userId_usedBookSaleId";

-- ── B. 쓰이지 않는/낡은 인덱스 제거 ────────────────────────────────────────

-- 엔티티에서 사라진 @Index(['category','createdAt'])의 잔재.
-- (이름이 그 조합의 TypeORM 해시와 정확히 일치하는 것으로 확인)
DROP INDEX "IDX_dee5bccf79cd6823cb25de1baf";

-- notifications를 createdAt으로 정렬·필터하는 쿼리가 없다. 목록은 id 커서,
-- 안 읽음 개수는 isRead를 본다. 그 둘을 받는 인덱스는 남는다.
DROP INDEX "IDX_notifications_recipient_created";

-- ── C. 모양이 어긋난 인덱스 교체 ───────────────────────────────────────────

-- 리뷰 목록은 ORDER BY id DESC인데 createdAt이 id 앞에 끼어 있어 정렬에 못 썼다.
DROP INDEX "IDX_reviews_category_isPublic_createdAt_id";
CREATE INDEX "IDX_reviews_category_isPublic_id"
  ON reviews (category, "isPublic", id);

-- 댓글 목록도 ORDER BY id DESC다. id를 끝에 붙인다.
DROP INDEX "IDX_f3ce9f81b6ebb319fd25b1b726";
CREATE INDEX "IDX_comments_targetType_targetId_id"
  ON comments ("targetType", "targetId", id);

-- 인기 검색어는 ORDER BY "searchCount" DESC가 먼저인데 인덱스는 lastSearchedAt이
-- 선행이라 정렬에 쓸 수 없었다. ASC로 만들어도 역방향 스캔으로 받는다.
DROP INDEX "idx_search_keywords_popular";
CREATE INDEX "idx_search_keywords_popular"
  ON search_keywords ("searchCount", "lastSearchedAt");

-- ── D. 인덱스가 없던 외래키 ────────────────────────────────────────────────
-- Postgres는 FK 컬럼에 인덱스를 자동으로 만들지 않는다. 부모 삭제 시 자식
-- 전체 스캔이 나고, 그 컬럼 기준 조회도 인덱스를 못 탄다.

-- 도서 상세가 isbn으로 리뷰·판매글·위시리스트를 찾는 경로. 셋 다 인덱스가
-- 없어서 누적 풀스캔이 각각 1.6억 / 4,343만 / 7,439만 회였다.
-- (같은 접근인데 인덱스가 있는 reading_logs만 인덱스 스캔으로 가고 있었다)
CREATE INDEX "IDX_reviews_isbn"           ON reviews (isbn);
CREATE INDEX "IDX_used_book_sales_isbn"   ON used_book_sales (isbn);
CREATE INDEX "IDX_wishlists_isbn"         ON wishlists (isbn);

-- "내 리뷰 / 내 판매글 / 내 댓글" 조회 경로.
CREATE INDEX "IDX_reviews_userId"         ON reviews ("userId");
CREATE INDEX "IDX_used_book_sales_userId" ON used_book_sales ("userId");
CREATE INDEX "IDX_comments_userId"        ON comments ("userId");

-- 아래는 탈퇴(CASCADE/SET NULL)와 부모 삭제 때 외래키 검사를 받아주는 것들이다.
-- 유니크 제약의 두 번째 컬럼이라 선행이 아니어서 별도로 필요하다.
CREATE INDEX "IDX_comment_likes_userId"    ON comment_likes ("userId");
CREATE INDEX "IDX_review_reactions_userId" ON review_reactions ("userId");
CREATE INDEX "IDX_wishlists_usedBookSaleId" ON wishlists ("usedBookSaleId");
CREATE INDEX "IDX_chat_messages_senderId"  ON chat_messages ("senderId");
CREATE INDEX "IDX_notifications_actorId"   ON notifications ("actorId");
CREATE INDEX "IDX_trade_reviews_reviewerId" ON trade_reviews ("reviewerId");
CREATE INDEX "IDX_trade_completions_chatRoomId" ON trade_completions ("chatRoomId");
CREATE INDEX "IDX_used_book_sales_reservedForUserId"
  ON used_book_sales ("reservedForUserId");

-- orders는 결제가 꺼져 있어 0행이지만, 판매글 상세가 매번 부르는
-- hasActiveOrder()가 saleId로 찾는다. 켜기 전에 만들어 두는 편이 낫다.
CREATE INDEX "IDX_orders_saleId"     ON orders ("saleId");
CREATE INDEX "IDX_orders_chatRoomId" ON orders ("chatRoomId");

COMMIT;

ANALYZE reviews, comments, wishlists, used_book_sales, notifications,
        search_keywords, comment_likes, review_reactions, chat_messages,
        trade_reviews, trade_completions, orders, users, ai_book_summaries;


-- ############################################################################
-- 2단계 — ai_book_summaries 타임스탬프 NOT NULL
--
-- 0단계 (2)가 둘 다 0일 때만 실행하세요. 엔티티는 @CreateDateColumn /
-- @UpdateDateColumn이라 NOT NULL을 기대하는데 운영이 nullable이라
-- derive-ddl.ts가 계속 차이로 잡습니다.
-- ############################################################################
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE ai_book_summaries ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE ai_book_summaries ALTER COLUMN "updatedAt" SET NOT NULL;

COMMIT;


-- ############################################################################
-- 확인 — 아래 셋이 모두 비어 있으면 정상입니다.
-- ############################################################################
SELECT jsonb_build_object(
  -- (1) 지웠어야 할 것이 남아 있는가
  'should_be_gone', (
    SELECT coalesce(jsonb_agg(c.relname ORDER BY c.relname), '[]'::jsonb)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN (
      'users_email_key', 'idx_ai_book_summaries_isbn',
      'IDX_dee5bccf79cd6823cb25de1baf', 'IDX_notifications_recipient_created',
      'IDX_reviews_category_isPublic_createdAt_id',
      'IDX_f3ce9f81b6ebb319fd25b1b726',
      'UQ_4c6ab594791b82a95bcbf63d8f5', 'UQ_7bcdc864b7dfced5cd03c920d1c'
    )
  ),
  -- (2) 만들었어야 할 것이 빠졌는가
  'missing', (
    SELECT coalesce(jsonb_agg(x ORDER BY x), '[]'::jsonb) FROM unnest(ARRAY[
      'IDX_reviews_category_isPublic_id','IDX_comments_targetType_targetId_id',
      'idx_search_keywords_popular','IDX_reviews_isbn','IDX_used_book_sales_isbn',
      'IDX_wishlists_isbn','IDX_reviews_userId','IDX_used_book_sales_userId',
      'IDX_comments_userId','IDX_comment_likes_userId','IDX_review_reactions_userId',
      'IDX_wishlists_usedBookSaleId','IDX_chat_messages_senderId',
      'IDX_notifications_actorId','IDX_trade_reviews_reviewerId',
      'IDX_trade_completions_chatRoomId','IDX_used_book_sales_reservedForUserId',
      'IDX_orders_saleId','IDX_orders_chatRoomId',
      'UQ_wishlists_userId_isbn','UQ_wishlists_userId_usedBookSaleId'
    ]) AS x
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = x
    )
  ),
  -- (3) 무효(INVALID) 인덱스가 생겼는가
  'invalid', (
    SELECT coalesce(jsonb_agg(c.relname ORDER BY c.relname), '[]'::jsonb)
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND NOT i.indisvalid
  ),
  -- 참고: 남은 email 유니크는 1개여야 합니다.
  'email_uniques', (
    SELECT jsonb_agg(conname ORDER BY conname) FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass AND contype = 'u'
      AND pg_get_constraintdef(oid) = 'UNIQUE (email)'
  )
)::text AS verify;


-- ############################################################################
-- 되돌리기 — 인덱스만 건드리므로 데이터 손실이 없습니다.
-- ############################################################################
-- BEGIN;
-- ALTER TABLE ai_book_summaries ALTER COLUMN "createdAt" DROP NOT NULL;
-- ALTER TABLE ai_book_summaries ALTER COLUMN "updatedAt" DROP NOT NULL;
-- ALTER TABLE users ADD CONSTRAINT "users_email_key" UNIQUE (email);
-- ALTER TABLE wishlists RENAME CONSTRAINT "UQ_wishlists_userId_isbn" TO "UQ_4c6ab594791b82a95bcbf63d8f5";
-- ALTER TABLE wishlists RENAME CONSTRAINT "UQ_wishlists_userId_usedBookSaleId" TO "UQ_7bcdc864b7dfced5cd03c920d1c";
-- CREATE INDEX "idx_ai_book_summaries_isbn" ON ai_book_summaries (isbn);
-- CREATE INDEX "IDX_dee5bccf79cd6823cb25de1baf" ON reviews (category, "createdAt");
-- CREATE INDEX "IDX_notifications_recipient_created" ON notifications ("recipientId", "createdAt" DESC);
-- DROP INDEX "IDX_reviews_category_isPublic_id";
-- CREATE INDEX "IDX_reviews_category_isPublic_createdAt_id" ON reviews (category, "isPublic", "createdAt", id);
-- DROP INDEX "IDX_comments_targetType_targetId_id";
-- CREATE INDEX "IDX_f3ce9f81b6ebb319fd25b1b726" ON comments ("targetType", "targetId");
-- DROP INDEX "idx_search_keywords_popular";
-- CREATE INDEX "idx_search_keywords_popular" ON search_keywords ("lastSearchedAt" DESC, "searchCount" DESC);
-- DROP INDEX "IDX_reviews_isbn", "IDX_used_book_sales_isbn", "IDX_wishlists_isbn",
--            "IDX_reviews_userId", "IDX_used_book_sales_userId", "IDX_comments_userId",
--            "IDX_comment_likes_userId", "IDX_review_reactions_userId",
--            "IDX_wishlists_usedBookSaleId", "IDX_chat_messages_senderId",
--            "IDX_notifications_actorId", "IDX_trade_reviews_reviewerId",
--            "IDX_trade_completions_chatRoomId", "IDX_used_book_sales_reservedForUserId",
--            "IDX_orders_saleId", "IDX_orders_chatRoomId";
-- COMMIT;
