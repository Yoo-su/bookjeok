# 03. 프론트엔드(Next.js Web & Admin) 컨벤션

> `apps/web` 및 `apps/admin` 개발 시 준수해야 하는 라우팅, 상태 관리, 실시간 통신 및 UI 규칙입니다.

---

## 1. 라우트 경로 상수 (`PATHS`)

**파일**: `apps/web/src/shared/constants/paths.ts`

- **규칙**: 라우트 이동(`router.push`, `router.replace`) 및 `<Link href="...">` 시 문자열 하드코딩 절대 금지. 항상 `PATHS.XXX` 사용.

```typescript
export const PATHS = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  VERIFY_EMAIL: "/verify-email",
  LOUNGE: "/lounge",
  BOOK_MARKET: "/book/market",
  BOOK_SALES_DETAIL: (id: string | number) => `/book/sales/${id}`,
  MY_PAGE: "/my-page",
  USER_PROFILE: (handle: string) => `/users/${handle}`,
  ORDER_PAYMENT: (orderId: string | number) => `/order/payment/${orderId}`,
} as const;
```

---

## 2. 상태 관리 (Zustand)

- 스토어 위치: `features/[feature]/stores/`
- 영속성이 필요한 스토어는 `zustand/middleware`의 `persist`를 사용합니다.
- 셀렉터 패턴: 불필요한 전체 재렌더링 방지를 위해 개별 상태 구독.

```typescript
const user = useAuthStore((state) => state.user);
```

---

## 3. 실시간 통신 & 이벤트 (WebSocket)

- 동일한 상태 변경은 실시간 이벤트와 로컬 뮤테이션에 공통 캐시 갱신 정책을 사용합니다.
- 연결이 복구되면 누락됐을 수 있는 상태를 다시 동기화합니다.

---

## 4. UI 컴포넌트 & 피드백

- **컴포넌트 라이브러리**: `shadcn/ui` 및 Radix UI 프리미티브 기반 컴포넌트 (`shared/components/shadcn/`).
- **피드백**: 브라우저 기본 `alert()` 사용 금지. 반드시 `sonner`의 `toast.success()`, `toast.error()` 사용.
- **이미지 최적화**: `next/image`의 `<Image />` 사용 (`<img>` 직접 사용 지양).

### 4-1. 모바일 대응 (필수)

- **폼 확대 방지**: iOS는 폼 컨트롤 글자가 16px 미만이면 포커스 시 화면을 확대한다. `input`/`textarea`/`select`/`contenteditable`은 모바일에서 16px 이상이어야 한다. `text-base md:text-sm` 패턴을 쓰고 `text-sm`·`text-xs`를 단독으로 두지 말 것. `globals.css`의 `@media (pointer: coarse)` 블록이 전역 안전망이지만 의도는 클래스에 남긴다.
- **호버 전용 컨트롤 금지**: `opacity-0 group-hover:opacity-100`은 터치 기기에서 영구히 숨겨진다. 숨김은 `pointer-fine:` 변형으로 감쌀 것 (`pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100`).
- **터치 타깃**: 아이콘 버튼은 모바일 최소 36px(`h-9 w-9`). 마우스 환경에서만 `pointer-fine:h-8 pointer-fine:w-8` 식으로 줄인다. 텍스트 링크도 마찬가지다. `<Link>`를 맨몸으로 두면 글자 높이(16~20px)가 그대로 탭 영역이 되므로 `inline-block py-1.5`를 붙이고, 주변 레이아웃을 건드리면 안 되는 자리에서는 `py-2 -my-2`로 히트 영역만 넓힌다.
- **한글 줄바꿈**: 브라우저 기본값은 한글을 음절 단위로 끊어 단어 중간에 줄이 바뀐다. `globals.css`의 base 레이어가 `word-break: keep-all`과 `overflow-wrap: break-word`를 전역으로 건다. 개별 요소에서 `break-all`이 필요하면 유틸리티로 덮어쓸 수 있다.
- **좁은 기기(320px)**: 콘텐츠 폭은 레이아웃 `p-4`를 빼면 288px뿐이다. 고정 너비는 288px를 넘기지 말고, 단일 행 `input`의 placeholder는 16px 기준으로 잘리지 않게 짧게 쓴다(한글 15자 내외).
- **뷰포트 높이**: `h-screen`·`100vh` 사용 금지. 모바일 브라우저 크롬 때문에 높이가 어긋난다. `h-dvh`·`100dvh`를 쓴다.

### 4-2. Storybook

- **title은 src 폴더 구조를 따른다.** `shared/components/ui` → `Shared/UI/<Name>`, `features/<domain>` → `Features/<Domain>/<Name>`, `layouts` → `Layouts/<Name>`. 기능 안의 하위 영역은 한 단계 더 둔다(`Features/ReadingLog/Stack/…`, `Features/ReadingLog/Lounge/…`). 화면 이름(`Home/`)이나 `Feature/` 같은 중간 단계로 묶지 않는다.
- **title을 꼭 적는다.** 비워 두면 파일 경로에서 자동으로 이름이 붙어 위 규칙과 어긋난다.
- **뷰포트는 툴바의 320 / 375 / 768 / 1280 프리셋으로 확인한다**(`.storybook/preview.tsx`). 미리보기는 앱과 같은 `MotionConfig`로 감싸져 있다.
- 서버가 필요한 컴포넌트는 스토리 안에서 `QueryClient`에 `setQueryData`로 시드하고 `staleTime: Infinity`를 준다. 로그인 상태는 `beforeEach`에서 `useAuthStore.setState`로 만든다. 변경 요청은 로컬에 API가 없어 실패하므로, 쓰기·지우기 같은 변화는 캐시를 고치는 버튼으로 흉내 낸다(`comment-list.stories.tsx` 참고).
