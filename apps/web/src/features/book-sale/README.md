# Frontend Feature: Book Sale (중고책 장터)

중고 도서 판매글의 등록·수정·탐색·상세를 담당합니다. 결제와 주문 관리는 [`order`](../order/README.md), 거래 채팅은 [`chat`](../chat/README.md)이 맡습니다.

## 1. 폴더 구조

```
book-sale/
├── actions/
│   ├── upload-action.ts              # Server Action — Vercel Blob 업로드
│   └── delete-action.ts              # Server Action — Blob 삭제
├── services/
│   └── image-upload-service.ts       # 압축 → 업로드 → 진행률 오케스트레이션
├── hooks/
│   ├── use-book-sale-form.ts         # 등록 폼 (RHF + Zod)
│   ├── use-book-sale-edit-form.ts    # 수정 폼
│   ├── use-book-sale-search-params.ts# 필터 ↔ URL 동기화
│   ├── use-user-location.ts          # 사용자 위치 확보 (거리순 정렬용)
│   └── use-sale-view.ts              # 상세 조회수 기록
├── mutations/
├── __tests__/                        # queries / mutations
└── components/
    ├── sale-market/                  # 장터 메인
    │   ├── video-hero/               # 영상 기반 시네마틱 히어로
    │   ├── book-sale-filter/         # 지역·가격·거래방식·정렬 필터
    │   ├── book-sale-grid/
    │   ├── book-market/ (+ with-params, popular-book-sale-list)
    │   └── recent-sale-slider/
    ├── sale-detail/
    │   ├── book-sale-detail/         # header · book-info-card · content
    │   │                             #  · image-carousel · actions
    │   │                             #  · sale-location-map (카카오 맵)
    │   └── related-sales/
    ├── sale-form/
    │   ├── book-sale-form/ (+ schema.ts)
    │   ├── book-sale-edit-form/ (+ schema.ts)
    │   ├── book-sale-edit/
    │   └── region-display-card.tsx
    ├── my-sales/
    │   └── book-sale-history-list/   # index · item · skeleton
    └── common/
        ├── book-sale-item/           # 합성 컴포넌트 (root/parts/context/skeleton)
        ├── sale-status-select.tsx    # 상태 변경 드롭다운 셀렉트
        ├── trade-counterparty-modal.tsx # 거래 상대 지정/완료 모달
        ├── sale-status-badge.tsx     # FOR_SALE · RESERVED · SOLD · WITHDRAWN
        ├── trade-method-badge.tsx    # DIRECT_ONLY · DELIVERY_ONLY · BOTH
        ├── upload-progress-modal.tsx
        └── book-sale-json-ld/        # Product 구조화 데이터
```

## 2. 핵심 로직

### 합성 컴포넌트 패턴 (`book-sale-item`)

목록·슬라이더·내 판매내역 등 노출 맥락마다 필요한 정보가 달라서, 하나의 고정 카드 대신 Context 기반 합성 컴포넌트로 만들었습니다.

```tsx
<BookSaleItem.Root sale={sale}>
  <BookSaleItem.Thumbnail />
  <BookSaleItem.Title />
  <BookSaleItem.Price />
  <BookSaleItem.StatusBadge />
</BookSaleItem.Root>
```

`root.tsx`가 Context를 제공하고 `parts.tsx`가 조각을 노출합니다. 리뷰의 `review-card`도 같은 패턴입니다.

홈의 최근 판매 캔버스는 앵커가 없는 클릭 영역입니다. 판매글 상세로 `router.push`하기 직전에 `signalNavigationStart()`를 호출해 공통 이동 진행 표시기를 띄웁니다.

### 이미지 업로드

```
파일 선택
  │
  ▼ browser-image-compression 으로 클라이언트 압축
image-upload-service — 순차 업로드 + 진행률 계산
  │
  ▼ upload-action (Server Action)
Vercel Blob 저장 → URL 반환
  │
  ▼
upload-progress-modal 로 진행률 표시, 실패 시 개별 재시도
```

판매글 삭제·이미지 교체 시 `delete-action`으로 더 이상 참조되지 않는 Blob을 정리합니다. Server Action을 쓰는 이유는 `BLOB_READ_WRITE_TOKEN`을 브라우저에 노출하지 않기 위해서입니다. 폼의 `bodySizeLimit`은 `next.config.ts`에서 10MB로 설정되어 있습니다.

### 위치 기반 탐색

- `use-user-location`이 사용자 좌표를 확보하고, 거리순 정렬 시 `lat`/`lng`/`radius`를 쿼리에 실어 보냅니다.
- 서버는 `cube`/`earthdistance` GiST 인덱스로 거리를 계산합니다(PostGIS 아님).
- `sale-location-map`은 `react-kakao-maps-sdk`로 거래 희망 장소를 표시합니다 — `NEXT_PUBLIC_KAKAO_APP_KEY`가 필요합니다.
- 목록은 **커서 페이지네이션**입니다. 응답의 `nextCursor`를 다음 요청에 그대로 전달합니다.

### 폼 검증

`schema.ts`(Zod)를 React Hook Form의 resolver로 연결합니다. 등록과 수정은 허용 필드가 달라 스키마를 분리했습니다. 거래 방식(`tradeMethod`) 선택은 이후 주문·결제 가능 여부를 결정하므로 등록 폼에서 반드시 지정됩니다.

## 3. 상태 관리 및 잠금 규칙

| SaleStatus  | 표시     | 설명                                                    |
| ----------- | -------- | ------------------------------------------------------- |
| `FOR_SALE`  | 판매중   | 구매 희망자와 대화 및 거래 가능                         |
| `RESERVED`  | 예약중   | 판매자가 직거래 상대를 지정했거나 에스크로 결제 대기 중 |
| `SOLD`      | 판매완료 | 직거래 완료 처리 또는 에스크로 구매확정 완료            |
| `WITHDRAWN` | 판매취소 | 회원 탈퇴 시 시스템이 자동 전환 (사용자 직접 선택 불가) |

### 판매글 변경 잠금 정책

- **상태 변경**: 판매자는 판매글 상세 및 내 판매글 목록에서 `SaleStatusSelect`를 통해 수동으로 상태를 전환할 수 있습니다. 예약중/판매완료 전환 시 `TradeCounterpartyModal`이 열려 거래 상대 후보를 선택하도록 유도합니다.
- **수정/삭제 잠금**:
  - `hasActiveOrder === true` (에스크로 결제/배송 진행 중): 수정/삭제/상태변경 전체 잠금
  - `hasTradeCompletion === true` (완료 기록 존재): 거래 후기와 신뢰 지표 왜곡 방지를 위해 수정 불가, 삭제 불가(운영자 예외), 판매완료 상태 되돌리기 불가

## 4. 관련 모듈

- 서버 도메인: [`features/used-book-sale`](../../../../server/src/features/used-book-sale/README.md), [`features/trade`](../../../../server/src/features/trade/README.md), [`features/order`](../../../../server/src/features/order/README.md)
- 웹 도메인: [`features/trade`](../trade/README.md), [`features/order`](../order/README.md), [`features/chat`](../chat/README.md)
- 뷰: `book-market-view`, `book-sale-detail-view`, `book-sale-form-view`, `book-sale-edit-view`, `book-sale-history-view`

## 검색·공유 (2026-09-19)

- Product availability는 공용 `SaleStatus`로 매핑합니다. `SOLD`는 `SoldOut`, 알 수 없는 상태는 `OutOfStock`입니다. 근거 없는 브랜드·가격 유효기간은 출력하지 않습니다.
- `utils/share.ts`를 OG·카카오 공유가 함께 사용해 도서명·가격·판매 상태·지역·첫 실물 사진(없으면 표지)을 일치시킵니다.
- 마켓 기본 목록은 필수 서버 쿼리입니다. 실패하면 ISR 재생성도 실패시켜 기존 정상 페이지를 보존합니다. sitemap은 공개 판매글 전체를 커서로 순회하며, 마켓 OG는 정적 전용 카드를 사용합니다.

- 공개 목록 페이지는 빌드 시 사전 생성을 생략하고 첫 요청부터 ISR을 생성합니다. API 없는 CI에서도 빌드할 수 있고, 운영 조회 실패는 정상 캐시를 빈 목록으로 덮어쓰지 않습니다.
