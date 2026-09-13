# Book Module (`features/book`)

도서 **마스터 데이터**(`Book` 엔티티)와 외부 도서 API 연동을 담당합니다.

> **외부 도서 API 호출은 이 모듈이 단독으로 담당합니다.** 웹에서 공급처를 직접
> 부르지 않습니다. 알라딘 종료(2026-10-30) 대응 진행 상황은
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
│   └── local-db-book-catalog.provider.ts # 자체 DB 어댑터 (현재 유일한 공급처)
├── services/
│   ├── book.service.ts (+ spec)          # 도서 마스터 조회·동기화·통계
│   └── book-catalog.service.ts (+ spec)  # 공급처 체인 오케스트레이터
├── entities/book.entity.ts               # isbn을 PK로 사용
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

| 컬럼                           | 타입          | 설명                               |
| ------------------------------ | ------------- | ---------------------------------- |
| `isbn`                         | `string`      | Primary Key                        |
| `title`, `author`, `publisher` | `string`      | 서지 정보                          |
| `discount`                     | `string`      | 가격 정보 (기본 `''`)              |
| `description`                  | `text`        | 소개                               |
| `image`                        | `string`      | 표지 URL                           |
| `pubDate`                      | `string`      | 출판일 (YYYY-MM-DD 형식)           |
| `salesPoint`                   | `number`      | 알라딘 판매지수 (인기도 산정 반영) |
| `viewCount`                    | `number`      | 단순 상세 조회수                   |
| `createdAt` / `updatedAt`      | `timestamptz` |                                    |

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

> 이름과 코드의 생성 분기(Request Collapsing, NOT NULL 폴백 등)는 아직 남아
> 있습니다. 외부 INSERT 전용 코드라 지금은 죽은 경로이며, Phase 4에서
> 정리합니다. 자세한 목록은 마이그레이션 계획서를 보세요.

### `BookResolvePipe`

컨트롤러 파라미터 단계에서 `resolveBook`을 호출해, **서비스 레이어에 도달했을 때는 항상 해당 도서가 DB에 존재함**을 보장합니다.

- Body의 `isbn` 필드 (또는 위시리스트의 `type: "BOOK"` + `id`)
- Param의 ISBN 문자열

판매글 생성(`POST /book/sale`), 위시리스트 추가 등에서 사용합니다. 덕분에 각 서비스가 "책이 없으면 만들기" 분기를 반복 구현하지 않습니다.

### 조회수 및 인기도 산정

- `BookViewCountInterceptor`(공용 `BaseViewCountInterceptor` 확장)가 중복 요청을 걸러 `viewCount`를 증가시킵니다.
- `findPopularBooks`는 단순 조회수 대신 사용자 활동 데이터(독서기록, 위시리스트, 리뷰)와 정규화된 판매지수(`ln(salesPoint + 1)`)를 결합하여 인기 도서를 선별합니다.

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
아니라 **운영자가 주기적으로 돌리는 스크립트**로 확보합니다.

검색 품질은 `title`·`author`·`publisher`의 pg_trgm GIN 인덱스
(`docs/manual-ddl-log.md` 4번)와 어댑터의 관련도 정렬이 담당합니다. 3글자 이상
검색은 29ms입니다.

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
