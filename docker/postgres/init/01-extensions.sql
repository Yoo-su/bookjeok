-- 로컬 개발 DB를 운영(Supabase)과 같은 확장 구성으로 맞춥니다.
-- 이 스크립트는 데이터 디렉터리가 비어 있는 최초 기동에만 실행됩니다.

-- books.embedding vector(768). 없으면 서버 부팅이 스키마 동기화 단계에서 죽습니다.
CREATE EXTENSION IF NOT EXISTS vector;

-- books 제목·저자·출판사 검색용 GIN 인덱스가 쓰는 확장입니다
-- (운영 적용 내역은 docs/manual-ddl-log.md 4번).
-- 인덱스 자체는 수동 DDL이라 여기서 만들지 않습니다.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
