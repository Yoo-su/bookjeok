-- 2026-11-02 운영 적용 완료. 실행 원본이며, 재실행하거나 BEGIN/COMMIT으로 감싸지 않는다.
-- 신규 테이블·컬럼·확장 없이 기존 서지와 소개에 전문검색 인덱스만 추가한다.
-- 실행 전 DB 가용 용량을 확인하고, 완료 후 서버를 재시작해야 소개 검색이 켜진다.
-- SQL Editor에서는 CREATE 문 하나만 선택해 실행하고, 완료 후 SELECT를 따로 실행한다.
CREATE INDEX CONCURRENTLY "IDX_books_search_document_gin"
ON public.books USING gin ((
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(author, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(publisher, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'D')
));

-- 유효하지 않은 인덱스가 남은 경우 이름만으로 준비 완료를 판정하지 않는다.
SELECT c.relname, i.indisvalid, i.indisready,
       pg_size_pretty(pg_relation_size(c.oid)) AS index_size
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
WHERE i.indrelid = 'public.books'::regclass
  AND c.relname = 'IDX_books_search_document_gin';
