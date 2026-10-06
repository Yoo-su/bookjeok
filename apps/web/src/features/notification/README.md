# Frontend Feature: Notification (실시간 알림)

Socket.IO로 서버 알림을 실시간 수신하고, 헤더 벨 아이콘과 팝오버 목록으로 노출하는 기능입니다.

---

## 폴더 구조

```
notification/
├── providers/
│   └── notification-provider.tsx        # 소켓 구독만 담당하는 렌더리스 프로바이더
├── hooks/
│   ├── use-notification-socket.ts       # 이벤트 수신·재연결 시 재조회
│   └── use-notification-actions.ts      # 새 알림 토스트·목록/개수 재조회
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
    ├── definitions.ts                   # 17종 문구·이동 경로·시스템 표시 등록부
    └── index.ts                         # 토스트·목록에서 공유하는 조회 함수
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

### 재연결 복구

서버는 연결 시 놓친 알림을 다시 보내지 않고, 배지의 `useUnreadCountQuery`는 `staleTime: Infinity`입니다. 그래서 소켓이 끊긴 사이 저장된 알림은 다음 이벤트나 새로고침 전까지 배지·목록에 반영되지 않았습니다. `useNotificationSocket`은 채팅 provider와 같은 규칙으로 소켓 수명 동안 `connect`를 듣고, **두 번째 이후의 connect(재연결, 토큰 갱신으로 새 소켓이 붙는 경우 포함)** 에 `notificationKeys._def`를 무효화합니다. 토스트는 띄우지 않습니다. 열려 있는 배지는 바로, 닫혀 있는 팝오버 목록은 다음에 열 때 다시 조회합니다. 회귀 테스트는 `__tests__/notification-reconnect.test.tsx`.

---

## 알림 타입 (17종)

core의 `NotificationType`을 서버와 함께 사용합니다. `utils/definitions.ts`가 모든 종류의 번역 키·보간 인자·이동 경로·시스템 표시 여부를 한곳에서 정의하고, `utils/index.ts`의 기존 조회 함수가 토스트와 목록에 같은 정의를 전달합니다.

| 분류      | 타입                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| 커뮤니티  | `REVIEW_REACTION`, `REVIEW_COMMENT`, `COMMENT_LIKE`                             |
| 거래 진행 | `BUYER_SELECTED`, `OTHER_BUYER_TRADING`, `PAYMENT_COMPLETED`, `PAYMENT_EXPIRED` |
| 배송      | `SHIPPING_STARTED`, `DELIVERY_COMPLETED`, `SHIPPING_DEADLINE_IMMINENT`          |
| 확정·취소 | `AUTO_CONFIRM_IMMINENT`, `PURCHASE_CONFIRMED`, `ORDER_CANCELLED`                |
| 후기      | `TRADE_REVIEW_RECEIVED`                                                         |
| 직거래    | `TRADE_RESERVED`, `TRADE_COMPLETED`                                             |
| 북적 공지 | `FEEDBACK_REPLIED` — 문의 답변. **행위자 없음**(`actorId` null)                 |

행위자 없는 알림(`isSystemNotification`)은 프로필 사진·닉네임 대신 `BRAND_ASSETS.symbol`(`/brand/pen-v1/symbol.svg`, A 자유로운 펜선)과 "북적"을 보입니다. 로고 경로는 헤더·로딩·오류 화면과 같은 상수를 사용합니다.

새 타입은 core enum·`NotificationMetadataMap` → 서버 생성 호출·DB enum DDL → 웹 등록부·한영 번역 순으로 추가합니다. 등록부는 enum 전체를 요구하는 mapped type이며 각 함수의 metadata도 종류별로 검사합니다. 번역 키는 한영 카탈로그 모두에 있어야 합니다.

`__tests__/definitions.test.ts`는 전 종류의 문구·보간 인자·이동 경로·시스템 표시와 한영 번역 렌더링을 검사합니다. 예시에 새 필수 metadata가 빠지면 웹 타입 검사에서 드러납니다. 예전 행의 불완전한 metadata에 대한 기존 대체 문구·링크와 미지원 타입의 기본 문구·`#`도 유지합니다. `#`는 리뷰 대상이 없는 댓글 좋아요 등에 여전히 쓰지만, 신규 타입의 **등록 누락**은 타입 검사와 계약 테스트로 차단합니다.

core 수정 후 먼저 재빌드하고 웹 타입 검사·테스트를 실행하세요. 맥북 전체 테스트는 `--maxWorkers=1 --no-file-parallelism`으로 제한합니다. 03 작업에서는 소켓·쿼리 갱신·읽음·삭제·컴포넌트 렌더링 흐름을 변경하지 않았습니다(재연결 복구는 이후 추가).

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
