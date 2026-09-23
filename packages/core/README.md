# @bookjeok/core

북적 플랫폼 전체(Web, Admin, Server)에서 공유되는 순수 도메인 타입, DTO 인터페이스, API 경로 상수 및 포맷팅 유틸리티 패키지입니다.

---

## 📦 구성 요소

### 1. 도메인 타입 (`src/features/*/types.ts`)

- **14개 핵심 도메인 완비**: `auth`, `book`, `book-sale`, `chat`, `comment`, `insights`, `intro`, `llm`, `notification`, `order`, `reading-log`, `review`, `trade`, `user`
- **단일 진실 공급원(SSOT)**: 모든 요청 파라미터(`Params`), 응답 구조(`Response`), 공용 엔티티 모양 정의

### 2. 상수 및 쿼리 키 (`src/shared/constants`, `src/features/*/constants.ts`)

- **API Paths (`API_PATHS`)**: 백엔드 REST API 엔드포인트 경로 상수
- **Query Key Factories (`bookKeys`, `reviewKeys`, `orderKeys`, `tradeKeys` 등)**: `@lukemorales/query-key-factory` 기반 React Query 캐시 키 표준화
- **도메인 Enum**: `OrderStatus`, `SaleStatus`, `TradeMethod`, `TradeReviewTag`, `NotificationType` 등 서버 enum과 1:1 대응

### 3. 순수 유틸리티 (`src/shared/utils`)

- **Format**: `formatPrice` (통화 포맷팅), `formatAladinCoverImage` (알라딘 표지 URL을 cover500으로 치환. 2026-09-09 R2 컷오버 후 DB에 알라딘 URL이 없어 사실상 no-op, 정리 대상)
- **Date**: `getSimpleDate`, `formatPostDate` (상대 시간 포맷팅)

---

## 🚀 사용법

```typescript
import {
  formatPrice,
  bookKeys,
  type UsedBookSale,
  API_PATHS,
} from "@bookjeok/core";

const formatted = formatPrice(15000); // ₩15,000
```

---

## 🏗️ 개발 가이드 (Development)

1. **런타임 오염 0B (Platform Agnostic)**: 브라우저(`window`, `document`)나 Node.js(`fs`, `path`) 전용 라이브러리를 임포트하지 마세요. 순수 TypeScript 인터페이스/함수만 작성합니다.
2. **NestJS DTO와의 연동**: 서버의 DTO 클래스가 코어 인터페이스를 `implements`하여 컴파일 타임 일관성을 보장합니다.
3. **변경 시 영향 검증**: 코어 패키지 수정 후 반드시 `pnpm --filter @bookjeok/core build`를 실행하고 Server/Web/Admin의 타입 체크를 통과해야 합니다.
4. **루트 export 필수**: 새 타입·상수·유틸을 추가하면 `src/index.ts`에 export를 등록해야 다른 패키지에서 임포트할 수 있습니다.
5. **Contract-First 순서**: 새 기능은 `core` → `server`(DTO `implements`) → `api-client` → `react-query` → `web/admin` 순으로 작업합니다. 자세한 내용은 [.agents/rules/01-monorepo-packages.md](../../.agents/rules/01-monorepo-packages.md)를 참고하세요.
