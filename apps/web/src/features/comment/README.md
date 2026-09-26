# Frontend Feature: Comment (댓글)

도서와 리뷰에 달리는 댓글의 작성·목록·좋아요와 마이페이지의 "내가 쓴 댓글"을 담당합니다.

## 1. 폴더 구조

```
comment/
├── constants/config.ts               # 길이 제한, 페이지 크기 등
├── mutations/
└── components/
    ├── common/comment-section/
    │   ├── index.tsx                 # 섹션 컨테이너 (폼 + 목록 조립)
    │   ├── comment-form.tsx          # 작성/수정 입력
    │   ├── comment-list.tsx          # 목록 + 더 보기
    │   └── comment-item.tsx          # 개별 댓글 (좋아요, 수정, 삭제)
    └── my-page/my-comment-list/      # /my-page/comments
```

## 2. 사용법

`comment-section`은 대상 리소스만 받아 어디서든 붙일 수 있는 단위입니다. 현재는 도서 상세와 리뷰 상세에서 사용합니다.

```tsx
<CommentSection reviewId={review.id} />
```

## 3. 핵심 로직

- **목록 조회** — 비로그인 사용자도 읽을 수 있습니다. 로그인 상태에서는 같은 공개 엔드포인트에 액세스 토큰을 보내 `isLiked`를 함께 받고, TanStack Query 캐시는 조회 사용자별로 분리합니다.
- **좋아요 토글** — `POST /comments/:id/like`. 옵티미스틱 업데이트로 즉시 반영하고, 성공 시 서버의 `isLiked`·`likeCount`로 확정하며 실패 시 롤백합니다.
- **권한** — 수정·삭제 버튼은 작성자에게만 노출되며, 실제 검증은 서버가 합니다.
- **탈퇴한 작성자** — 서버가 `user: null`로 내려줍니다. `CommentItem`은 프로필 링크 없이 `comment.item.unknown_author`로 표시합니다.
- **비로그인** — 작성·좋아요 시도 시 로그인으로 유도하고 복귀 경로를 저장합니다.
- **알림 연동** — 댓글 작성은 서버에서 `comment.created`, 좋아요는 `comment.liked` 이벤트를 발행해 각각 `REVIEW_COMMENT` / `COMMENT_LIKE` 알림으로 이어집니다.
- **입력 제한** — 길이 제한 등은 `constants/config.ts` 한 곳에서 관리합니다. 서버 DTO의 제약과 값을 맞춰야 합니다.

## 4. 관련

- 서버: [`features/comment`](../../../../server/src/features/comment/README.md)
- 뷰: `my-comments-view`, `review-detail-view`
