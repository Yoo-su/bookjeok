# 01. 모노레포 구조 및 공용 패키지 컨벤션

> 북적(bookjeok) 서비스의 패키지 의존성 및 공유 라이브러리 규칙입니다.

---

## 1. 모노레포 구조 & 의존성 방향

```
packages/core        → 순수 타입, 상수, 유틸 (런타임 프론트/서버 의존성 0)
packages/api-client  → Axios 래퍼 API 호출 함수 (core에 의존)
packages/react-query → TanStack Query 훅 (core, api-client에 의존)
apps/server          → NestJS 11 + TypeORM + PostgreSQL + CLS Transactional
apps/web             → Next.js 15 App Router (react-query, api-client, core에 의존)
apps/admin           → Next.js 15 App Router (react-query, api-client, core에 의존)
```

**의존성 흐름은 단방향**: `core → api-client → react-query → web/admin`.

- 역방향 import 절대 금지.
- `apps/server`와 `apps/web` 간 직접 cross-app import 절대 금지 (`packages/core`를 통해 인터페이스/상수 공유).
- `apps/admin` 또한 독립된 axios 생성/하드코딩을 지양하고 `@bookjeok/core`의 `API_PATHS` 및 API 함수를 사용할 것.

---

## 2. 신규 기능 개발 순서 (Contract-First)

1. `packages/core` — 인터페이스, enum, API 경로 상수(`API_PATHS`), 쿼리 키 팩토리(`bookKeys`·`reviewKeys`·`orderKeys` 등 도메인별 `*Keys`)
2. `apps/server` — Entity, DTO(`implements` 코어 인터페이스), Service, Controller
3. `packages/api-client` — API 호출 함수
4. `packages/react-query` — useQuery/useMutation 훅 (`"use client"` 선언 필수)
5. `apps/web` & `apps/admin` — UI 컴포넌트 및 페이지 뷰 조립

---

## 3. `@bookjeok/core` 규칙

### 3-1. API 경로 상수 (`shared/constants/apis.ts`)

- **규칙**: 하드코딩된 API URL 문자열 절대 금지. 항상 `API_PATHS.domain.action` 사용.

```typescript
export const API_PATHS = {
  book: {
    sales: "/book/sales",
    saleDetail: (saleId: string | number) => `/book/sales/${saleId}`,
    recordView: (isbn: string) => `/book/${isbn}/view`,
  },
  user: {
    base: "/user",
    me: "/user/me",
    profile: "/user/profile",
  },
};
```

### 3-2. 타입 & DTO 파라미터 (`features/[feature]/types.ts`)

- enum은 단일 진실 공급원(SSOT)으로서 `core`에서 정의.
- 요청 파라미터는 `Create[Domain]Params`, `Update[Domain]Params` 네이밍 사용.

### 3-3. 쿼리 키 팩토리 (`features/[feature]/query-keys.ts`)

- `@lukemorales/query-key-factory` 사용. 인라인 문자열 배열(예: `['books', id]`) 사용 절대 금지.

```typescript
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const bookSaleKeys = createQueryKeys("bookSale", {
  marketSales: (params: SearchBookSalesParams) => ({
    queryKey: ["market", params],
  }),
  mySales: null,
  saleDetail: (saleId: string) => ({
    queryKey: [saleId],
  }),
});
```

### 3-4. export 등록 (`packages/core/src/index.ts`)

- 새 feature 추가 시 `constants`, `query-keys`, `types`를 루트 `index.ts`에 반드시 export.

---

## 4. `@bookjeok/api-client` 규칙

**파일**: `packages/api-client/src/features/[feature]/apis.ts`

- 인증 필요: `privateApiClient`, 공개 API: `publicApiClient`.
- 모든 API 함수는 `Promise<ResponseType>`을 반환하고 `.data`를 추출하여 반환.
- API 경로는 항상 `API_PATHS` 참조.
- `packages/api-client/src/index.ts`에 `export * from "./features/[feature]"` 추가.

---

## 5. `@bookjeok/react-query` 규칙

- **`"use client";` 선언 필수**: 모든 훅 파일 최상단에 선언.
- **파일 분리**: 도메인 폴더 내 `queries.ts`와 `mutations.ts`를 엄격히 분리.
- `queryKey`는 반드시 `featureKeys.xxx.queryKey` 사용.
- 캐시 무효화는 `queryClient.invalidateQueries({ queryKey: featureKeys._def })` 등 팩토리 기반 사용.
- `packages/react-query/src/index.ts`에 `export * from "./features/[feature]"` 추가.
