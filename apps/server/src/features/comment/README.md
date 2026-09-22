# Comment Module (`features/comment`)

도서와 리뷰에 달리는 댓글의 CRUD 및 좋아요를 담당합니다.

## 1. 폴더 구조

```
comment/
├── comment.module.ts
├── controllers/comment.controller.ts
├── services/
│   ├── comment.service.ts
│   └── comment.service.spec.ts
├── entities/
│   ├── comment.entity.ts          # Comment (targetType: BOOK | REVIEW)
│   └── comment-like.entity.ts     # CommentLike
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
| POST   | `/`                    |  ✅  | 댓글 작성                                                      |
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

`targetType` + `targetId` 조합으로 도서와 리뷰를 하나의 테이블에서 다룹니다. 새 대상이 생기면 enum만 확장하면 됩니다.

### `CommentLike`

`(commentId, userId)` 조합이 유일합니다.

## 4. 핵심 로직

### 좋아요 토글

이미 좋아요한 상태면 취소, 아니면 추가하며 `likeCount`를 같은 트랜잭션에서 갱신합니다. 매 조회마다 `COUNT` 쿼리를 돌리지 않기 위한 비정규화 필드입니다.

### 탈퇴 처리

`user.withdrawn` 이벤트를 받으면 `CommentCleanupListener`가 작성자 참조를 정리합니다. `userId`가 nullable인 이유는 **댓글 본문은 남기고 작성자만 익명 처리**하기 위해서입니다 — 대화 맥락이 통째로 사라지지 않습니다.

### 알림

| 이벤트            | 알림                             |
| ----------------- | -------------------------------- |
| `comment.created` | 리뷰 작성자에게 `REVIEW_COMMENT` |
| `comment.liked`   | 댓글 작성자에게 `COMMENT_LIKE`   |

## 5. 관련

- 웹: [`features/comment`](../../../../web/src/features/comment/README.md)
- 알림 구조: [`features/notification`](../notification/README.md)
