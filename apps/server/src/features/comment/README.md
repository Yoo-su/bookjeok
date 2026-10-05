# Comment Module (`features/comment`)

도서와 리뷰에 달리는 댓글의 CRUD 및 좋아요를 담당합니다.

좋아요 토글과 탈퇴 시 좋아요 수 정리는 공용 `adjustCounter`를 사용해 댓글의 `updatedAt`을 보존합니다. 본문 수정 때만 수정일이 바뀝니다.

## 1. 폴더 구조

```
comment/
├── comment.module.ts
├── constants.ts                   # COMMENT_PAGE_SIZE_MAX 등
├── controllers/comment.controller.ts
├── services/
│   ├── comment.service.ts
│   └── comment.service.spec.ts
├── entities/
│   ├── comment.entity.ts          # Comment (targetType: BOOK | REVIEW)
│   └── comment-like.entity.ts     # CommentLike
├── utils/delete-target-comments.ts   # 대상(리뷰) 삭제 시 댓글·좋아요 함께 삭제 (+ spec)
├── listeners/
│   ├── comment-notification.listener.ts  # comment.created · comment.liked
│   └── comment-cleanup.listener.ts       # user.withdrawn
└── dtos/
    ├── create-comment.dto.ts
    ├── update-comment.dto.ts
    └── get-comments.dto.ts
```

## 2. API 엔드포인트

| 메서드 | 경로 (`/comments/...`) | 인증 | 설명                                                           |
| ------ | ---------------------- | :--: | -------------------------------------------------------------- |
| GET    | `/`                    | 선택 | 댓글 목록 (`targetType`, `targetId` 필터, 로그인 시 `isLiked`) |
| GET    | `/my`                  |  ✅  | 내가 작성한 댓글 목록                                          |
| POST   | `/`                    |  ✅  | 댓글 작성 (대상 없으면 404)                                    |
| PATCH  | `/:id`                 |  ✅  | 댓글 수정 (작성자만)                                           |
| DELETE | `/:id`                 |  ✅  | 댓글 삭제 (작성자만)                                           |
| POST   | `/:id/like`            |  ✅  | 좋아요 토글                                                    |
| GET    | `/:id/like`            |  ✅  | 내 좋아요 여부 조회                                            |

> 라우트 순서상 `/my`가 `/:id` 계열보다 먼저 선언되어야 합니다.

## 3. 엔티티

### `Comment`

| 컬럼                      | 타입             | 설명                    |
| ------------------------- | ---------------- | ----------------------- |
| `id`                      | `number`         | PK                      |
| `content`                 | `text`           | 본문                    |
| `targetType`              | `enum`           | `BOOK` \| `REVIEW`      |
| `targetId`                | `string`         | ISBN 또는 리뷰 ID       |
| `userId`                  | `number \| null` | 작성자 (탈퇴 시 `null`) |
| `likeCount`               | `number`         | 비정규화 좋아요 수      |
| `createdAt` / `updatedAt` | `Date`           |                         |

`targetType` + `targetId` 조합으로 도서와 리뷰를 하나의 테이블에서 다룹니다. 새 대상을 추가하려면 enum과 함께 아래 「대상 확인」의 분기, 「내 댓글」 제목 조회, 알림 리스너, 대상 삭제 시 정리를 모두 맞춰야 합니다.

### `CommentLike`

`(commentId, userId)` 조합이 유일합니다.

## 4. 핵심 로직

### 좋아요 토글

이미 좋아요한 상태면 취소, 아니면 추가하며 `likeCount`를 같은 트랜잭션에서 갱신합니다. 매 조회마다 `COUNT` 쿼리를 돌리지 않기 위한 비정규화 필드입니다.

### 탈퇴 처리

`user.withdrawn` 이벤트를 받으면 `CommentCleanupListener`가 작성자 참조를 정리합니다. `userId`가 nullable인 이유는 **댓글 본문은 남기고 작성자만 익명 처리**하기 위해서입니다 — 대화 맥락이 통째로 사라지지 않습니다. 그래서 목록 응답의 `user`도 `null`일 수 있습니다(`@bookjeok/core`의 `Comment.user`).

탈퇴 회원이 누른 좋아요는 지우면서 해당 댓글들의 `likeCount`도 1씩 줄입니다.

### 대상 확인

`createComment`는 저장 전에 `resolveTargetId`로 대상을 확인하고 **정식 ID로 저장**합니다. FK가 없어 이전에는 없는 리뷰·도서나 `REVIEW/no-such-review`도 그대로 저장됐습니다.

| 대상     | 확인                                                 | 저장되는 `targetId` | 없을 때                |
| -------- | ---------------------------------------------------- | ------------------- | ---------------------- |
| `BOOK`   | `BookService.resolveBook(isbn)`                      | DB의 `isbn`         | 404 `BOOK_NOT_FOUND`   |
| `REVIEW` | 숫자 문자열만 허용(`12abc`·`-1` 거부) → `findReviewById` | `String(review.id)` (`012` → `12`) | 404 `REVIEW_NOT_FOUND` |

리뷰의 공개 여부는 보지 않습니다. 비공개 리뷰 댓글의 노출·작성 정책은 현행 그대로입니다. 조회(`GET /`)는 대상을 확인하지 않고 해당 조합의 댓글을 돌려줍니다.

### 대상이 사라질 때

댓글은 대상(`targetType`, `targetId`)을 외래키 없이 문자열로만 참조해 DB가 정리해 주지 않습니다. 리뷰가 지워지면(작성자 삭제·탈퇴) 리뷰 모듈이 같은 트랜잭션에서 `utils/delete-target-comments.ts`로 그 리뷰의 댓글과 댓글 좋아요를 함께 지웁니다. 남겨 두면 "내 댓글"에서 제목 없는 항목이 404로 이어집니다(2026-09-28 추가, 그 이전에 생긴 고아 댓글은 수동 정리 대상).

### 목록 페이지 값

`GET /comments`의 `page`·`cursorId`는 1 이상 정수, `limit`은 1~50입니다(`COMMENT_PAGE_SIZE_MAX`). `limit=0`은 TypeORM `take(0)`이라 LIMIT 없이 전량 조회가 되고, 음수 `page`는 음수 OFFSET으로 500이 나던 것을 400으로 막습니다.

### 알림

| 이벤트            | 알림                             |
| ----------------- | -------------------------------- |
| `comment.created` | 리뷰 작성자에게 `REVIEW_COMMENT` |
| `comment.liked`   | 댓글 작성자에게 `COMMENT_LIKE`   |

## 5. 관련

- 웹: [`features/comment`](../../../../web/src/features/comment/README.md)
- 알림 구조: [`features/notification`](../notification/README.md)

## 도메인 이벤트 계약

[`events/comment.events.ts`](events/comment.events.ts)가 `CommentEvents.created`·`liked`의
이름과 payload를 소유합니다. 생성 이벤트는 저장 후 작성자 관계를 다시 읽어 `comment`를 보내고,
좋아요 이벤트는 `persistLikeToggle` 커밋 후 `comment`·`actorId`·`isLiked`를 보냅니다.
`CommentService`의 `emitDomainEvent`와 알림 리스너의 `@OnDomainEvent`가 같은 계약을 사용합니다.
리스너의 Nest 옵션은 기본값이며 기존 자기 글 제외·좋아요 추가 조건·오류 로깅을 유지합니다.

탈퇴 정리 구독은 [user 소유 계약](../user/events/user-withdrawn.event.ts)을 사용합니다.
