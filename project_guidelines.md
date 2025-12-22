# bookjeok 프로젝트 가이드라인

이 문서는 bookjeok 프로젝트에서 사용되는 개발 규칙, 디렉토리 구조 및 컨벤션에 대한 참고 자료입니다.

## 1. 기술 스택 (Technology Stack)

### 프론트엔드 (`bookjeok-front`)

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4, Shadcn UI
- **상태 관리**: Zustand
- **데이터 페칭**: TanStack Query (React Query) v5
- **폼 핸들링**: React Hook Form + Zod
- **테스트**: Vitest, React Testing Library, Storybook

### 백엔드 (`bookjeok-back`)

- **프레임워크**: NestJS
- **언어**: TypeScript
- **데이터베이스**: PostgreSQL (via TypeORM)
- **인증**: Passport (JWT, OAuth)
- **API 문서화**: Swagger

## 2. 디렉토리 구조 (Directory Structure)

이 프로젝트는 **기능 기반 아키텍처 (Feature-based Architecture)**를 따릅니다. 코드는 기술적 유형보다는 비즈니스 도메인(기능)별로 구성됩니다.

### 프론트엔드 구조 (`src/`)

- **`app/`**: Next.js App Router 페이지. 라우팅 로직과 최소한의 레이아웃 코드만 포함해야 합니다. 실제 UI 렌더링은 `views` 디렉토리의 컴포넌트에 위임합니다.
  - `(auth)`, `(default)` 등의 라우트 그룹을 사용하여 레이아웃을 분리합니다.
- **`views/`**: 페이지 단위의 조립 컴포넌트.
  - `[feature]-view/` 디렉토리 내에 위치하며, 여러 기능(features)과 공유 컴포넌트(shared)를 조합하여 완성된 페이지를 구성합니다.
  - 예: `views/book-search-view/index.tsx`
- **`features/`**: 도메인별 로직과 컴포넌트를 포함합니다. 가장 핵심적인 비즈니스 로직이 위치하는 곳입니다.
  - `features/[feature-name]/components`: 해당 기능에 특화된 UI 컴포넌트.
  - `features/[feature-name]/hooks`: 커스텀 훅 (UI 로직, 데이터 가공 등).
  - `features/[feature-name]/stores`: 해당 기능 전용 Zustand 스토어 (예: `useBookSearchStore`).
  - `features/[feature-name]/apis`: API 호출 함수.
    - `index.ts`: 클라이언트 사이드 API 호출 (React Query 등에서 사용).
    - `server.ts`: 서버 컴포넌트 전용 API 호출 (직접 페칭 또는 `service.ts` 사용).
  - `features/[feature-name]/server`: 서버 사이드 비즈니스 로직 및 서비스 레이어.
  - `features/[feature-name]/actions`: 서버 액션 (Server Actions) - `delete-action.ts`, `upload-action.ts` 등.
  - `features/[feature-name]/queries.tsx`: React Query 쿼리 훅 (`useQuery` 래퍼).
  - `features/[feature-name]/mutations.tsx`: React Query 뮤테이션 훅 (`useMutation` 래퍼).
  - `features/[feature-name]/types.ts`: 도메인 타입 정의.
  - `features/[feature-name]/constants.ts`: 도메인별 상수.
  - `features/[feature-name]/utils.ts`: 도메인별 유틸리티 함수.
- **`shared/`**: 여러 기능에서 공통으로 사용되는 코드.
  - `shared/components/ui`: 재사용 가능한 UI 컴포넌트 (버튼, 모달, 입력 필드 등).
  - `shared/components/shadcn`: Shadcn UI 기반 기본 컴포넌트.
  - `shared/libs`: 외부 라이브러리 설정 (예: `axios.ts`, `query-client.ts`).
  - `shared/providers`: 전역 프로바이더 (`query-provider`, `user-provider` 등).
  - `shared/constants`: 전역 상수 (`query-keys`, `mutation-keys` 등).
  - `shared/utils`: 공통 유틸리티 함수.
  - `shared/hooks`: 공통 커스텀 훅.
- **`layouts/`**: 전역 레이아웃 컴포넌트 (헤더, 푸터, 사이드바).

### 백엔드 구조 (`src/`)

- **`features/`**: 도메인 모듈 (예: `auth`, `book`, `user`).
  - 각 기능 모듈은 자체적인 Controller, Service, Entity, DTO를 포함합니다.
- **`common/`**: 전역 필터, 가드, 인터셉터, 데코레이터.
- **`shared/`**: 공유 유틸리티 및 상수.

## 3. 네이밍 컨벤션 (Naming Conventions)

- **파일 및 디렉토리**: `kebab-case` (예: `book-sale-card.tsx`, `user-profile/`).
- **컴포넌트**: `PascalCase` (예: `BookSaleCard`).
- **인터페이스 및 타입**: `PascalCase` (예: `User`, `BookSale`).
- **변수 및 함수**: `camelCase` (예: `handleSubmit`, `isLoading`).
- **상수**: `UPPER_SNAKE_CASE` (예: `MAX_IMAGE_COUNT`).

## 4. 개발 규칙 (Development Rules)

### 관심사의 분리 (Separation of Concerns, SoC)

- **로직 추출**: 재사용 가능한 로직은 커스텀 훅(`use...`)이나 유틸리티 함수로 추출합니다. 복잡한 로직을 UI 컴포넌트 내부에 두지 마십시오.
- **데이터 페칭 전략 (Data Fetching Strategy)**:
  - **Client Components**:
    - `features/[feature]/queries.tsx` 모듈의 React Query 훅을 사용합니다.
    - 내부적으로 `features/[feature]/apis/index.ts`의 함수를 호출하여 데이터를 가져옵니다.
    - **Axios 인스턴스 구분**:
      - `publicAxios`: 인증이 필요 없는 요청.
      - `privateAxios`: 인증(AccessToken)이 필요한 요청. 인터셉터를 통해 토큰 자동 주입 및 갱신 처리됨.
      - `internalAxios`: Next.js API Routes (`/api`) 호출 시 사용.
  - **Server Components**:
    - `features/[feature]/apis/server.ts` 또는 `features/[feature]/server/service.ts`의 함수를 사용하여 데이터를 직접 페칭합니다.
    - 서버 환경 변수(`process.env`)에 접근 가능하므로 외부 API를 직접 호출할 수 있습니다.
  - **Server Actions**:
    - 데이터 변경(Mutation)이나 폼 제출, 재검증(Revalidation) 로직은 `features/[feature]/actions/` 내의 파일을 사용합니다.
  - **UI 컴포넌트는 API `axios` 호출을 직접 하지 않습니다.** 반드시 상위 레이어(Hooks, Service)를 거쳐야 합니다.
- **기능 격리 (Feature Isolation)**:
  - 기능별 로직은 해당 기능 디렉토리 내에 완벽하게 격리되어야 합니다.
  - 다른 기능의 컴포넌트나 로직이 필요한 경우, 직접 import 하기보다 `shared`를 통하거나 명확한 인터페이스를 통해야 합니다.

### 컴포넌트 설계 (Component Design)

- **컨테이너/프레젠테이셔널 패턴 (Container/Presentational Pattern)**:
  - **View 컴포넌트 (`views/`)**: 페이지의 최상위 컨테이너 역할을 하며, 여러 Feature Container를 조립합니다.
  - **Feature Container (`features/[feature]/components`)**: 비즈니스 로직, 상태 관리(Store/Query), 이벤트 핸들링을 담당합니다.
  - **Presentational Component**: 오직 props로 전달받은 데이터만 렌더링하며, 상태 의존성이 없어야 합니다. Storybook 테스트의 주 대상입니다.
- **합성 (Composition)**: 복잡한 UI는 작은 단위의 컴포넌트 합성을 통해 구축합니다.
- **Shadcn UI 활용**: `src/shared/components/shadcn` 경로의 기본 컴포넌트를 활용하여 일관된 디자인 시스템을 유지합니다.

### 상태 관리 (State Management)

- **Server State**: `TanStack Query (React Query)`를 사용하여 관리합니다. `query-keys` 폴더에서 키를 중앙 관리합니다.
- **Client Global State**: `Zustand`를 사용합니다. `features/[feature]/stores` 또는 `features/auth/store.ts` 등 기능별 스토어 위주로 구성합니다.
- **Client Local State**: `useState`, `useReducer`, `React Hook Form` 등을 사용합니다.

### 스타일링 (Styling)

- **Tailwind CSS**: v4 버전을 사용하며, 유틸리티 클래스 위주로 작성합니다.
- **조건부 스타일링**: `cn` (clsx + tw-merge) 유틸리티를 필수적으로 사용하여 클래스 충돌을 방지합니다.
- **반응형**: 모바일 퍼스트(`min-width`) 미디어 쿼리를 기본으로 합니다.

### 테스트 (Testing)

- **Storybook**: UI 컴포넌트의 시각적 테스트를 위해 스토리를 작성합니다. `views/` 레벨보다는 `features/[feature]/components`나 `shared/` 컴포넌트 위주로 작성합니다.
- **Unit Tests**: 순수 함수 유틸리티, 복잡한 커스텀 훅에 대해 테스트를 작성합니다.

## 5. 워크플로우 (Workflow)

1.  **계획 (Plan)**: 기능 요구사항과 구현 계획을 정의합니다.
2.  **디자인 (Design)**: UI 컴포넌트를 위한 Storybook 스토리를 생성/업데이트합니다.
3.  **구현 (Implement)**: 위 구조에 따라 코드를 작성합니다.
4.  **검증 (Verify)**: 수동으로 테스트하고 자동화된 검사(린트, 빌드)를 실행합니다.
