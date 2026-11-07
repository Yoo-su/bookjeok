# Book Module (`features/book`)

도서 **마스터 데이터**(`Book`·`BookDimension` 엔티티)와 자체 DB 기반 도서 검색·상세를 담당합니다.

조회수 증가는 공용 `adjustCounter`로 처리해 서지 수정일(`updatedAt`)을 보존합니다.

> **런타임에 외부 도서 API를 호출하지 않습니다.** 검색·상세 모두 자체 DB 단독이고(2026-09-08),
> 웹도 공급처를 직접 부르지 않습니다. 신규 도서는 운영자 적재 도구로 넣습니다. 알라딘 종료(2026-10-30) 대응 진행 상황은
> [docs/book-data-migration-plan.md](../../../../../docs/book-data-migration-plan.md)를 보세요.

> 중고책 판매글은 이 모듈이 아니라 [`used-book-sale`](../used-book-sale/README.md)에 있습니다.

## 1. 폴더 구조

```
book/
├── book.module.ts
├── controllers/
│   ├── book.controller.ts
│   └── book.controller.spec.ts
├── providers/                            # 도서 공급처 포트와 어댑터
│   ├── book-catalog.types.ts             # 포트 인터페이스 + 주입 토큰
│   ├── book-search-query.ts (+ spec)     # 검색어 → 검색 키 SQL (pg_trgm 표현식 인덱스용)
│   ├── book-search-plan.ts (+ spec)      # 원문 보존·요청 표현/조사 완화·전문검색 계획
│   ├── book-search-sql.spec.ts          # 실제 PostgreSQL SQL 테스트 실행 (test/의 Node 테스트)
│   └── local-db-book-catalog.provider.ts (+ spec) # 자체 DB 어댑터 (현재 유일한 공급처)
├── services/
│   ├── book.service.ts (+ spec)          # 도서 마스터 조회·동기화·통계
│   └── book-catalog.service.ts (+ spec)  # 공급처 체인 오케스트레이터
├── entities/
│   ├── book.entity.ts                    # isbn을 PK로 사용
│   └── book-dimension.entity.ts          # 실측 판형·표지색 (독서 키재기용)
├── pipes/book-resolve.pipe.ts            # ISBN → Book 보장 파이프
└── interceptors/book-view-count.interceptor.ts
```

## 2. API 엔드포인트

| 메서드 | 경로 (`/book/...`) | 인증 | 설명                                  |
| ------ | ------------------ | :--: | ------------------------------------- |
| GET    | `/popular`         |  ❌  | 활동 및 판매지수 기반 인기 도서       |
| GET    | `/external/list`   |  ❌  | 도서 목록 검색 (검색 체인)            |
| GET    | `/external/detail` |  ❌  | 도서 상세 조회 (상세 체인)            |
| POST   | `/:isbn/view`      |  ❌  | 도서 조회수 기록                      |
| GET    | `/:isbn/stats`     |  ❌  | 해당 도서의 독서 기록·위시리스트 통계 |

## 3. 엔티티 — `Book` (`isbn` PK)

| 컬럼                           | 타입          | 설명                                                                             |
| ------------------------------ | ------------- | -------------------------------------------------------------------------------- |
| `isbn`                         | `string`      | Primary Key                                                                      |
| `title`, `author`, `publisher` | `string`      | 서지 정보                                                                        |
| `discount`                     | `string`      | **정가** (기본 `''`). 이름과 달리 할인가가 아님                                  |
| `description`                  | `text`        | 소개                                                                             |
| `image`                        | `string`      | 표지 URL                                                                         |
| `pubDate`                      | `string`      | 출판일 (`date`, YYYY-MM-DD 형식, nullable)                                       |
| `salesPoint`                   | `number`      | 알라딘 판매지수 (nullable, 인기도 산정 반영. 2026-10-30 이후 갱신 불가한 스냅샷) |
| `embedding`                    | `vector(768)` | 시맨틱 검색용. `select: false` — `match_books()` RPC만 읽음                      |
| `viewCount`                    | `number`      | 단순 상세 조회수                                                                 |
| `createdAt` / `updatedAt`      | `timestamptz` |                                                                                  |

`BookDimension`(`book_dimensions`, PK=FK=`isbn`)은 가로·세로·두께·쪽수·무게·제본·표지 대표색을 담습니다. 알라딘 종료 전 수확한 스냅샷이고, 신규 적재분은 적재 도구가 `books`와 한 트랜잭션으로 넣습니다. 값이 없는 책은 행이 없고 `packages/core`의 `estimateBookSize`가 조회 시 추정합니다.

ISBN을 PK로 쓰기 때문에 리뷰·독서 기록·판매글·위시리스트가 모두 자연스럽게 같은 도서를 참조합니다.

> **`pubDate`는 시각이 없는 달력 날짜입니다.** DB 타입이 `date`이고 TypeORM은 이런 컬럼을 `YYYY-MM-DD` **문자열**로 돌려줍니다(엔티티 타입도 `string`으로 선언해 둔 이유). `new Date()`나 `toISOString()`을 태우지 마세요 — 운영 컨테이너가 `TZ=Asia/Seoul`이라 하루가 밀립니다. 웹에서 표시할 때는 `parseCalendarDate`를 거칩니다.
>
> 계약(`BookInfo`)의 필드명은 **소문자 `pubdate`** 입니다. 네이버·알라딘 API 시절 이름이 남은 것이고, `toBookInfo`가 엔티티의 `pubDate`를 여기에 옮깁니다. 2026-09-13까지 이 매핑이 빠져 있어 위시리스트·리뷰 상세의 출간일이 계속 비어 있었습니다.

## 4. 핵심 로직

### `resolveBook(isbn)` — 도서 조회 보장

서비스 레이어에 도달했을 때 그 도서가 `books`에 존재함을 보장합니다.

```
resolveBook(isbn)
  │
  ├─ DB에 있으면 → 그대로 반환
  │
  └─ 없으면 → BOOK_NOT_FOUND (404)
```

**2026-09-08 이전에는 없는 도서를 외부 공급처에서 받아와 만들었습니다.** 알라딘
어댑터를 제거하면서 그 분기가 사실상 사라졌습니다. 체인에 외부 공급처가 없으면
자체 DB가 못 찾은 것이 곧 "없는 책"이 되기 때문입니다.

> 예전 생성 분기(Request Collapsing, NOT NULL 폴백, ISBN 검색 폴백)는
> 2026-09-08 코드 점검 때 모두 지웠습니다. 지금 `resolveBook()`은 `findOneBy` 한 번과
> 404뿐입니다(계획서 9-c).

### `BookResolvePipe`

컨트롤러 파라미터 단계에서 `resolveBook`을 호출해, **서비스 레이어에 도달했을 때는 항상 해당 도서가 DB에 존재함**을 보장합니다.

- Body의 `isbn` 필드 (또는 위시리스트의 `type: "BOOK"` + `id`)
- Param의 ISBN 문자열

판매글 생성(`POST /book/sale`), 위시리스트 추가 등에서 사용합니다. 덕분에 각 서비스가 "책이 없으면 만들기" 분기를 반복 구현하지 않습니다.

### 조회수 및 인기도 산정

- `BookViewCountInterceptor`(공용 `BaseViewCountInterceptor` 확장)가 중복 요청을 걸러 `viewCount`를 증가시킵니다.
- `findPopularBooks`는 단순 조회수 대신 사용자 활동 데이터(독서기록, 위시리스트, 리뷰)와 정규화된 판매지수(`ln(salesPoint + 1)`)를 결합하여 인기 도서를 선별합니다.
- `GET /book/popular`는 순위와 상세를 합친 결과를 서버 프로세스에 60초간 저장합니다. 캐시가 비었을 때 동시에 들어온 요청은 같은 집계를 기다립니다. 홈 ISR 재생성과 브라우저의 재조회가 이 캐시를 함께 사용합니다.

### 도서 공급처 (`BookCatalogService` + `providers/`)

외부 서지 공급처는 `BookCatalogProvider` 포트 뒤에 있습니다. 네이버·알라딘이
연달아 종료된 경험 때문에, **공급처를 갈아끼울 때 손대는 곳이 한 군데여야 한다**는
것이 이 구조의 목적입니다.

**2026-09-08에 알라딘 어댑터를 제거했습니다. 두 체인 모두 자체 DB 단독입니다.**

```
BookCatalogService.search()      BOOK_SEARCH_PROVIDERS
  └─ LocalDbBookCatalogProvider

BookCatalogService.findByIsbn()  BOOK_DETAIL_PROVIDERS
  └─ LocalDbBookCatalogProvider
```

외부 공급처를 런타임 경로에 두지 않는 것이 방침입니다. 신규 도서는 서버가
아니라 **운영자가 필요할 때 돌리는 적재 도구**로 확보합니다. 카카오 책 검색으로
후보를 찾고 알라딘 웹·YES24로 보강하며, 서버 코드와는 별개인 [`tools/book-ingest/`](../../../../../tools/book-ingest/README.md)입니다.
`salesPoint`는 알라딘 웹의 판매지수로 채웁니다. 개편 전 카카오로만 적재한 책은 NULL입니다.
도구는 표지를 R2에 먼저 올린 뒤 `books`에 INSERT하므로 이 모듈은 바뀌지 않습니다.

검색은 `providers/book-search-query.ts`가 만듭니다. 검색어를 단어로 나눠 모든 단어가
들어 있는 책을 찾고, 공백·기호는 무시합니다("사탄 탱고" → 『사탄탱고』, "라슬로 사탄" →
저자+제목). 제목·저자·출판사를 정규화해 이은 **검색 키 표현식 인덱스**
(`IDX_books_search_key_trgm`, `docs/manual-ddl-log.md` 10절)를 타며, 그 식은 코드의
`SEARCH_KEY_SQL`과 문자 하나까지 같아야 합니다. 2글자 이하 단어만 있으면 트라이그램
인덱스를 타지 못해 풀스캔합니다.

검색 품질 비교는 [`scripts/evaluate-book-search.cjs`](../../../scripts/evaluate-book-search.cjs)로
운영·개발 API의 같은 검색어 상위 10건을 기록합니다. 루트에서
`node apps/server/scripts/evaluate-book-search.cjs <API-origin> .tmp/book-search-baseline.json`을
실행합니다. GET만 순차 호출하며 검색어 통계 API는 호출하지 않습니다. HTTP 시간은 DB
실행시간이 아닙니다.

#### 범용 검색

통합 검색은 원문 후보에 요청 표현·조사를 완화한 서지 후보를 더합니다. 특정 필드 검색은
확장하지 않습니다. ISBN 형식은 PK 정확 후보를 기존 서지 결과에 합칩니다. 같은 숫자가 제목에
있는 책도 유지하며, 관련도순에서는 정확한 ISBN을 먼저 둡니다. 저자 이름과 제목 단어가 각각 맞는
책을 작가 이름이 제목에만 언급된 책보다 앞에 둡니다.

시작 시 유효한 `IDX_books_search_document_gin` 인덱스를 확인하면 PostgreSQL `simple`
전문검색으로 소개까지 핵심 단어를 모두 만족하는 후보를 찾습니다. 제목·저자·출판사·소개에
다른 가중치를 주고, 서지 관련도·판매지수 상위 200권만 소개 점수를 재계산합니다.
후보나 전체 건수는 200건으로 자르지 않으며, 페이지네이션 순서는 ISBN으로 고정합니다.
입력 전체가 저자 이름·출판사와 정확히 맞으면 소개 검색·재정렬을 건너뛰어 기존 서지 경로를
유지합니다. 원문과 짧은 조사 완화어는 별도로 조회해 ISBN을 합치므로 정규화 식의 전체
스캔을 유발하는 OR를 피합니다. 이는 쿼리 시간 상한이 아닙니다.

넓은 검색은 후보 수집 때 서지도 가져와 후보별 PK 재조회를
없애고, 서지에 없는 소개 후보만 UNION ALL로 더합니다. 관련도 정수를 한 번 계산해
200권 선정과 최종 정렬에 재사용합니다. 짧은 토큰이 한글·ASCII 숫자뿐이면 대소문자 변환이
필요 없는 LIKE를 쓰고, 영문·기호·다른 문자는 원문 ILIKE를 유지합니다. 짧은 검색의 전체
스캔 자체는 남습니다.

인덱스가 없으면 소개 검색은 꺼집니다. 기호를 보존해야 하는 검색과 짧은 한 단어도 소개로
넓히지 않습니다. 이는 의미 모델이나 한국어 형태소 분석기가 아니며, 장르·시리즈 소속을
판정하는 기능이 아닙니다. 인덱스 적용·되돌리기 절차는
[운영 DDL 로그](../../../../../docs/manual-ddl-log.md) 17절에 있습니다.

SQL 검증은 `node apps/server/scripts/test-book-search-sql.cjs`로 실행합니다. 개발 의존성
PGlite의 작은 실제 PostgreSQL 테이블에서 운영 인덱스 식, 검색·정렬·중복·전체 건수·
200권 이후 페이지를 검증합니다. 전체 운영 스키마나 실제 Nest 서버를 구동하는 테스트는 아닙니다.

**이 변경으로 크롤러발 신규 도서 유입이 멈췄습니다.** 상세 페이지의 연관 도서
섹션이 우리 DB에 없는 도서로 가는 링크를 만들고 그것이 재귀해 무한 크롤 공간이
되어 있었는데, 자체 DB만 보면 우리가 가진 책만 링크하므로 그 공간이 닫힙니다.
`resolveBook()`도 모르는 ISBN에 `BOOK_NOT_FOUND`를 던지고 행을 만들지 않습니다.

**감수한 것:** DB에 없는 책은 등록할 수 없습니다. 판매글·리뷰를 쓰려는 도서가
자체 DB에 없으면 실패합니다.

체인은 여전히 배열이라, 공급처를 다시 붙일 일이 생기면 `book.module.ts`의
배열에 어댑터를 추가하기만 하면 됩니다. 포트를 둔 이유가 그것입니다.

**체인 순서는 `book.module.ts`의 두 배열로만 정합니다.** 공급처가 또 바뀌어도
손대는 곳은 거기 하나입니다.

#### 실패 처리 — 장애와 "책 없음"의 구분

- 공급처가 던지면 로그를 남기고 다음으로 넘어갑니다. 하나가 죽어도 조회가 죽지 않습니다.
- **빈 결과를 "책 없음"으로 인정하려면, 판정 자격이 있는 공급처가 최소 하나
  정상 응답해야 합니다.** 아무도 응답하지 못했다면 장애이므로 예외를 전파합니다.
  이걸 뒤집으면 장애가 404로 둔갑해 ISR 캐시에 24시간 고착됩니다.

판정 자격은 `BookCatalogProvider.kind`로 정합니다.

| `kind`     | "못 찾음"의 의미          | 판정 자격 |
| ---------- | ------------------------- | --------- |
| `external` | 그런 책이 없다            | ✅        |
| `local`    | **우리가 아직 안 가졌다** | ❌        |

자체 DB는 못 찾아도 예외를 던지지 않습니다. 그래서 이걸 판정에 포함하면 외부가
전부 죽어도 늘 "책 없음"이 되어 위 보호장치가 통째로 무력해집니다. 실제로 자체 DB
어댑터를 도입한 시점부터 그 상태였고 2026-09-07에 고쳤습니다.

**현재 구성이 바로 그 경우입니다.** 외부 공급처가 하나도 없으므로 자체 DB가
판정 자격을 대신합니다. 우리가 가진 것이 곧 전부이기 때문입니다.

## 5. 다른 모듈에서의 사용

`BookService`와 `BookResolvePipe`는 `exports`되어 `used-book-sale`, `review`, `reading-log`, `wishlist`가 사용합니다. 도서 마스터 데이터를 만드는 경로는 **이 모듈 하나로 유지**하세요.

## 6. 관련

- 웹: [`features/book`](../../../../web/src/features/book/README.md)
- AI 요약: [`features/llm`](../llm/README.md) · AI 추천: [`features/search`](../search/README.md)
- 인기 검색어: [`features/search-keyword`](../search-keyword/README.md)
