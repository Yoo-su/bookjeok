# Frontend Feature: Notification (실시간 알림)

Socket.IO로 서버 알림을 실시간 수신하고, 헤더 벨 아이콘과 팝오버 목록으로 노출하는 기능입니다.

---

## 폴더 구조

```
notification/
├── providers/
│   └── notification-provider.tsx        # 소켓 구독만 담당하는 렌더리스 프로바이더
├── hooks/
│   ├── use-notification-socket.ts       # 소켓 연결·이벤트 수신·쿼리 캐시 갱신
│   └── use-notification-actions.ts      # 읽음 처리, 전체 읽음, 삭제
├── components/
│   ├── widgets/
│   │   └── notification-bell.tsx        # 안 읽은 개수 배지가 붙은 벨 아이콘
│   └── notification-popover/
│       ├── index.tsx                    # 팝오버 컨테이너
│       ├── notification-list.tsx        # 목록 + 무한 스크롤
│       └── notification-item.tsx        # 개별 알림 (타입별 아이콘·문구·이동 경로)
├── mutations/
│   └── index.tsx
└── utils/
    └── index.ts                         # 알림 타입 → 라벨/아이콘/링크 매핑
```

---

## 구조

`NotificationProvider`는 UI를 그리지 않습니다(`return null`). 레이아웃 상단에 한 번만 마운트해 소켓 구독을 유지하고, 실제 표시는 `NotificationBell`과 팝오버가 담당합니다. 알림 상태를 별도 스토어로 두지 않고 **TanStack Query 캐시를 단일 소스**로 씁니다 — 소켓 이벤트가 오면 관련 쿼리를 무효화하거나 캐시를 직접 갱신합니다.

```
서버 NotificationGateway
        │ (socket event)
        ▼
useNotificationSocket ──▶ queryClient 캐시 갱신
        │
        ├──▶ NotificationBell        안 읽은 개수 배지
        └──▶ NotificationPopover     목록 · 읽음 · 삭제
```

---

## 알림 타입 (17종)

서버 `NotificationType`과 1:1로 대응하며, `utils/index.ts`가 타입별 문구·아이콘·이동 경로를 매핑합니다.

| 분류      | 타입                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| 커뮤니티  | `REVIEW_REACTION`, `REVIEW_COMMENT`, `COMMENT_LIKE`                             |
| 거래 진행 | `BUYER_SELECTED`, `OTHER_BUYER_TRADING`, `PAYMENT_COMPLETED`, `PAYMENT_EXPIRED` |
| 배송      | `SHIPPING_STARTED`, `DELIVERY_COMPLETED`, `SHIPPING_DEADLINE_IMMINENT`          |
| 확정·취소 | `AUTO_CONFIRM_IMMINENT`, `PURCHASE_CONFIRMED`, `ORDER_CANCELLED`                |
| 후기      | `TRADE_REVIEW_RECEIVED`                                                         |
| 직거래    | `TRADE_RESERVED`, `TRADE_COMPLETED`                                             |
| 북적 공지 | `FEEDBACK_REPLIED` — 문의 답변. **행위자 없음**(`actorId` null)                 |

행위자 없는 알림(`isSystemNotification`)은 프로필 사진·닉네임 대신 `/logo-square-sketch.svg`와 "북적"을 보입니다.

새 알림 타입을 추가할 때는 서버 enum → `@bookjeok/core` 타입 → `utils/index.ts` 매핑 순으로 함께 갱신해야 합니다. 매핑이 빠지면 알림은 도착하지만 문구와 링크가 비어 보입니다.

---

## 액션

`use-notification-actions`가 제공합니다.

| 액션         | 엔드포인트                        |
| ------------ | --------------------------------- |
| 개별 읽음    | `PATCH /notifications/:id/read`   |
| 전체 읽음    | `PATCH /notifications/read-all`   |
| 삭제         | `DELETE /notifications/:id`       |
| 안 읽은 개수 | `GET /notifications/unread-count` |

읽음 처리는 옵티미스틱 업데이트로 배지를 즉시 반영한 뒤 서버 응답으로 정합성을 맞춥니다.

---

## 관련 문서

- 서버: [`features/notification`](../../../../server/src/features/notification/README.md)
- 거래 알림의 발행 지점: [`features/order`](../../../../server/src/features/order/README.md#이벤트--알림-팬아웃)
