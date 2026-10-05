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
├── entities/notification.entity.ts    # Notification (enum은 core 재사용)
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
OrderService       ──emit──▶ order.* (13종)   ──▶ OrderEventListener          ─┘        │
OrderScheduler     ──emit──▶ order.*_warning                                            │
TradeService       ──emit──▶ trade.*          ──▶ TradeEventListener          ─┤
FeedbackService    ──emit──▶ feedback.replied ──▶ FeedbackReplyNotifyListener ─┤
                                                                                        ▼
                                                              DB 저장 + NotificationGateway 푸시
```

알림 로직이 도메인 서비스에 섞이지 않고, 알림 정책을 바꿀 때 리스너만 고치면 됩니다.

### 새 알림 추가 방법

1. `@bookjeok/core`의 `NotificationType`에 값을 추가하고 `NotificationMetadataMap`에 필수 metadata를 정의합니다. 서버는 core enum을 직접 사용합니다.
2. 운영 DB enum에 새 값을 수동 적용하고 `docs/manual-ddl-log.md`에 기록합니다. 현재 17종 값·컬럼 정의는 변경하지 않았으므로 이번 정리에는 DDL이 없습니다.
3. 해당 도메인에서 이벤트를 발행하고 리스너가 `createNotification(recipientId, actorId, type, metadata)`를 호출합니다. 종류와 metadata의 tuple union 계약이 필수 필드 누락·종류 혼합을 거부합니다.
4. 웹 `features/notification/utils/definitions.ts`에 번역 키·보간 인자·이동 경로·시스템 표시 여부를 등록하고 한영 번역을 추가합니다. enum 전체를 요구하는 mapped type이 등록 누락을 잡습니다.
5. core의 최소 입력 예시·음성 타입 계약과 웹의 전 종류 표현 계약 예시를 갱신하고 core 빌드 후 서버·웹 타입 검사 및 계약 테스트를 실행합니다.

`hasNotification()`은 같은 종류 metadata의 **부분 조건**만 받습니다(기존 jsonb 포함 검색 유지).
`NotificationMetadataMap`에는 실제 생성 필드를 정의하며, 댓글 좋아요의 `reviewId`는 nullable,
배송의 운송장 정보는 선택입니다. 거래 후기는 직거래에서도 쓰므로 `orderId`가 선택입니다.
`OTHER_BUYER_TRADING`은 현재 알림 생성 호출이 없고 metadata가 필요 없는 기존 문구·라운지 경로를 유지합니다.

생성 후 DB 저장 → actor 조회 → 기존 `newNotification` 푸시 순서, 자기 행동 억제,
행위자 없는 알림·커서·읽음·삭제 동작은 그대로입니다. 런타임 DB 행 검증·전달 재시도는 추가하지 않습니다.

### 계약 검증

- core `features/notification/__tests__/contract.test.ts`: 17종 enum 값 고정, 종류별 최소 입력과 `@ts-expect-error` 음성 계약(`tsc`로 검사).
- 서버 `notification.entity.spec.ts`: TypeORM enum 컬럼이 core enum 객체를 직접 사용함을 확인.
- 서버 `notification.service.spec.ts`: 실제 생성 입구의 타입 거부(ts-jest), actor 유무·자기 행동·저장 후 전달·저장 실패 시 미전달 검증.
- 웹 `features/notification/__tests__/definitions.test.ts`: 모든 타입의 문구·경로·시스템 표시와 한영 보간 계약, 기존 대체 표시 검증.

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

회원 탈퇴 정리 리스너는 [user 소유 이벤트 계약](../user/events/user-withdrawn.event.ts)의
`userWithdrawnEvent`·`UserWithdrawnEvent`로 발행자와 타입을 공유합니다.
`@OnDomainEvent(..., { suppressErrors: false })`와 같은 트랜잭션 매니저·오류 전파를 유지합니다.
