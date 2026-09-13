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
│   └── review.service.ts
├── dtos/
│   ├── create-review.dto.ts
│   ├── update-review.dto.ts
│   ├── get-reviews-query.dto.ts
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
| GET    | `/reviews/:id`           | 선택 | 리뷰 상세 (로그인 시 내 리액션 포함)       |
| GET    | `/reviews/:id/edit`      |  🔒  | 수정용 조회 (작성자만)                     |
| POST   | `/reviews/:id/view`      |  -   | 조회수 증가                                |
| GET    | `/reviews/:id/recommend` |  -   | 연관 추천 리뷰                             |
| POST   | `/reviews/:id/reactions` |  🔒  | 리액션 토글                                |
| GET    | `/reviews/:id/reaction`  |  🔒  | 내 리액션 조회                             |
| PATCH  | `/reviews/:id`           |  🔒  | 리뷰 수정                                  |
| DELETE | `/reviews/:id`           |  🔒  | 리뷰 삭제                                  |

### 인기 리뷰 캐시

`GET /reviews/popular`는 `@SmartCache({ prefix: 'reviews-popular', ttl: 180000, keyStrategy: 'global' })`입니다.
모든 사용자에게 같은 목록이 나가므로 **`ip`가 아니라 `global`이어야 합니다.** `ip`로 두면 방문자·크롤러 IP마다
별도 캐시가 생겨 히트율이 무너지고, `SmartCacheStore`의 prefix→키 맵에 IP 수만큼 키가 쌓입니다.

`POST`·`PATCH`·`DELETE /reviews`는 모두 `@InvalidateCache('reviews', 'reviews-popular')`로 이 캐시를 날립니다.
셋 중 하나라도 빠지면 수정·삭제된 리뷰가 최대 3분간 옛 내용 그대로 노출됩니다.
리액션 토글(`POST /reviews/:id/reactions`)에는 일부러 걸지 않았습니다 — 인기 순위가 리액션 수를 쓰지만,
토글마다 캐시를 날리면 캐시가 사실상 없는 것과 같아집니다.

> `InvalidateCache`는 인메모리 맵 기반이라 **자기 프로세스의 캐시만** 지웁니다.
> 서버를 2개 이상으로 늘린다면 무효화를 믿고 TTL을 키우기 전에 이 전제를 다시 보세요.

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

---

## 핵심 로직

### 트랜잭션 경계

`create`, `update`, `toggleReaction`은 `@Transactional()`로 묶여 있습니다. 리뷰 본문 저장 + 태그 upsert + 카운터 갱신이 부분 반영되지 않도록 하기 위함입니다.

### 이미지 수명주기 (`ReviewImageHelper`)

Tiptap 본문에서 이미지 URL을 추출해, 수정·삭제 시 더 이상 참조되지 않는 Vercel Blob 객체를 정리합니다. 에디터에서 올렸다가 지운 이미지가 스토리지에 남는 것을 막습니다.

### XSS

본문은 HTML을 그대로 저장하므로 렌더링 전 `sanitize-html`로 정제합니다(웹의 `sanitize-review-content` 유틸과 짝을 이룹니다).

### 조회수

`ViewCountInterceptor`(공용 `BaseViewCountInterceptor` 확장)가 중복 요청을 걸러 카운트를 증가시킵니다.

### 이벤트

| 이벤트           | 리스너                       | 동작                                   |
| ---------------- | ---------------------------- | -------------------------------------- |
| `review.reacted` | `ReviewNotificationListener` | 리뷰 작성자에게 `REVIEW_REACTION` 알림 |
| `user.withdrawn` | `ReviewCleanupListener`      | 탈퇴 회원의 리뷰·리액션 정리           |

---

## 모듈 의존성

- `BookModule` — ISBN 기준 도서 연결
- `NotificationModule` — 리액션 알림
- 댓글은 `CommentModule`이 담당하며, `comment.created` 이벤트로 리뷰 작성자에게 알림이 전달됩니다.
