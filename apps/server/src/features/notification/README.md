# Notification Module (`features/notification`)

사용자 알림의 생성·조회·읽음 처리와 Socket.IO 실시간 푸시를 담당합니다. 커뮤니티 활동, 중고거래 진행 상황, 문의 답변을 합쳐 **17종** 알림을 다룹니다.

## 1. 폴더 구조

```
notification/
├── notification.module.ts
├── controllers/notification.controller.ts
├── services/notification.service.ts
├── gateways/
│   ├── notification.gateway.ts        # Socket.IO 실시간 푸시
│   └── notification.gateway.spec.ts
├── entities/notification.entity.ts    # Notification, NotificationType
├── listeners/notification-cleanup.listener.ts  # user.withdrawn
└── dtos/
    ├── get-notifications-query.dto.ts
    └── notification-response.dto.ts
```

## 2. 아키텍처 — 이벤트 기반 팬아웃

각 도메인 서비스는 알림을 직접 만들지 않고 **`EventEmitter` 이벤트만 발행**합니다. 각 도메인의 리스너가 이를 받아 `NotificationService.createNotification()`을 호출합니다.

```
ReviewService      ──emit──▶ review.reacted   ──▶ ReviewNotificationListener  ─┐
CommentService     ──emit──▶ comment.created  ──▶ CommentNotificationListener ─┤
                   ──emit──▶ comment.liked                                     ├─▶ NotificationService
OrderService       ──emit──▶ order.* (11종)   ──▶ OrderEventListener          ─┘        │
OrderScheduler     ──emit──▶ order.*_warning                                            │
                                                                                        ▼
                                                              DB 저장 + NotificationGateway 푸시
```

알림 로직이 도메인 서비스에 섞이지 않고, 알림 정책을 바꿀 때 리스너만 고치면 됩니다.

### 새 알림 추가 방법

1. `NotificationType` enum에 타입 추가
2. `@bookjeok/core`의 알림 타입에도 동일하게 추가
3. 발행 측 서비스에서 이벤트 emit
4. 해당 도메인의 `*-notification.listener.ts`(또는 `*-event.listener.ts`)에 `@OnEvent` 핸들러 추가
5. 웹의 `features/notification/utils/index.ts`에 문구·아이콘·이동 경로 매핑 추가

> 5번을 빠뜨리면 알림은 도착하지만 문구와 링크가 비어 보입니다.

## 3. 알림 타입 (17종)

| 분류      | 타입                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| 커뮤니티  | `REVIEW_REACTION`, `REVIEW_COMMENT`, `COMMENT_LIKE`                             |
| 거래 진행 | `BUYER_SELECTED`, `OTHER_BUYER_TRADING`, `PAYMENT_COMPLETED`, `PAYMENT_EXPIRED` |
| 배송      | `SHIPPING_STARTED`, `DELIVERY_COMPLETED`, `SHIPPING_DEADLINE_IMMINENT`          |
| 확정·취소 | `AUTO_CONFIRM_IMMINENT`, `PURCHASE_CONFIRMED`, `ORDER_CANCELLED`                |
| 후기      | `TRADE_REVIEW_RECEIVED`                                                         |
| 직거래    | `TRADE_RESERVED`, `TRADE_COMPLETED`                                             |
| 북적 공지 | `FEEDBACK_REPLIED` — 문의 답변. **행위자 없음**(`actorId` null)                 |

**행위자 없는 알림**: `createNotification(recipientId, null, ...)`로 보냅니다. 북적이 보내는 알림이라
"자기 행동은 자기에게 알리지 않는다" 검사를 건너뜁니다(운영자가 자기 문의에 답해도 알림이 감).
웹은 `isSystemNotification`으로 골라 행위자 대신 북적 로고·이름을 보입니다. 타입을 추가하면 운영 DB의
`notification_type_enum`에도 값을 넣어야 합니다(DDL 로그 3·13절).

## 4. API 엔드포인트

전 구간 JWT 인증이 필요합니다.

| 메서드 | 경로                          | 설명                                        |
| ------ | ----------------------------- | ------------------------------------------- |
| GET    | `/notifications`              | 내 알림 목록 (커서 페이지네이션, 기본 20건) |
| GET    | `/notifications/unread-count` | 안 읽은 알림 수                             |
| PATCH  | `/notifications/read-all`     | 전체 읽음 처리                              |
| PATCH  | `/notifications/:id/read`     | 개별 읽음 처리                              |
| DELETE | `/notifications/:id`          | 알림 삭제                                   |

## 5. 엔티티 — `Notification`

| 컬럼          | 타입      | 설명                                                  |
| ------------- | --------- | ----------------------------------------------------- |
| `id`          | `number`  | PK                                                    |
| `recipientId` | `number`  | 수신자                                                |
| `actorId`     | `number`  | 알림 유발자. 북적이 보내는 알림은 null                |
| `type`        | `enum`    | `NotificationType`                                    |
| `metadata`    | `jsonb`   | 문구 구성에 필요한 동적 데이터 (책 제목, 주문번호 등) |
| `isRead`      | `boolean` | 읽음 여부                                             |
| `createdAt`   | `Date`    | 생성일                                                |

문구를 완성하는 데 필요한 값은 `metadata`에 **스냅샷으로** 담습니다. 원본 리소스가 삭제돼도 알림이 깨지지 않습니다.

## 6. 실시간 푸시 (Socket.IO)

| 항목      | 값                                               |
| --------- | ------------------------------------------------ |
| Namespace | `notification`                                   |
| 룸        | `user:{userId}` — 연결 시 JWT로 식별해 자동 join |
| 이벤트    | `newNotification`                                |
| 페이로드  | 알림 응답 객체                                   |

수신자 전용 룸으로만 emit하므로 다른 사용자에게 알림이 새지 않습니다. 인증되지 않은 소켓은 연결 단계에서 끊깁니다.

## 7. 관련

- 웹: [`features/notification`](../../../../web/src/features/notification/README.md)
- 거래 알림 발행 지점: [`features/order`](../order/README.md#이벤트--알림-팬아웃)
