# Wishlist Feature (위시리스트)

도서(`BOOK`)와 중고 판매글(`SALE`)을 한 목록으로 관리하는 위시리스트 모듈입니다.

## 폴더 구조

```
wishlist/
├── wishlist.module.ts
├── controllers/wishlist.controller.ts
└── services/
    ├── wishlist.service.ts
    └── wishlist.service.spec.ts
```

엔티티 `Wishlist`는 이 폴더가 아니라 `user/entities/wishlist.entity.ts`에 있습니다.

## API 엔드포인트

전 구간 JWT 인증이 필요합니다.

| 메서드 | 경로                       | 설명                       |
| ------ | -------------------------- | -------------------------- |
| POST   | `/user/wishlist`           | 도서 또는 판매글 추가      |
| DELETE | `/user/wishlist?type=&id=` | 항목 제거                  |
| GET    | `/user/wishlist`           | 내 위시리스트 조회         |
| GET    | `/user/wishlist/check`     | 특정 항목의 담김 여부 확인 |

`type`은 `BOOK` 또는 `SALE`입니다.

## 특징

- **`BookResolvePipe`** — 도서를 담을 때 DB에 없는 ISBN이면 `BOOK_NOT_FOUND`(404)로 거절합니다. 위시리스트가 존재하지 않는 도서를 참조하는 상황을 막는 가드이며, 도서를 새로 만들지는 않습니다(2026-09-08 이후 외부 공급처 없음).
- **활동 추적** — 추가/삭제에 `@TrackActivity(ActivityType.WISHLIST_ADD / WISHLIST_REMOVE)`가 붙어 `activity_logs`에 적재됩니다. 이 로그를 읽는 기능은 아직 없습니다(`shared/README.md`의 활동 로그 참고). 도서 인기도 산정(`findPopularBooks`)은 위시리스트 테이블을 직접 집계합니다.
- **`/check`** — 도서 상세·판매글 상세에서 하트 버튼의 초기 상태를 채우는 용도입니다.

## 프론트엔드

`/my-page/wishlist`(`wishlist-view`)에서 조회하며, 담기/빼기 버튼은 `book`·`book-sale` 기능의 액션 컴포넌트에 포함되어 있습니다.
