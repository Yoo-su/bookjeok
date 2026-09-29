# Frontend Feature: Trade (거래 완료 · 거래 후기 · 신뢰 지표)

결제(Order)와 분리된 **거래 완료(`TradeCompletion`)** 기록을 바탕으로 양방향 거래 후기, 판매자 신뢰 지표, 거래 내역 조회를 담당하는 프론트엔드 모듈입니다.

서버의 [`trade` 모듈](../../../../server/src/features/trade/README.md)과 짝을 이루며, 데이터 통신은 전부 `@bookjeok/react-query`의 `useTrade*`, `useMyTrade*` 훅을 통합니다.

---

## 1. 폴더 구조

```
trade/
├── index.ts                             # 배럴 export
├── components/
│   ├── review/
│   │   ├── trade-review-modal.tsx       # 거래 후기 작성/수정 모달
│   │   ├── trade-review-card.tsx        # 거래 후기 개별 카드
│   │   ├── user-trade-reviews-list.tsx  # 사용자 프로필의 후기 목록
│   │   ├── seller-stats-card.tsx        # 거래 완료 건수 · 긍정 후기 비율 · 태그 통계
│   │   └── seller-trust-badge.tsx       # 프로필/판매글 상단의 신뢰 배지
│   └── history/
│       ├── trade-history-list.tsx       # 내 거래 완료 내역 목록 (구매/판매 필터)
│       ├── trade-history-card.tsx       # 거래 완료 카드 (후기 작성 버튼 포함)
│       └── trade-history-skeleton.tsx
└── __tests__/                           # Vitest 기반 단위/통합 테스트
    ├── trade-review.test.tsx
    └── trade-history.test.tsx
```

---

## 2. 핵심 로직 & UX 규칙

### 결제(Order)와의 분리 및 단일 진입점

직거래(결제 없음)와 택배거래(에스크로 결제) 모두 성사 시점에 `TradeCompletion` 기록을 생성합니다:

- **직거래**: 판매자가 채팅방 또는 마이페이지에서 거래 완료 처리
- **택배거래**: 구매자가 에스크로 구매확정(`CONFIRMED`)

후기와 신뢰 지표는 결제 여부와 무관하게 이 `TradeCompletion`만 바라보며 단일 경로로 동작합니다.

### 거래 후기 작성 규칙

- **작성 기한**: 거래 완료 시점으로부터 **14일 이내** 작성 및 수정 가능 (14일 초과 시 작성 차단)
- **양방향 작성**: 구매자와 판매자 양측 모두 상대방에게 1건씩 작성 가능
- **태그 검증**: `@bookjeok/core`의 `TRADE_REVIEW_TAG_SPECS`에 정의된 역할(`BUYER`/`SELLER`) 및 거래 방식(`DIRECT`/`DELIVERY`)에 맞는 태그만 선택 가능
- **삭제 불가**: 평판 세탁 방지를 위해 작성된 후기는 삭제할 수 없으며 수정만 허용됩니다.

### 신뢰 지표 (Trust Badge & Stats)

- `seller-trust-badge`: 판매글 상세 및 프로필 상단에 노출되며(프로필 쪽 배지는 `NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED`가 `true`일 때만 보이고, 판매글 상세 배지와 프로필의 후기 탭·목록은 플래그와 무관), "거래 완료 N건 · 긍정 후기 N%"와 같은 객관적 사실 수치만 표시합니다. 별점 환산이나 등급제 같은 왜곡 지표는 쓰지 않습니다.
- `seller-stats-card`: 프로필 페이지에서 직거래/택배거래 완료 건수 분리 집계 및 받은 긍정 태그 순위를 시각화합니다.

---

## 3. 테스트

`__tests__/`에 Vitest + Testing Library 기반 테스트가 있습니다.

| 파일                     | 대상                                                       |
| ------------------------ | ---------------------------------------------------------- |
| `trade-review.test.tsx`  | 후기 모달 작성/수정, 태그 선택, 유효성 검증                |
| `trade-history.test.tsx` | 거래 내역 목록 필터(ALL/BUYER/SELLER), 후기 작성 버튼 노출 |

```bash
pnpm --filter @bookjeok/web test
```

---

## 4. 관련 모듈

- 서버 도메인: [`features/trade`](../../../../server/src/features/trade/README.md)
- 에스크로 결제: [`features/order`](../order/README.md)
- 중고책 판매글: [`features/book-sale`](../book-sale/README.md)
- 채팅 인터랙션: [`features/chat`](../chat/README.md)
