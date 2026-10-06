# Reading-Log Module (`features/reading-log`)

개인 독서 기록(캘린더·통계·설정)과 공개 피드인 **독서 라운지**, 남의 기록에 보내는 리액션 **콩**을 함께 담당합니다.

## 1. 폴더 구조

```
reading-log/
├── reading-log.module.ts
├── constants.ts                       # 라운지 페이지 크기·집계 기간
├── controllers/
│   ├── reading-log.controller.ts      # /reading-logs (개인, 인증 필요)
│   ├── reading-log-kong.controller.ts # /reading-logs/:id/kongs, /reading-logs/kongs/* (콩, 인증 필요)
│   ├── lounge.controller.ts           # /reading-logs/lounge (공개)
│   └── public-reading-log.controller.ts # /reading-logs/users/:handle/stack (공개 프로필의 독서 키재기)
├── services/
│   ├── reading-log.service.ts
│   ├── reading-log.service.spec.ts
│   ├── reading-log-kong.service.ts    # 콩 보내기·받은 콩·보낸 콩
│   └── reading-log-kong.service.spec.ts
├── entities/
│   ├── reading-log.entity.ts
│   └── reading-log-kong.entity.ts     # reading_log_kongs
├── events/reading-log.events.ts       # reading-log.kong-sent
├── listeners/
│   ├── reading-log-cleanup.listener.ts       # user.withdrawn
│   └── reading-log-notification.listener.ts  # 콩 → READING_LOG_KONG 알림
├── utils/cursor.util.ts                # 커서 조각 검증 (500 → 400)
├── utils/mountain.util.ts              # 북적 책동산 합산 (두께·지층 띠·넘은 이정표)
└── dtos/
    ├── create-reading-log.dto.ts
    ├── update-reading-log.dto.ts
    └── update-reading-log-settings.dto.ts
```

## 2. API 엔드포인트

### 개인 독서 기록 (`/reading-logs`) — 전 구간 인증 필요

| 메서드 | 경로                 | 설명                                        |
| ------ | -------------------- | ------------------------------------------- |
| POST   | `/`                  | 독서 기록 생성                              |
| GET    | `/`                  | 월별 독서 기록 조회 (캘린더용)              |
| GET    | `/list`              | 커서 기반 목록 조회 (무한 스크롤)           |
| GET    | `/stats`             | 월간·연간 독서 통계                         |
| GET    | `/stack`             | 한 해의 독서 키재기 데이터 (`?year=`)       |
| GET    | `/mountain/me`       | 책동산에서 내가 쌓은 몫 (비공개면 0권)      |
| GET    | `/book/:isbn/status` | 이 책을 기록한 횟수·마지막 날짜 (재독 안내) |
| GET    | `/settings`          | 라운지 공개 설정 조회                       |
| PATCH  | `/settings`          | 라운지 공개 설정 변경                       |
| PATCH  | `/:id`               | 기록 수정 (메모·날짜)                       |
| DELETE | `/:id`               | 기록 삭제                                   |

### 콩 (`/reading-logs`) — 인증 필요

| 메서드 | 경로                  | 설명                                                                 |
| ------ | --------------------- | -------------------------------------------------------------------- |
| POST   | `/:id/kongs`          | 콩 보내기. 이미 보냈으면 `sent: false`로 200. 내 기록 400·비공개 404 |
| GET    | `/kongs/received`     | 내 기록이 받은 콩 (최근 받은 기록부터, 기록마다 보낸 사람)           |
| GET    | `/kongs/sent?handle=` | 그 사용자의 기록 중 내가 콩을 보낸 기록 id                           |

### 공개 독서 키재기 (`/reading-logs/users`) — 인증 없음

| 메서드 | 경로             | 설명                                                   |
| ------ | ---------------- | ------------------------------------------------------ |
| GET    | `/:handle/stack` | 공개 프로필의 독서 키재기 (`?year=`, 비공개면 빈 목록) |

### 독서 라운지 (`/reading-logs/lounge`) — 공개

| 메서드 | 경로                  | 설명                                            |
| ------ | --------------------- | ----------------------------------------------- |
| GET    | `/`                   | 라운지 피드 (커서 페이지네이션)                 |
| GET    | `/popular`            | 최근 `LOUNGE_POPULAR_DAYS`일 기준 인기 도서     |
| GET    | `/active-readers`     | 활동 중인 독자 목록                             |
| GET    | `/mountain`           | 북적 책동산 (공개 기록 전체의 높이·지층·꼭대기) |
| GET    | `/book/:isbn/readers` | 특정 도서를 읽은 독자 목록                      |

라운지 엔드포인트에는 **응답 캐시를 걸지 않았습니다.** `/active-readers`에 5분
캐시를 검토했다가 뺐습니다 — 2026-09-29 운영 실측으로 `reading_logs` 181행(기록한 사용자 14명),
공개 설정 사용자 46명이라 집계 비용이 사실상 0이고, 순위 반영만 5분 늦어지는 손해만 남습니다.
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

### 미래 날짜

폼도 미래 날짜를 막지만 API는 직접 호출되므로 서버에서도 막습니다(`READING_LOG_FUTURE_DATE`, 400). 라운지 피드가 `MAX(date) DESC` 정렬이라 미래 날짜 하나가 모두의 피드 맨 위에 계속 남기 때문입니다. 한국보다 날짜가 앞선 지역의 "오늘"을 막지 않도록 **서버 기준 내일까지는 받습니다.** 생성과 날짜 수정에만 검사하므로, 이미 있는 기록의 메모 수정은 영향이 없습니다.

### 조회 개수

`GET /reading-logs`(연·월·최근 목록)는 도서를 제목·저자·출판사·표지·ISBN만 담습니다(`READING_LOG_BOOK_COLUMNS`, 키재기와 같음). 소개글이 응답 대부분이라 뺐고, 웹 달력은 이 열만 씁니다. `limit`은 1~100(기본 50), `GET /reading-logs/list`는 1~50(기본 10)으로 가둡니다. `GET /reading-logs/stats`는 연도(2000~2100)·월(1~12)이 없거나 범위 밖이면 DB를 보기 전에 400입니다.

`getBookStatus(userId, isbn)` — `GET /reading-logs/book/:isbn/status`. 내가 이 책을 기록한 횟수와 가장 최근 기록일(`{ count, lastDate }`, 없으면 `0`·`null`)을 돌려줍니다. 웹의 「읽었어요」 폼이 재독인지 알리는 데 씁니다. 마지막 날짜는 `MAX_READING_DATE_AS_TEXT`로 텍스트로 받습니다. 기록을 만들지 않는 조회라 `BookResolvePipe`를 두지 않으며, 없는 ISBN은 기록 0건으로 끝납니다.

### 통계

`getStats(userId, year, month)` — 해당 월과 해당 연도의 완독 수를 반환합니다.

### 독서 키재기

`getStack(userId, year)` — `GET /reading-logs/stack?year=`. 한 해의 기록을 완독일 오름차순(바닥부터 쌓는 순서)으로, 책 크기(mm)·무게·표지색과 함께 돌려줍니다.

- 크기는 `book_dimensions`(알라딘 실측 수확본, 2026-10-30 이후 갱신 없음)를 기록 조회에 조인해 한 번에 읽습니다(`leftJoinAndMapOne`). 서버(Azure)와 DB(Supabase)가 다른 클라우드라 왕복을 줄이려는 것입니다. 이 조인 때문에 모듈의 `forFeature`에서 `BookDimension`을 빼면 안 됩니다(`autoLoadEntities`). 행이 없거나 값이 비정상이면 `estimateBookSize`(core)가 채우고 `sizeSource: "estimated"`로 표시합니다. **추정값은 저장하지 않습니다.**
- 쪽수도 같은 범위(`BOOK_SIZE_PLAUSIBLE`)로 걸러 벗어나면 `pages: null`입니다. 원본에는 18,480쪽 같은 오기가 섞여 있어 그대로 내보내면 쪽수 합계와 공유 이미지에 찍힙니다.
- 도서는 제목·저자·출판사·표지만 읽습니다(`description` 제외).
- 표지색이 없으면 `coverColor: null`로 두고 웹이 대체색을 고릅니다.
- 테이블은 `docs/manual-ddl-log.md` 11절. 이 테이블이 없는 DB에 배포하면 이 API가 500을 냅니다.

`getPublicStack(handle, year)` — `GET /reading-logs/users/:handle/stack?year=`(`PublicReadingLogController`, **인증 없음**). 공개 프로필의 독서 키재기입니다. 핸들이 정확히 일치해야 하고(공개 프로필 조회의 닉네임·ID 대체 검색은 하지 않음), 없거나 탈퇴한 사용자는 404(`USER_NOT_FOUND`)입니다. **독서 기록이 비공개면 기록이 없는 것처럼 빈 목록**을 돌려줍니다 — 공개 프로필 응답의 `readingLogs`와 같은 규칙입니다. 한줄평이 포함되는데, 공개 프로필 리스트·캘린더에서도 이미 보이던 정보입니다.

### 북적 책동산

`getLoungeMountain()` — `GET /reading-logs/lounge/mountain`. 공개 사용자의 기록 전부를 **기록한 시각(`createdAt`) 순**으로 쌓습니다(독서 날짜 순이 아닌 것은 지난 책을 몰아 기록하는 일이 많아서).

- 기록·판형은 `getRawMany`로 필요한 열만 한 번에 읽고, 합산은 `utils/mountain.util.ts`의 순수 함수 `buildMountain`이 합니다. 두께가 없으면 `estimateBookSize`, 표지색이 없으면 `fallbackCoverColor`.
- 지층 띠는 한 권에 하나, `MOUNTAIN_MAX_BANDS`(240)를 넘으면 이웃한 책을 묶습니다(색은 묶음 가운데 책). 띠 두께 합은 전체 높이와 같습니다.
- 넘은 이정표(`MOUNTAIN_LANDMARKS`, core)는 누적 두께로 처음 넘긴 기록을 찾습니다. 꼭대기 8권과 이 기록들만 두 번째 쿼리로 제목·독자를 붙입니다.
- **내 몫**: `getMyMountainShare(userId)` — `GET /reading-logs/mountain/me`(인증). 같은 기록 조회(`findMountainRows`)에서 `mountainShareOf`로 내 두께·권수를 더하고 전체 높이를 함께 돌려줘 비율이 어긋나지 않습니다. 공개 API(`/lounge/mountain`)는 ISR이 캐시하므로 개인 값을 섞지 않고 따로 뒀습니다. 비공개 설정이면 산에 내 기록이 없어 0권입니다.
- **전 기록을 매번 읽습니다.** 2026-09-30 기준 공개 기록 175행이라 비용이 없습니다. 수만 행을 넘으면 합계·지층을 SQL로 옮기거나 캐시를 검토하세요(위 「응답 캐시」 원칙대로 행 수부터).

### 공개 설정

`isReadingLogPublic`이 `true`인 사용자의 기록만 라운지 피드와 공개 프로필에 노출됩니다. 라운지 조회 쿼리에 이 조건이 항상 포함되므로, 새 라운지 API를 추가할 때 반드시 함께 적용해야 합니다.

### 콩

공개된 남의 독서 기록에 보내는 리액션입니다. 엔티티는 `ReadingLogKong`(`reading_log_kongs`, DDL 로그 16절).

- **한 기록에 한 사람이 한 알, 거둬들이지 않습니다.** `(readingLogId, senderId)` 유니크에 `INSERT ... ON CONFLICT DO NOTHING`으로 넣고, 무시되면 `sent: false`로 성공합니다. 연타·동시 요청도 한 알이고 알림도 한 번이라 `hasNotification` 중복 검사를 두지 않았습니다.
- **보낼 수 없는 경우**: 형태가 틀린 id(uuid 캐스팅 500을 막으려 `isUuid`로 먼저 거름)·없는 기록·주인이 비공개이거나 탈퇴 → `READING_LOG_NOT_FOUND`(404). 내 기록 → `READING_LOG_KONG_SELF`(400). 비공개를 404로 두어 기록이 있는지조차 드러내지 않습니다.
- **알림**: 새로 보냈을 때만 `reading-log.kong-sent`를 발행하고 `ReadingLogNotificationListener`가 주인에게 `READING_LOG_KONG`(`readingLogId`·`date`·`bookTitle`)을 보냅니다. 웹은 `date`로 독서기록 페이지의 그날 상세를 엽니다. 알림 실패는 로그만 남기고 콩은 그대로입니다.
- **받은 수는 주인만 봅니다.** 공개 API(공개 키재기)에는 콩을 싣지 않습니다. 보는 사람이 보낸 기록은 `/kongs/sent`로 따로 받아, 공개 키재기 응답을 캐시와 무관하게 둡니다.
- **받은 콩의 날짜**는 `TO_CHAR(log.date, 'YYYY-MM-DD')`로 받습니다(위 「`date` 컬럼」).
- **기록을 지우면** 그 기록이 받은 콩은 FK CASCADE로 함께 지워집니다. 이미 간 알림은 남고, 누르면 그날 상세가 빈 채로 열립니다. 기록 날짜를 바꾸면 이전 알림은 옛 날짜를 엽니다.
- 보낸 사람은 기록마다 최근 `KONG_SENDERS_PER_LOG`(10)명까지만 담습니다. 화면은 앞의 셋과 「외 N명」만 쓰고, N은 `count`로 셉니다. 콩이 몰린 기록에서 응답이 불지 않게 하려는 것입니다.
- 받은 콩은 전부 한 번에 돌려줍니다. 2026-10-07 기준 독서 기록 181행이라 페이지를 나누지 않았습니다. 수천 알을 넘으면 기록별 집계와 보낸 사람 목록을 나누세요.

### 탈퇴

`user.withdrawn` → `ReadingLogCleanupListener`가 해당 사용자의 기록과 **남에게 보낸 콩**을 정리합니다. 회원 행은 소프트 삭제라 `senderId` FK의 CASCADE가 돌지 않아 직접 지웁니다. 내 기록이 받은 콩은 기록과 함께 CASCADE로 지워집니다.

## 6. 관련

- 웹: [`features/reading-log`](../../../../web/src/features/reading-log/README.md)
- 독서 키재기 화면: `apps/web` `features/reading-log/components/stack-view`

회원 탈퇴 정리 리스너는 [user 소유 이벤트 계약](../user/events/user-withdrawn.event.ts)의
`userWithdrawnEvent`·`UserWithdrawnEvent`로 발행자와 타입을 공유합니다.
`@OnDomainEvent(..., { suppressErrors: false })`와 같은 트랜잭션 매니저·오류 전파를 유지합니다.
