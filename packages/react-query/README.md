# @bookjeok/react-query

TanStack Query(React Query v5)를 기반으로 한 북적 플랫폼 공용 데이터 페칭 및 캐시 상태 관리 훅 패키지입니다.

---

## 🏛 설계 원칙

1. **`@bookjeok/api-client` & `@bookjeok/core` 기반 표준화**
   - 모든 쿼리/뮤테이션 훅은 내부적으로 `@bookjeok/api-client`의 함수와 `@bookjeok/core`의 쿼리 키 팩토리를 사용합니다.
   - 호출부에서 복잡한 캐시 키나 엔드포인트를 몰라도 훅 하나로 데이터 패칭, 캐싱, 옵티미스틱 업데이트를 수행합니다.

2. **순수 데이터 훅 지향**
   - 훅 내부에서 Toast나 Router 이동 등 특정 UI 프레임워크에 종속된 부수 효과를 유발하지 않습니다.
   - 성공/실패 시 콜백(`onSuccess`, `onError`)이나 반환값을 통해 뷰 계층에서 UI를 제어합니다.

---

## 🚀 사용법

```typescript
"use client";

import { useBookListQuery, useCreateBookSaleMutation } from "@bookjeok/react-query";

export function BookListComponent() {
  // 1. 도서 목록 조회 쿼리
  const { data: books, isLoading } = useBookListQuery({ query: "소설", start: 1 });

  // 2. 판매글 등록 뮤테이션
  const { mutate: createSale, isPending } = useCreateBookSaleMutation({
    onSuccess: (newSale) => {
      console.log("등록 완료:", newSale.id);
    },
  });

  return (
    // ... UI 렌더링
  );
}
```

---

## 📂 패키지 구조

- `src/features/*`: 도메인별 쿼리(`queries.ts`) 및 뮤테이션(`mutations.ts`) 훅
  - `auth`, `book`, `book-sale`, `chat`, `comment`, `feedback`, `insights`, `notification`, `order`, `reading-log`, `review`, `trade`, `user`
- `src/shared/*`: 도메인에 속하지 않는 공용 훅 (`use-idempotency-keys.ts`)
- `src/index.ts`: 루트 배럴 export

---

## 🏗️ 개발 가이드 (Development)

1. **상대 경로 사용**: 패키지 내 다른 모듈 참조 시 반드시 **상대 경로**를 사용하세요.
2. **캐시 무효화 연계**: 뮤테이션 작성 시 연관된 쿼리 키(`@bookjeok/core`의 `bookKeys`, `reviewKeys`, `orderKeys` 등)를 `queryClient.invalidateQueries`로 무효화하도록 처리하세요. 무효화 범위가 넓으면 불필요한 재요청이, 좁으면 낡은 캐시가 남습니다.
3. **`"use client"` 선언 필수**: 모든 훅 파일 최상단에 선언해야 Next.js App Router의 서버 컴포넌트 경계에서 문제가 없습니다.
4. **계정 전환 시 캐시 격리**: 로그인 사용자가 바뀌면 이전 사용자 캐시가 노출되지 않도록 소비 측(`apps/web`의 `QueryProvider`)에서 쿼리 클라이언트를 초기화합니다. 사용자별 데이터를 다루는 훅을 추가할 때 이 전제를 확인하세요.
5. **재시도가 부작용을 낳는 뮤테이션**: 주문·거래처럼 같은 요청이 두 번 반영되면 안 되는 훅은 `useIdempotencyKeys`로 대상별 키를 발급해 `x-idempotency-key`로 보냅니다. 서버 인터셉터가 완료된 키를 만나면 처음 응답을 그대로 재생합니다. 키는 **성공했을 때만** 버립니다 — 실패에는 "응답을 못 받았을 뿐 서버는 반영됨"이 섞여 있어, 새 키를 뽑으면 그 요청이 한 번 더 실행됩니다. 새로고침을 넘어야 하는 경로(결제 승인)는 메모리 대신 URL로 다시 들어오는 값(토스 `paymentKey`)을 키로 씁니다.
6. **새 훅 추가 시**:
   - `src/features/[feature]/`에 훅을 작성하고 `src/index.ts`에서 export합니다.
   - 변경 후 `pnpm --filter @bookjeok/react-query build` (또는 타입 체크)로 검증합니다.
