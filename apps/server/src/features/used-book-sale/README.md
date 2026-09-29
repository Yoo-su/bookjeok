# Used Book Sale Feature (중고책 판매)

중고책 판매글 관리를 위한 백엔드 feature 모듈입니다.

## 폴더 구조

```
used-book-sale/
├── used-book-sale.module.ts     # 모듈 설정 (GiST 인덱스 초기화 포함)
├── entities/
│   └── used-book-sale.entity.ts # UsedBookSale, SaleStatus
├── controllers/
│   └── used-book-sale.controller.ts
├── services/
│   └── used-book-sale.service.ts
├── dtos/
│   ├── create-book-sale.dto.ts
│   ├── update-book-sale.dto.ts
│   ├── query-book-sale.dto.ts   # BookSaleSortBy, SortOrder
│   └── get-book-sales-query.dto.ts
├── constants.ts                 # 목록 크기, 정렬 기본값 등
├── interceptors/
│   └── used-book-view-count.interceptor.ts
├── listeners/
│   └── used-book-sale-cleanup.listener.ts   # user.withdrawn
└── utils/
    └── sale-query.builder.ts    # 커서 페이지네이션, 위치 정렬
```

## API 엔드포인트

| 메서드 | 경로                     | 인증 | 설명                             |
| ------ | ------------------------ | ---- | -------------------------------- |
| POST   | `/book/sale`             | 🔒   | 판매글 생성                      |
| GET    | `/book/sales`            | -    | 판매글 검색                      |
| GET    | `/book/sales/recent`     | -    | 최근 판매글                      |
| GET    | `/book/sales/popular`    | -    | 인기 판매글                      |
| GET    | `/book/sales/regions`    | -    | 등록된 지역(시/도·시/군/구) 목록 |
| GET    | `/book/sales/:id`        | -    | 판매글 상세                      |
| GET    | `/book/sales/:id/edit`   | 🔒   | 수정용 조회 (본인만)             |
| PATCH  | `/book/sales/:id`        | 🔒   | 판매글 수정                      |
| PATCH  | `/book/sales/:id/status` | 🔒   | 상태 변경                        |
| DELETE | `/book/sales/:id`        | 🔒   | 판매글 삭제                      |
| POST   | `/book/sales/:id/view`   | -    | 판매글 조회수 기록               |
| GET    | `/book/:isbn/sales`      | -    | ISBN별 판매글                    |

## SaleStatus Enum

```typescript
enum SaleStatus {
  FOR_SALE = 'FOR_SALE', // 판매중
  RESERVED = 'RESERVED', // 예약중 (활성 주문 존재)
  SOLD = 'SOLD', // 판매완료 (구매확정)
  WITHDRAWN = 'WITHDRAWN', // 판매취소
}
```

`RESERVED` / `SOLD` 전이는 직거래 시 판매자의 상태 변경(`PATCH /book/sales/:id/status`) 및 [`trade`](../trade/README.md) 모듈의 예약/완료 API, 또는 택배 거래 시 [`order`](../order/README.md) 모듈의 주문 수명주기에 의해 수행됩니다. 활성 주문이 있는 판매글은 사용자가 임의로 상태를 바꾸거나 삭제할 수 없습니다.

`WITHDRAWN`은 회원 탈퇴 시 시스템이 판매글을 숨기려고 쓰는 값이라 사용자 입력으로는 받지 않습니다 (`UpdateSaleStatusDto`의 `USER_SETTABLE_SALE_STATUSES`).

### 판매글 잠금 규칙

수정·삭제·상태 변경을 막는 근거는 두 가지입니다. **화면에서만 잠그지 않고 서비스에서도 같은 규칙을 강제합니다.** (버튼이 비활성이어도 API는 직접 호출됩니다.)

| 조건                | 수정 | 삭제            | 상태 변경             | 에러                      |
| ------------------- | ---- | --------------- | --------------------- | ------------------------- |
| 활성 주문 존재      | ✗    | ✗               | ✗                     | `SALE_IN_TRADE_CANNOT_*`  |
| 거래 완료 기록 존재 | ✗    | ✗ (운영자 예외) | 판매완료 되돌리기만 ✗ | `SALE_COMPLETED_CANNOT_*` |

거래 완료 기록이 있는 글을 잠그는 이유는 [`trade` 모듈 문서](../trade/README.md)에 있습니다. 요약하면 후기가 판매글에 CASCADE로 매달려 있어서, 글을 지우거나 내용을 바꿔치기하면 받은 후기가 사라지거나 다른 물건의 후기가 됩니다.

`isbn`은 수정 입력에서 제외합니다(`UpdateBookSaleDto`). 판매글이 어떤 책인지는 등록 시점의 사실이고, 바꿀 수 있으면 후기가 달린 판매글의 책을 통째로 갈아끼울 수 있습니다.

예약중을 벗어나는 상태 변경은 `reservedForUserId`도 함께 지웁니다. 남겨두면 판매중인 글인데도 다른 채팅방에 "다른 구매자와 거래 중" 안내가 계속 뜹니다.

## TradeMethod Enum

```typescript
enum TradeMethod {
  DIRECT_ONLY = 'DIRECT_ONLY', // 직거래만 (결제 없음, 채팅 중계)
  DELIVERY_ONLY = 'DELIVERY_ONLY', // 택배만 (에스크로 결제)
  BOTH = 'BOTH', // 둘 다 가능
}
```

기본값은 `DIRECT_ONLY`입니다. `DIRECT_ONLY` 판매글에는 온라인 주문을 생성할 수 없습니다.

## 커서 페이지네이션

판매글 검색(`GET /book/sales`)은 커서 기반 페이지네이션을 사용합니다.

```json
// 응답
{
  "sales": [...],
  "total": 100,
  "hasNextPage": true,
  "nextCursor": "base64-encoded-cursor"
}
```

다음 페이지 요청 시 `?cursor={nextCursor}` 파라미터를 전달합니다.

## 거리 기반 정렬

`sortBy=distance` 사용 시 `lat`, `lng` 파라미터 필수:

- PostgreSQL `cube` + `earthdistance` 확장의 `ll_to_earth()` GiST 인덱스로 거리 계산 (PostGIS 미사용)
- `radius` (km) 파라미터로 검색 반경 제한 가능

## 이메일 인증

판매글 작성은 `EmailVerifiedGuard`를 통과해야 합니다(`isEmailVerified === true`). 사기·어뷰징 방어 목적이며, 미인증 시 `EMAIL_NOT_VERIFIED` 403이 반환됩니다.

## 이벤트

| 이벤트           | 리스너                        | 동작                    |
| ---------------- | ----------------------------- | ----------------------- |
| `user.withdrawn` | `UsedBookSaleCleanupListener` | 탈퇴 회원의 판매글 정리 |

## 모듈 의존성

- `BookModule`: 등록 시 ISBN이 `books`에 있는지 확인 (`BookResolvePipe`, 없으면 404 — 도서를 만들지 않음)
- `UserModule`: 작성자 정보 조회
- `Order` 엔티티: 활성 주문 확인 (수정·삭제·상태 변경 차단 판정)
- `TradeCompletion` 엔티티: 거래 완료 기록 확인 (같은 판정 + 판매완료 되돌리기 차단)

## 관련

- 웹: [`features/book-sale`](../../../../web/src/features/book-sale/README.md)
- 결제·주문: [`features/order`](../order/README.md)
