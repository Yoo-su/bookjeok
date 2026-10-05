# @bookjeok/api-client

북적 백엔드 API와의 HTTP 통신을 담당하는 공용 클라이언트 패키지입니다.

---

## 🛠 주요 특징

### 1. 캡슐화된 클라이언트 인스턴스 (`publicApiClient`, `privateApiClient`)

- **`publicApiClient`**: 인증 헤더가 필요 없는 공개 API 호출용 (도서 검색, 인사이트 조회, 라운지 피드 등).
- **`privateApiClient`**: JWT Access Token 인증이 필요한 보호된 API 호출용 (독서 기록, 중고책 등록, 리뷰 작성, 주문·결제, 프로필 수정 등).
- 이 패키지의 두 인스턴스는 **설정 없이 비어 있는 Axios**입니다(`src/client.ts`). baseURL, 응답 봉투(`{ success, data }`) 벗기기, 토큰 첨부, **Silent Token Refresh**는 소비 앱이 사후에 붙입니다. 웹은 `apps/web/src/shared/libs/axios.ts`를 import해 설정하며, 갱신까지 실패하면 세션을 정리하고 로그인 플로우로 위임합니다.
- 새 소비자(스크립트·다른 앱)가 초기화 없이 API 함수를 부르면 baseURL이 없고 반환값이 봉투째 나옵니다. 현재 소비자는 웹뿐이라 공용 초기화 함수는 두지 않았습니다. 두 번째 소비자가 생기면 baseURL·봉투 처리를 이 패키지로 옮기고 토큰·갱신만 앱 어댑터에 남기세요.
- 서버의 `GlobalExceptionFilter`가 내려주는 표준 에러 형태를 그대로 다루므로, 호출부는 `ERROR_CODES`의 `code` 값으로 분기할 수 있습니다.

### 2. 표준 API 함수 인터페이스

- `@bookjeok/core`의 인터페이스를 준수하는 완전한 타입 안전성을 제공합니다.
- 호출 시 Axios 인스턴스를 주입할 필요 없이 순수 파라미터만 전달하여 호출합니다.

### 3. 도메인 커버리지

`auth`, `book`(AI 요약 조회 포함), `book-sale`, `chat`, `comment`, `feedback`, `insights`, `notification`, `order`, `reading-log`, `review`, `trade`, `user` 13개 도메인의 API 함수를 제공합니다. 멱등 키 헤더 처리는 `src/utils/idempotency.ts`.

---

## 🚀 사용법

```typescript
// 반드시 루트(@bookjeok/api-client)를 통해 임포트합니다.
import {
  getBookList,
  createBookSale,
  exchangeAuthTicket,
} from "@bookjeok/api-client";

// 1. 공개 API 호출 예시
const books = await getBookList({ query: "해리포터", start: 1 });

// 2. 인증 필요 API 호출 예시 (내부에서 토큰 자동 첨부)
const newSale = await createBookSale({
  title: "클린 코드 팝니다",
  price: 15000,
  isbn: "9788966260959",
  city: "서울특별시",
  district: "강남구",
  content: "상태 깨끗합니다.",
  imageUrls: [],
});
```

---

## 🏗️ 개발 가이드 (Development)

1. **상대 경로 사용**: 패키지 내 다른 모듈 참조 시 반드시 **상대 경로**를 사용하세요. 배럴 파일(`index.ts`) 등을 통한 자기 참조는 순환 의존성을 유발합니다.
2. **비즈니스 로직 및 UI 코드 금지**: 이 패키지는 순수 HTTP 통신 엔진 역할만 수행합니다. React Hook이나 상태 관리는 `@bookjeok/react-query` 또는 프론트엔드 앱에서 처리하세요.
3. **새 API 엔드포인트 추가 시**:
   - `packages/core`의 `API_PATHS` 및 도메인 타입을 먼저 확인/추가합니다.
   - `src/features/[feature]/apis.ts`에 함수를 추가하고 `src/index.ts`에서 export합니다.
   - 변경 후 `pnpm --filter @bookjeok/api-client build`를 실행하여 빌드 무결성을 확인합니다.
