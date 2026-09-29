# Search Keyword Module (`features/search-keyword`)

`SearchKeywordModule`은 도서 검색 시 검색어를 수집하여 인기 검색어를 제공하는 독립적인 도메인입니다.

## 1. 주요 파일 및 역할

- **`search-keyword.module.ts`**: 모듈 정의 및 의존성 등록
- **`controllers/search-keyword.controller.ts`**: API 엔드포인트 정의
- **`services/search-keyword.service.ts`**: 비즈니스 로직 담당
  - `recordSearchKeyword`: 검색어 기록 (upsert)
  - `findPopularKeywords`: 인기 검색어 조회
- **`entities/search-keyword.entity.ts`**: 검색어 통계 엔티티
- **`utils/normalize-keyword.util.ts`**: 검색어 정규화 유틸
- **`dtos/record-search-keyword.dto.ts`**: 검색어 기록 요청 DTO

## 2. API 엔드포인트

| HTTP Method | 경로 (`/search-keywords/...`) | 설명                                  | 인증 필요 |
| :---------- | :---------------------------- | :------------------------------------ | :-------- |
| `POST`      | `/`                           | 검색어 기록 (인기 검색어 집계용)      | ❌        |
| `GET`       | `/popular`                    | 최근 1년 기준 인기 검색어 Top 10 조회 | ❌        |

## 3. 엔티티 스키마

### `SearchKeyword` (검색어 통계)

| 컬럼명           | 타입           | 설명                     |
| :--------------- | :------------- | :----------------------- |
| `id`             | `bigint`       | PK, auto-increment       |
| `keyword`        | `varchar(100)` | 정규화된 검색어 (UNIQUE) |
| `searchCount`    | `bigint`       | 누적 검색 횟수           |
| `lastSearchedAt` | `timestamptz`  | 최근 검색 시각           |
| `createdAt`      | `timestamptz`  | 생성 시각                |
| `updatedAt`      | `timestamptz`  | 수정 시각                |

## 4. 검색어 정규화 규칙

1. 앞뒤 공백 제거 (trim)
2. 연속 공백 → 단일 공백
3. 한글 초성만 있는 글자 제거 (ㄱ, ㄴ, ㄷ, ..., ㅎ)
4. 최소 2글자 이상만 저장 (그 미만은 무시)
