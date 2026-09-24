# Reading-Log Module (`features/reading-log`)

개인 독서 기록(캘린더·통계·설정)과 공개 피드인 **독서 라운지**를 함께 담당합니다. 컨트롤러가 두 개로 나뉘어 있습니다.

## 1. 폴더 구조

```
reading-log/
├── reading-log.module.ts
├── constants.ts                       # 라운지 페이지 크기·집계 기간
├── controllers/
│   ├── reading-log.controller.ts      # /reading-logs (개인, 인증 필요)
│   └── lounge.controller.ts           # /reading-logs/lounge (공개)
├── services/reading-log.service.ts
├── entities/reading-log.entity.ts
├── listeners/reading-log-cleanup.listener.ts   # user.withdrawn
├── utils/cursor.util.ts                # 커서 조각 검증 (500 → 400)
├── dtos/
│   ├── create-reading-log.dto.ts
│   └── update-reading-log.dto.ts
└── dtos/
    └── update-reading-log-settings.dto.ts
```

## 2. API 엔드포인트

### 개인 독서 기록 (`/reading-logs`) — 전 구간 인증 필요

| 메서드 | 경로        | 설명                              |
| ------ | ----------- | --------------------------------- |
| POST   | `/`         | 독서 기록 생성                    |
| GET    | `/`         | 월별 독서 기록 조회 (캘린더용)    |
| GET    | `/list`     | 커서 기반 목록 조회 (무한 스크롤) |
| GET    | `/stats`    | 월간·연간 독서 통계               |
| GET    | `/settings` | 라운지 공개 설정 조회             |
| PATCH  | `/settings` | 라운지 공개 설정 변경             |
| PATCH  | `/:id`      | 기록 수정 (메모·날짜)             |
| DELETE | `/:id`      | 기록 삭제                         |

### 독서 라운지 (`/reading-logs/lounge`) — 공개

| 메서드 | 경로                  | 설명                                        |
| ------ | --------------------- | ------------------------------------------- |
| GET    | `/`                   | 라운지 피드 (커서 페이지네이션)             |
| GET    | `/popular`            | 최근 `LOUNGE_POPULAR_DAYS`일 기준 인기 도서 |
| GET    | `/active-readers`     | 활동 중인 독자 목록                         |
| GET    | `/book/:isbn/readers` | 특정 도서를 읽은 독자 목록                  |

라운지 엔드포인트에는 **응답 캐시를 걸지 않았습니다.** `/active-readers`에 5분
캐시를 검토했다가 뺐습니다 — 2026-09-13 기준 `reading_logs` 50행, 공개 사용자
31명이라 집계 비용이 사실상 0이고, 순위 반영만 5분 늦어지는 손해만 남습니다.
캐시를 다시 검토한다면 **행 수를 먼저 재세요.**

## 3. 엔티티 — `ReadingLog` (`reading_logs`)

| 컬럼                      | 타입           | 설명                                |
| ------------------------- | -------------- | ----------------------------------- |
| `id`                      | `uuid`         | PK                                  |
| `userId`                  | `number`       | 작성자 (`onDelete: CASCADE`)        |
| `isbn`                    | `string`       | 도서 ISBN                           |
| `book`                    | `Book`         | `eager` 관계 (`onDelete: SET NULL`) |
| `date`                    | `date`         | 독서 날짜 (`YYYY-MM-DD`)            |
| `memo`                    | `varchar(100)` | 한줄 메모                           |
| `createdAt` / `updatedAt` | `timestamptz`  |                                     |

> 도서 제목·표지·저자는 **컬럼으로 복제하지 않고** `Book` 관계로 조회합니다(`eager: true`). 도서 메타데이터가 갱신되면 과거 기록에도 자동 반영됩니다.

### 인덱스

| 인덱스           | 용도                               |
| ---------------- | ---------------------------------- |
| `(isbn, date)`   | 라운지 피드 — ISBN 그룹화 + 최신순 |
| `(date)`         | 라운지 인기작 — 최근 N일 스캔      |
| `(userId, date)` | 개인 기록 조회                     |

세 인덱스 모두 실제 조회 경로에 맞춰 추가한 것입니다. 쿼리를 바꿀 때 함께 검토하세요.

## 4. 상수 (`constants.ts`)

| 상수                   | 값  | 용도                      |
| ---------------------- | --- | ------------------------- |
| `LOUNGE_PAGE_SIZE`     | 20  | 피드 페이지 크기          |
| `LOUNGE_MAX_READERS`   | 5   | 도서별 노출 독자 수       |
| `LOUNGE_POPULAR_COUNT` | 10  | 인기 도서 개수            |
| `LOUNGE_POPULAR_DAYS`  | 365 | 인기 집계 기간(일)        |
| `ACTIVE_READER_DAYS`   | 90  | 열성 독서가 집계 기간(일) |

## 5. 핵심 로직

### 커서 페이지네이션

`findAllInfinite`, `getLoungeFeed`, `getLoungeBookReaders` 모두 커서 방식입니다. 날짜 내림차순(동일 날짜는 생성일 기준)으로 정렬하고, `hasNextPage` 판정을 위해 `limit + 1`건을 조회합니다. 새 기록이 계속 쌓여도 중복·누락이 생기지 않습니다.

**커서는 쿼리를 만들기 전에 `utils/cursor.util.ts`로 검증합니다.** 커서 조각이 그대로 `date`·`uuid` 컬럼 비교에 들어가면 Postgres가 캐스팅 단계에서 실패하고, 그 에러가 400이 아니라 500으로 새어 나갑니다. 라운지 피드와 독자 목록은 인증이 없어 아무나 커서를 지어낼 수 있으니 특히 중요합니다.

### `date` 컬럼을 Date 객체로 받지 마세요

`getRawMany()`로 받은 `date` 값에 **`toISOString()`을 태우면 운영에서 하루가 밀립니다.**

- `pg`는 `date`(OID 1082)를 `postgres-date`로 파싱하며, 그 구현은 `YYYY-MM-DD`를 **로컬 자정** `Date`로 만듭니다. TypeORM은 이 파서를 덮어쓰지 않습니다.
- 운영 컨테이너는 [`Dockerfile`](../../../Dockerfile)에 `ENV TZ=Asia/Seoul`이 있습니다.
- 그래서 `'2026-09-14'` → `Date(2026-09-13T15:00:00Z)` → `.toISOString().split('T')[0]` → **`'2026-09-13'`**.

엔티티 경로(`getMany()`)는 TypeORM의 `mixedDateToDateString`이 로컬 파트로 포맷해 멀쩡합니다. 그래서 증상이 **같은 응답 안에서 raw 값만 하루 어긋나는** 형태로 나타납니다(피드의 `latestDate`와 `readers[].date`가 불일치).

날짜 표시뿐 아니라 **커서**도 이 값으로 만들므로, 하루 당겨진 커서는 `MAX(rl.date) < :cursorDate` 비교에서 마지막 날짜를 통째로 건너뜁니다. 페이지를 넘길 때마다 하루치가 사라집니다.

→ 집계 결과는 `MAX_READING_DATE_AS_TEXT`(`TO_CHAR(MAX(rl.date), 'YYYY-MM-DD')`)로 **SQL에서 문자열로 굳혀** 받습니다. 조회 기간 기준일도 `toISOString()`이 아니라 `dateStringDaysAgo()`(로컬 파트 포맷)로 만듭니다.

### 날짜 형식 검증

날짜는 정규식만으로 부족합니다. `2026-02-30`은 `YYYY-MM-DD` 형태를 만족하고 JS `Date`가 3월 2일로 굴려 주지만 Postgres는 out of range로 거절합니다. `assertCursorDate`가 파싱 후 왕복 비교까지 해서 걸러냅니다. 새 커서 엔드포인트를 추가하면 같은 유틸을 반드시 거치세요.

### 수정

`update`는 메모와 날짜만 바꿉니다. DTO가 `PartialType(CreateReadingLogDto)`라 `isbn`도 받지만 무시합니다. 다른 책이면 새 기록입니다.

### 중복 기록

같은 사용자가 같은 책을 **같은 날** 두 번 기록하면 `READING_LOG_DUPLICATE`(409)로 거절합니다. 생성과 날짜 수정 모두 검사하고, 수정은 자기 자신을 뺍니다. 날짜가 그대로인 수정(메모만 고침)은 검사하지 않습니다. 웹이 메모 수정에도 날짜를 함께 보내므로, 검사하면 이미 중복인 기록의 메모까지 못 고칩니다. 다른 날 재독은 허용합니다.

DB 유니크 제약은 없습니다. 동시에 들어온 두 요청은 둘 다 통과할 수 있고, 같은 제출의 연타는 멱등 키가 막습니다. 제약을 걸려면 운영에 이미 있는 중복부터 확인해야 합니다.

### 통계

`getStats(userId, year, month)` — 해당 월과 해당 연도의 완독 수를 반환합니다.

### 공개 설정

`isReadingLogPublic`이 `true`인 사용자의 기록만 라운지 피드와 공개 프로필에 노출됩니다. 라운지 조회 쿼리에 이 조건이 항상 포함되므로, 새 라운지 API를 추가할 때 반드시 함께 적용해야 합니다.

### 탈퇴

`user.withdrawn` → `ReadingLogCleanupListener`가 해당 사용자의 기록을 정리합니다.

## 6. 관련

- 웹: [`features/reading-log`](../../../../web/src/features/reading-log/README.md)
- 공유 덱 페이지: `apps/web` `/share/deck/[handle]`
