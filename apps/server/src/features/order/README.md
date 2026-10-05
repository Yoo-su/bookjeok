# Order Feature (에스크로 주문 · 결제 · 배송)

토스페이먼츠 **에스크로** 기반 중고책 택배 거래를 담당하는 백엔드 모듈입니다. 주문 생성부터 결제 승인, 운송장 등록, 배송 추적, 구매확정, 분쟁, 자동 환불까지의 전체 수명주기를 관리합니다.

> **거래 후기는 이 모듈에 없습니다.** 후기는 결제가 아니라 "거래가 성사됐다"는
> 사실(`TradeCompletion`)에 붙습니다 — [trade/README.md](../trade/README.md) 참고.
> 구매확정 시 `OrderService`가 완료 기록을 하나 남기고, 그 뒤는 trade 모듈이 맡습니다.

> 설계 배경·엣지 케이스 정책·단계별 실행 계획은 [docs/used-book-pay-implementation.md](../../../../../docs/used-book-pay-implementation.md)를 참고하세요.

---

## 폴더 구조

```
order/
├── order.module.ts
├── entities/
│   └── order.entity.ts              # Order, OrderStatus
├── controllers/
│   ├── order.controller.ts          # 주문 수명주기 API
│   └── toss-webhook.controller.ts   # 토스 결제 상태 웹훅 수신
├── services/
│   ├── order.service.ts             # 주문 상태 전이 핵심 로직
│   ├── toss-payments.service.ts     # 토스 REST API 연동 (승인/에스크로/취소)
│   ├── delivery-tracker.service.ts  # 택배 배송 상태 조회
│   └── order-scheduler.service.ts   # Cron 기반 자동 만료/환불/확정
├── listeners/
│   └── order-event.listener.ts      # 주문 이벤트 → 알림 + 채팅 시스템 메시지
├── guards/
│   └── payment-feature.guard.ts     # FEATURE_PAYMENT_ENABLED 플래그 게이트
└── dtos/                            # create/confirm/cancel/dispute/shipping/query
```

---

## 상태 머신

```
판매자가 채팅방에서 구매자 선택
        │
        ▼
  AWAITING_PAYMENT ──(24h 미결제 자동 만료 / 판매자 선택 취소)──▶ CANCELLED
        │ 구매자 결제 승인 (토스 에스크로)
        ▼
      PAID ──(양측 취소 / 3일 미배송 자동 환불)──▶ CANCELLED
        │ 판매자 운송장 등록
        ▼
    SHIPPED ──(Delivery Tracker 폴링으로 배송완료 감지)──▶ DELIVERED
                                                             │
                              구매자 수동 확정 / 2일 후 자동 확정
                                                             ▼
                                                         CONFIRMED
                                                             ▲
                     구매확정 거부 → DISPUTED ───────────────┘
                                        └─(7일 미해결 자동 환불)─▶ CANCELLED
```

배송 중(`SHIPPED`) 상태에서는 취소할 수 없습니다.

### `UsedBookSale.status` 연동

| Order 전이                | 판매글 상태 |
| ------------------------- | ----------- |
| 생성 (`AWAITING_PAYMENT`) | `RESERVED`  |
| 취소/만료 (`CANCELLED`)   | `FOR_SALE`  |
| 구매확정 (`CONFIRMED`)    | `SOLD`      |

---

## API 엔드포인트

모든 라우트는 `PaymentFeatureGuard`를 거칩니다. 플래그가 꺼져 있으면 `503`을 반환합니다.

### 주문 (`/orders`) — 전 구간 JWT 필요

| 메서드 | 경로                      | 추가 가드   | 설명                                      |
| ------ | ------------------------- | ----------- | ----------------------------------------- |
| POST   | `/orders`                 | 이메일 인증 | 판매자가 구매자를 지정해 주문 생성        |
| DELETE | `/orders/:id/selection`   |             | 결제 전 판매자의 구매자 지정 취소         |
| POST   | `/orders/:id/pay`         | 이메일 인증 | 토스 결제 승인 + 배송지 스냅샷 저장       |
| POST   | `/orders/:id/ship`        |             | 판매자 운송장 등록                        |
| POST   | `/orders/:id/confirm`     |             | 구매자 구매확정 (에스크로 구매 확정 통보) |
| POST   | `/orders/:id/dispute`     |             | 구매확정 거부 → `DISPUTED`                |
| POST   | `/orders/:id/cancel`      |             | 결제 전/배송 전 취소 및 환불              |
| GET    | `/orders/my-purchases`    |             | 내 구매 내역                              |
| GET    | `/orders/my-sales`        |             | 내 판매 주문 내역                         |
| GET    | `/orders/by-room/:roomId` |             | 채팅방의 활성 주문 조회                   |
| GET    | `/orders/:id`             |             | 주문 상세 (구매자/판매자만)               |

### 웹훅 (`/orders/webhook`)

| 메서드 | 경로                   | 설명                                              |
| ------ | ---------------------- | ------------------------------------------------- |
| POST   | `/orders/webhook/toss` | 토스 결제 상태 변경 웹훅 수신 및 주문 상태 동기화 |

---

## 엔티티

### `Order` (`orders`)

| 그룹                 | 컬럼                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| 식별                 | `id`(varchar PK, 주문번호), `saleId`, `buyerId`, `sellerId`, `chatRoomId`                     |
| 결제                 | `status`, `amount`, `paymentKey`                                                              |
| 배송지 스냅샷        | `recipientName`, `recipientPhone`, `zipCode`, `address`, `addressDetail`                      |
| 배송                 | `carrier`, `trackingNumber`                                                                   |
| 시각 (`timestamptz`) | `expiresAt`, `paidAt`, `shippedAt`, `deliveredAt`, `confirmedAt`, `disputedAt`, `cancelledAt` |
| 사유                 | `disputeReason`, `cancelReason`                                                               |
| 동시성               | `version` (`@VersionColumn` 낙관적 잠금)                                                      |

인덱스: `(status, expiresAt)`, `(status, deliveredAt)`, `(status, disputedAt)`, `buyerId`, `sellerId` — 스케줄러 스캔 경로에 맞춰 구성했습니다.

배송지는 **참조가 아니라 스냅샷**으로 저장합니다. 사용자가 나중에 주소를 바꿔도 과거 주문의 배송지가 흔들리지 않고, 모바일 결제 리디렉션 도중 입력값이 유실되지 않습니다.

---

## 스케줄러 (`OrderSchedulerService`)

| 주기      | 작업                    | 동작                                                       |
| --------- | ----------------------- | ---------------------------------------------------------- |
| 5분       | `handleExpiredOrders`   | `AWAITING_PAYMENT` 24시간 초과 주문 자동 취소              |
| 5분       | `handleUnshippedOrders` | `PAID` 3일 초과 미배송 주문 자동 환불                      |
| 5분       | `handleAutoConfirm`     | `DELIVERED` 2일 경과 시 자동 구매확정                      |
| 5분       | `handleExpiredDisputes` | `DISPUTED` 7일 미해결 시 자동 환불                         |
| 30분      | `pollDeliveryStatus`    | `SHIPPED` 주문의 배송 상태 폴링 → 완료 시 `DELIVERED` 전이 |
| 매일 자정 | `sendExpiryWarnings`    | 자동확정·배송기한 임박 알림 발송                           |

각 작업은 처리 건수를 반환하며 `*.spec.ts`로 테스트되어 있습니다.

---

## 이벤트 → 알림 팬아웃

`OrderService`는 알림을 직접 만들지 않고 이벤트만 발행합니다. `OrderEventListener`가 이를 받아 알림 생성과 채팅방 시스템 메시지 발송을 처리합니다.

```
order.buyer_selected            order.cancelled
order.payment_completed         order.unshipped_cancelled
order.shipping_started          order.dispute_expired_refunded
order.delivery_completed        order.expired
order.confirmed                 order.auto_confirm_warning
order.auto_confirmed            order.shipping_deadline_warning
order.disputed                  trade_review.created
```

**이벤트는 트랜잭션이 커밋된 뒤에 발행합니다.** 상태 변경은 `persist*` 프라이빗 메서드에 `@Transactional()`로 묶고, 같은 이름의 공개 메서드가 그 결과(`PersistedOrder`)를 받아 `emit`합니다. 커밋 전에 발행하면 (1) 롤백된 주문에 대한 알림과 채팅 메시지가 남고, (2) 소켓 브로드캐스트를 받은 화면이 아직 커밋되지 않은 주문을 다시 읽어갑니다. 리스너는 트랜잭션 밖 레포지토리로 쓰기 때문에 롤백에 따라오지 않습니다.

---

## 안전장치

| 위험                                 | 방어                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 동시 상태 전이 (이중 결제·중복 확정) | `@VersionColumn` 낙관적 잠금 + `@Transactional()`                                                                   |
| 요청 재시도로 인한 이중 과금         | `x-idempotency-key` 헤더 → `IdempotencyInterceptor`                                                                 |
| 클라이언트 금액 위변조               | 승인 금액을 서버에서 `UsedBookSale.price`와 대조                                                                    |
| 토스 승인 성공 후 DB 저장 실패       | 보상 트랜잭션으로 즉시 자동 환불                                                                                    |
| 구매확정 시 완료 기록 중복           | 판매글당 완료 기록 하나(`SALE_ALREADY_COMPLETED`). DB 유니크 위반이 에스크로 확정 뒤에 500으로 터지는 것을 막습니다 |
| 롤백된 주문의 알림 잔존              | 이벤트는 커밋 후 발행 (위 참고)                                                                                     |
| 미인증 계정 어뷰징                   | `EmailVerifiedGuard` (구매자 지정 · 결제)                                                                           |
| PG 심사 전 노출                      | `PaymentFeatureGuard` + `FEATURE_PAYMENT_ENABLED`                                                                   |
| 거래 중 이탈                         | 활성 주문이 있는 채팅방 나가기 차단 (`CHAT_CANNOT_LEAVE_DURING_TRADE`)                                              |

---

## 모듈 의존성

- `UsedBookSaleModule` — 판매글 상태 연동 및 가격 검증
- `ChatModule` — 거래 채팅방 및 시스템 메시지
- `NotificationModule` — 거래 단계별 알림
- `UserModule` — 구매자/판매자 조회
- `ConfigService` — `TOSS_PAYMENTS_SECRET_KEY`, `DELIVERY_TRACKER_BASE_URL`, `FEATURE_PAYMENT_ENABLED`

## 관련 환경 변수

| 변수                        | 설명                                                   |
| --------------------------- | ------------------------------------------------------ |
| `TOSS_PAYMENTS_SECRET_KEY`  | 토스 REST API 시크릿 키                                |
| `TOSS_PAYMENTS_CLIENT_KEY`  | 결제 위젯 클라이언트 키                                |
| `FEATURE_PAYMENT_ENABLED`   | `true`가 아니면 모든 주문/결제 라우트가 503            |
| `DELIVERY_TRACKER_BASE_URL` | 배송 추적 API (기본값 `https://apis.tracker.delivery`) |

## 도메인 이벤트 계약

[`events/order.events.ts`](events/order.events.ts)가 `OrderEvents`의 13개 이름·payload와
`PendingOrderEvent`를 소유합니다. 대기 이벤트는 이름별 payload를 연결한 discriminated union이므로
구매자 지정·결제 완료의 `amount` 누락, 이름 오타, 다른 이벤트 payload의 조합이 타입 검사에서 드러납니다.
`OrderService`는 기존처럼 `persist*`에서 대기 객체를 반환하고 커밋 후 `emitPendingOrderEvent`로
발행합니다. 스케줄러는 기존 처리 지점에서 `emitDomainEvent`로 같은 계약을 사용합니다.

`OrderEventListener`는 `@OnDomainEvent`와 계약 타입으로 구독하며 기본 Nest 옵션·catch·알림·채팅
순서를 유지합니다. 확정/자동 확정과 취소/미배송 취소/분쟁 환불의 묶음 구독도 유지합니다.
채팅방·운송장·사유의 기존 선택/nullable 필드는 유지합니다. 후기 알림은 order가 이벤트를
정의하지 않고 [trade 소유 계약](../trade/events/trade-review-created.event.ts)을 구독합니다.
