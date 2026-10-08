# Review Feature (도서 리뷰 · 리액션 · 태그)

도서 리뷰 CRUD, 리액션 집계, 태그, 조회수, 추천 리뷰를 담당하는 백엔드 모듈입니다.

---

## 폴더 구조

```
review/
├── review.module.ts
├── constants.ts                      # POPULAR_REVIEW_MONTHS (인기 리뷰 집계 기간)
├── entities/
│   ├── review.entity.ts              # Review
│   ├── review-reaction.entity.ts     # ReviewReaction, ReviewReactionType
│   └── tag.entity.ts                 # Tag (review_tags 조인 테이블)
├── controllers/
│   └── review.controller.ts
├── services/
│   ├── review.service.ts
│   └── review-indexing.service.ts    # 커밋 후 네이버 IndexNow 알림·재시도
├── dtos/
│   ├── create-review.dto.ts
│   ├── update-review.dto.ts
│   ├── get-reviews-query.dto.ts
│   ├── toggle-reaction.dto.ts        # 리액션 종류 검증 (@IsEnum)
│   └── review-response.dto.ts
├── helpers/
│   └── review-image.helper.ts        # 본문 이미지 추출 및 Vercel Blob 정리
├── interceptors/
│   └── view-count.interceptor.ts     # 중복 방지 조회수 증가
└── listeners/
    ├── review-notification.listener.ts  # review.reacted → 알림
    └── review-cleanup.listener.ts       # user.withdrawn → 리뷰 정리
```

---

## API 엔드포인트

| 메서드 | 경로                     | 인증 | 설명                                       |
| ------ | ------------------------ | :--: | ------------------------------------------ |
| POST   | `/reviews`               |  🔒  | 리뷰 작성                                  |
| GET    | `/reviews`               |  -   | 리뷰 목록 (카테고리·공개 여부·정렬 필터)   |
| GET    | `/reviews/feeds`         |  -   | 홈 피드용 요약 목록                        |
| GET    | `/reviews/popular`       |  -   | 최근 `POPULAR_REVIEW_MONTHS`개월 인기 리뷰 |
| GET    | `/reviews/tags`          |  -   | 태그 자동완성 후보 (사용 빈도순)           |
| GET    | `/reviews/:id`           | 선택 | 리뷰 상세 (비공개는 작성자만 원문)         |
| GET    | `/reviews/:id/edit`      |  🔒  | 수정용 조회 (작성자만)                     |
| POST   | `/reviews/:id/view`      |  -   | 조회수 증가                                |
| GET    | `/reviews/:id/recommend` |  -   | 연관 추천 리뷰                             |
| POST   | `/reviews/:id/reactions` |  🔒  | 리액션 토글 (`type` 누락·오타는 400)       |
| GET    | `/reviews/:id/reaction`  |  🔒  | 내 리액션 조회                             |
| PATCH  | `/reviews/:id`           |  🔒  | 리뷰 수정                                  |
| DELETE | `/reviews/:id`           |  🔒  | 리뷰 삭제                                  |

### 인기 리뷰 캐시

`GET /reviews/popular`는 `@SmartCache({ prefix: 'reviews-popular', ttl: 180000, keyStrategy: 'global' })`입니다.
모든 사용자에게 같은 목록이 나가므로 **`ip`가 아니라 `global`이어야 합니다.** `ip`로 두면 방문자·크롤러 IP마다
별도 캐시가 생겨 히트율이 무너지고, `SmartCacheStore`의 prefix→키 맵에 IP 수만큼 키가 쌓입니다.

`POST`·`PATCH`·`DELETE /reviews`는 모두 `@InvalidateCache('reviews-popular', 'review-tags')`로 이 캐시를 날립니다.
둘 중 하나라도 빠지면 수정·삭제된 리뷰가 최대 3분간 옛 내용 그대로 노출됩니다.
리액션 토글(`POST /reviews/:id/reactions`)에는 일부러 걸지 않았습니다 — 인기 순위가 리액션 수를 쓰지만,
토글마다 캐시를 날리면 캐시가 사실상 없는 것과 같아집니다.

> `InvalidateCache`는 인메모리 맵 기반이라 **자기 프로세스의 캐시만** 지웁니다.
> 서버를 2개 이상으로 늘린다면 무효화를 믿고 TTL을 키우기 전에 이 전제를 다시 보세요.

### 태그 정규화와 자동완성 (2026-09-21)

**태그는 저장 직전에 `@bookjeok/core`의 `normalizeTagNames()`를 한 번만 거칩니다.**
`getOrCreateTags()` 안에 두었으므로 create·update 어느 쪽으로 들어와도 같은 규칙을 탑니다.
여기를 지나지 않고 `tags` 행이 생기는 경로를 만들지 마세요.

정규화는 **표기만** 건드립니다 — 선행 `#`, 앞뒤 공백, 중복 공백, NFC, 길이 상한.
**소문자화도 내부 공백 제거도 하지 않습니다.** 근거는 웹 쪽 README에 있습니다.

`GET /reviews/tags`는 **이미 있는 태그를 합치는 장치가 아닙니다.** 2026-09-21 실측에서
공개 리뷰 71건에 붙은 고유 태그 117개 중 99개(85%)가 1회성이었고, 그 원인은 표기 흔들림이
아니라 `카뮈`/`알베르카뮈`, `쿤데라`/`밀란쿤데라`처럼 **뜻이 같은 별개 태그를 매번 새로
지어내는 것**이었습니다. 문자열로는 판정할 수 없으므로(같은 편집거리인 `카프카`/`카프카적`,
`부조리`/`부조리철학`은 합치면 안 됩니다) 입력 시점에 기존 태그를 보여주는 것만이 수단입니다.
기존 행은 건드리지 않습니다.

집계 쿼리는 **조인 테이블 이름을 문자열로 쓰지 않고 `review.tagEntities` 관계로만** 짭니다.
`rt.reviewId` 같은 카멜케이스 컬럼을 직접 적으면 Postgres가 따옴표 없는 식별자를 소문자로
접어 깨질 여지가 있습니다. 관계로 두면 TypeORM이 escape까지 해서 조인 SQL을 만듭니다.

count는 **공개 리뷰만** 셉니다. 비공개까지 세면 자동완성에 표시한 숫자가 목록에서 실제로
보이는 건수와 어긋납니다(`insights`의 인기 태그는 전체를 세므로 값이 다릅니다).

태그 개수·길이 상한은 `CreateReviewDto`에 있습니다. 이전에는 작성 폼에만 있어 API로 직접
넣으면 제한이 없었습니다.

---

## 엔티티

### `Review` (`reviews`)

| 컬럼                         | 설명                                          |
| ---------------------------- | --------------------------------------------- |
| `title`, `content`           | 제목, Tiptap이 생성한 HTML 본문               |
| `category`                   | 리뷰 분류                                     |
| `rating`                     | 별점 (float)                                  |
| `isPublic`                   | 공개/비공개                                   |
| `viewCount`, `reactionCount` | 비정규화 카운터                               |
| `userId`, `isbn`             | 작성자, 대상 도서                             |
| `tagEntities`                | `review_tags` 조인 테이블을 통한 `Tag` 다대다 |

복합 인덱스 `(category, isPublic, createdAt, id)` — 목록 조회의 필터 + 정렬 + 커서 조건을 한 인덱스로 처리합니다.

### `ReviewReaction` (`review_reactions`)

```typescript
enum ReviewReactionType {
  EMPATHY, // 공감
  INSIGHT, // 인사이트
  CHEER, // 응원
}
```

사용자당 리뷰별 1건이며, 같은 타입을 다시 누르면 해제(토글)됩니다. `reactionCount`는 토글과 같은 트랜잭션에서 갱신합니다.

내 리액션은 상세 응답에 들어가지 않고 `GET /reviews/:id/reaction`으로 따로 조회합니다. 상세는 웹에서 ISR로 캐시되므로 사용자별 값을 섞으면 안 됩니다.

---

## 핵심 로직

### 네이버 IndexNow 알림 (2026-10-07)

`create`·`update`·`remove`는 트랜잭션을 수행하는 `persist*`가 커밋된 뒤 `ReviewEvents.changed`를 발행합니다. `ReviewIndexingService`는 요청에서 네트워크를 기다리지 않고 id별 메모리 큐에 넣습니다. 처음부터 비공개인 글은 제외하고, 공개→비공개 전환과 공개 글 삭제는 기존 URL 변경을 알립니다. 조회수·리액션은 대상이 아닙니다.

작업은 현재 DB 상태를 다시 읽고 웹 `/api/revalidate`에 `reviewId`·`removed`를 전달합니다. ko/en 상세를 재검증하고, 삭제·비공개 전환은 목록·홈도 걷어냅니다. 정규 ko URL의 200 + 최신 `dateModified`, 비공개 글의 noindex 또는 삭제 글의 404/410, 루트 소유 확인 파일의 내용을 확인한 다음 네이버 IndexNow에 URL만 전송합니다. HTTP 200/202는 수신 성공이며 실제 색인 완료를 의미하지 않습니다.

활성화 조건은 서버의 `INDEXNOW_ENABLED=true`, `NODE_ENV=production`, `USER_WEB_URL=https://bookjeok.com`, `REVALIDATE_TOKEN`입니다. 웹과 서버의 토큰은 같아야 합니다. 기본 플래그는 false이고 로컬·다른 호스트에서는 전송하지 않습니다. 신규 변수는 `.env.example`·`turbo.json/globalEnv`에 등록돼 있습니다.

배포 순서:

1. 웹을 먼저 배포하고 `https://bookjeok.com/527f958b193648ebbb4a9d98a1829e42.txt`가 리다이렉트 없이 200이며 파일명과 같은 문자열을 반환하는지 확인합니다. 이는 공개 소유 확인 값으로 시크릿이 아닙니다. 서버 상수와 파일을 함께 교체해야 하며 테스트가 일치를 검사합니다.
2. 운영 웹·서버의 `REVALIDATE_TOKEN`을 동일한 임의 시크릿으로 설정하고 서버의 `USER_WEB_URL`을 위 주소로 설정합니다. 토큰을 URL·로그에 남기지 않습니다.
3. 서버를 배포하고 플래그를 켭니다. 공개 리뷰 작성·수정 후 `Review IndexNow received <id>: HTTP 200/202` 로그를 확인합니다. 색인 여부는 서치어드바이저에서 별도로 확인합니다.

전송·재검증·키 확인 실패는 10초→1분→5분→30분 간격으로 재시도하며 최초 포함 5회 실패하면 오류를 기록하고 중단합니다. 요청별 타임아웃은 10초, 큐 상한은 1,000 id, 한 번에 최대 10 id를 처리합니다. 전송 중 재수정된 id의 새 작업은 이전 작업 완료로 지우지 않습니다. **단일 프로세스 메모리 큐라 재시작·배포 시 대기 항목이 사라집니다.** 사이트맵·RSS는 기존 발견 경로로 남고 캐시 주기를 유지합니다. 기존 글 전체 재제출, 사용자 탈퇴에 따른 일괄 정리 알림, 영속 outbox는 이번 범위에 포함하지 않습니다.

검증은 `review-indexing.service.spec.ts`의 전송·재시도·비공개·동시 변경과 `review.service.indexing.spec.ts`의 커밋 실패 계약, 웹 재검증 웹훅 테스트가 담당합니다. 운영 DB를 띄운 통합 테스트와 실제 네이버 제출은 별도 배포 확인입니다.

### 트랜잭션 경계

`create`, `update`, `toggleReaction`은 `@Transactional()`로 묶여 있습니다. 리뷰 본문 저장 + 태그 upsert + 카운터 갱신이 부분 반영되지 않도록 하기 위함입니다.

### 이미지 수명주기 (`ReviewImageHelper`)

Tiptap 본문에서 이미지 URL을 추출해, 수정·삭제 시 더 이상 참조되지 않는 Vercel Blob 객체를 정리합니다. 에디터에서 올렸다가 지운 이미지가 스토리지에 남는 것을 막습니다.

### XSS

본문은 HTML을 그대로 저장하므로 렌더링 전 `sanitize-html`로 정제합니다(웹의 `sanitize-review-content` 유틸과 짝을 이룹니다).

### 조회수

`ViewCountInterceptor`(공용 `BaseViewCountInterceptor` 확장)가 중복 요청을 걸러 카운트를 증가시킵니다.
조회수·`reactionCount`는 `adjustCounter`로 바꿔 `updatedAt`(sitemap·JSON-LD 수정일)을 건드리지 않습니다.

### 이벤트

| 이벤트           | 리스너                       | 동작                                                                                        |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| `review.reacted` | `ReviewNotificationListener` | 리뷰 작성자에게 `REVIEW_REACTION` 알림                                                      |
| `review.changed` | `ReviewIndexingService` | 공개 리뷰 커밋 후 웹 상세 재검증·네이버 변경 URL 알림 (운영 설정 활성화 시) |
| `user.withdrawn` | `ReviewCleanupListener`      | 탈퇴 회원의 리뷰·리액션 정리 (남의 리뷰 `reactionCount` 차감). 리뷰에 달린 댓글도 함께 삭제 |

`review.reacted`의 `isAdded`는 새로 추가된 경우에만 `true`입니다. 종류 변경·취소·동시 요청으로 무시된 추가는 `false`입니다. 리스너는 같은 사람이 같은 리뷰로 이미 보낸 알림이 있으면 다시 보내지 않습니다. 껐다 켜기를 반복해도 작성자는 알림을 한 번만 받습니다.

---

## 모듈 의존성

- `BookModule` — ISBN 기준 도서 연결
- `NotificationModule` — 리액션 알림
- 댓글은 `CommentModule`이 담당하며, `comment.created` 이벤트로 리뷰 작성자에게 알림이 전달됩니다.

## 도메인 이벤트 계약

[`events/review.events.ts`](events/review.events.ts)가 `ReviewEvents.reacted`의 이름과
`review: ReviewResponseDto`·`actorId`·`isAdded` 계약을 소유합니다. 서비스는 리액션 토글
트랜잭션의 커밋 후 상세를 읽고 `emitDomainEvent`로 발행하며 알림 리스너가
`@OnDomainEvent`로 같은 계약을 받습니다. Nest 옵션은 기본값이고 알림 중복 검사·오류 로깅을 유지합니다.

탈퇴 정리 구독은 [user 소유 계약](../user/events/user-withdrawn.event.ts)을 사용합니다.
