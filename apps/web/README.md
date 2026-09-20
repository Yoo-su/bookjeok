# 📚 @bookjeok/web (Frontend)

**Next.js 15 (App Router) & React 19** 기반의 북적 사용자 웹 서비스입니다.
도서 검색·AI 추천, 독서 기록, 중고책 거래와 에스크로 결제, 실시간 채팅·알림, 리뷰 커뮤니티를 다국어 반응형 UI로 제공합니다.

---

## 🚀 주요 기능 (Key Features)

- **🤖 대화형 AI 도서 탐색 (SSE)** — `fetch` + `ReadableStream` 기반 커스텀 SSE 클라이언트로 추천 결과를 조각 단위 렌더링
- **💳 에스크로 결제 & 거래 관리** — 토스페이먼츠 SDK 연동, 주문 상태 타임라인, 배송/분쟁/구매확정 및 직거래/택배 거래 완료·후기 관리
- **💬 실시간 소통** — Socket.IO 1:1 거래 채팅(타이핑 인디케이터·읽음 표시)과 전역 실시간 알림 14종
- **📖 독서 기록 & 라운지** — 월별 캘린더, 통계, Framer Motion 3D 카드 덱, 공개 피드
- **✍️ 리치 텍스트 리뷰** — Tiptap 3 에디터, 이미지 업로드·리사이즈, `sanitize-html` 정제 렌더링
- **📊 인사이트 시각화** — ApexCharts 기반 지역·가격·태그·리액션 대시보드
- **⚡ 데이터 페칭 & 캐싱** — TanStack Query v5 기반 옵티미스틱 업데이트, 무한 스크롤/커서 페이지네이션, RSC prefetch
- **🔒 크로스 도메인 보안 인증** — 소셜 로그인 1회용 티켓 교환, Axios 인터셉터 Silent Refresh, 라우트 가드
- **🌍 다국어 & SEO** — `next-intl`(ko/en), 동적 sitemap/robots/manifest, RSS 피드, JSON-LD, canonical/hreflang
- **🎨 UI/UX** — Tailwind CSS v4 + Radix UI, 다크 모드(`next-themes`), 전역 확인 다이얼로그, 배경음악 플레이어

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분              | 기술 스택                                                                                |
| :---------------- | :--------------------------------------------------------------------------------------- |
| **Framework**     | Next.js 15 (App Router, RSC, ISR, Route Handlers, Server Actions), React 19              |
| **Language**      | TypeScript 5                                                                             |
| **Server State**  | TanStack Query v5 (`@bookjeok/react-query`), `@lukemorales/query-key-factory`            |
| **Client State**  | Zustand v5                                                                               |
| **API Client**    | `@bookjeok/api-client`, `@bookjeok/core`                                                 |
| **Styling**       | Tailwind CSS v4, `tailwind-merge`, `class-variance-authority`, `@tailwindcss/typography` |
| **UI**            | Radix UI (shadcn/ui 패턴), Lucide React, `sonner`                                        |
| **Animation**     | Framer Motion / `motion`, GSAP, Swiper                                                   |
| **Editor**        | Tiptap 3 (Image+resize, Link, Highlight, TextAlign, Color, Underline, BubbleMenu)        |
| **Form**          | React Hook Form + Zod 4                                                                  |
| **Chart**         | ApexCharts (`react-apexcharts`)                                                          |
| **Map / Address** | `react-kakao-maps-sdk`, `react-daum-postcode`                                            |
| **Payment**       | `@tosspayments/tosspayments-sdk` v2                                                      |
| **Realtime**      | `socket.io-client`, 커스텀 SSE 클라이언트                                                |
| **i18n / Theme**  | `next-intl` 4, `next-themes`                                                             |
| **Media**         | `browser-image-compression`, `@vercel/blob`                                              |
| **Security**      | `sanitize-html`                                                                          |
| **Analytics**     | Vercel Analytics/Speed Insights, GA4, Microsoft Clarity, AdSense                         |
| **Test / Docs**   | Vitest 4 + Testing Library + jsdom, Storybook 8, `@next/bundle-analyzer`                 |

---

## 📂 프로젝트 구조 (Structure)

```
src/
├── app/                      # Next.js App Router
│   ├── [locale]/             # 다국어 라우트
│   │   ├── (auth)/           # login · signup · callback · verify-email
│   │   ├── (default)/        # 홈 · lounge · insights · my-page(trades 포함) · order · 약관
│   │   ├── book/             # search · market · [isbn]/detail · sales · reviews
│   │   └── share/deck/[handle]/
│   ├── api/                  # route handlers (upload, revalidate)
│   ├── sitemap.ts · robots.ts · manifest.ts · rss.xml/
│   ├── not-found.tsx · global-error.tsx
├── views/                    # 페이지 단위 조립 뷰 ([feature]-view/)
├── features/                 # 도메인별 기능 UI & 상태
│   ├── auth/                 # 로그인·회원가입·티켓 교환·이메일 인증·가드
│   ├── book/                 # 검색, 상세, AI 챗(SSE), 최근 본 책
│   ├── book-sale/            # 판매글 등록/수정/탐색/상세, 지도, 비디오 히어로, 이미지 업로드
│   ├── order/                # 에스크로 결제, 주문 상세, 배송/분쟁 모달
│   ├── trade/                # 직거래/택배 거래 완료 내역, 양방향 거래 후기, 신뢰 지표 배지/통계
│   ├── chat/                 # 1:1 실시간 채팅 및 거래 액션 카드
│   ├── notification/         # 실시간 알림 (벨 · 팝오버)
│   ├── reading-log/          # 캘린더·통계·3D 덱·독서 라운지
│   ├── review/               # Tiptap 리뷰 작성/조회/리액션
│   ├── comment/              # 댓글 · 좋아요
│   ├── user/                 # 프로필·통계·위시리스트·탈퇴
│   ├── insights/             # 서비스 통계 차트
│   ├── intro/                # 홈 히어로 인트로
│   ├── music/                # 전역 배경음악 플레이어
│   └── confirm/              # 전역 확인 다이얼로그
├── shared/
│   ├── components/           # shadcn · common · editor · map · ads · analytics · icons
│   ├── providers/            # QueryProvider · UserProvider · SocketProvider
│   ├── hooks/                # 이미지 업로드, 오버레이, 스크롤, reduced-motion 등
│   ├── config/               # env · metadata · json-ld · i18n(routing/request)
│   ├── constants/            # PATHS · public-routes · cache
│   ├── libs/                 # axios · query-client
│   ├── utils/                # 포맷터, sanitize, 에러 핸들러, 캐시 퍼지 등
│   ├── actions/              # revalidate server action
│   └── i18n/messages/        # ko.json · en.json
├── layouts/                  # DefaultLayout · Header · Navigation
├── styles/
├── middleware.ts             # next-intl 로케일 라우팅
└── __tests__/setup.ts        # Vitest 셋업 (jest-dom 매처 등록)
```

각 `features/*`에는 개별 README가 있습니다. 컴포넌트 폴더 구조 규칙은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), ISR·TanStack Query 캐시 구조는 [docs/CACHING.md](docs/CACHING.md)를 참고하세요.

---

## 🏗️ 개발 원칙 (Development Rules)

1. **로컬 중복 타입 금지** — 도메인 타입은 반드시 `@bookjeok/core`에서 임포트합니다.
2. **데이터 통신 계층 준수** — 컴포넌트에서 axios를 직접 호출하지 않고 `@bookjeok/react-query` 훅을 사용합니다. 훅이 없으면 core → api-client → react-query 순으로 추가합니다.
3. **경로 상수 사용** — `router.push("/...")` 하드코딩 금지, `shared/constants/paths.ts`의 `PATHS`를 사용합니다.
4. **문맥 기반 그룹화** — `features/[feature]/components/` 하위는 `list-view/`, `detail-view/`, `forms/`, `widgets/`, `common/` 등 문맥 폴더로 묶습니다.
5. **HTML 렌더링 정제** — 사용자 입력 HTML은 `sanitize-review-content`를 거쳐 렌더링합니다.
6. **번역 키 사용** — 사용자에게 보이는 문구는 `next-intl` 번역 키로 관리하고 하드코딩하지 않습니다.
7. **토큰 직접 관리 금지** — 토큰 갱신은 `@bookjeok/api-client` 인터셉터가 전담합니다.

---

## ⚙️ 실행

```bash
pnpm dev:web              # 웹 + 서버 + core 동시 실행 (http://localhost:3000)
pnpm --filter @bookjeok/web test           # Vitest
pnpm --filter @bookjeok/web test:watch
pnpm storybook            # http://localhost:6006
pnpm --filter @bookjeok/web exec tsc --noEmit

ANALYZE=true pnpm build:web   # 번들 분석
```

### 필요한 환경 변수

| 변수                                                                                                 | 설명                                                |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                                                                                | 백엔드 주소                                         |
| `NEXT_PUBLIC_KAKAO_APP_KEY`                                                                          | 카카오 맵 SDK (없으면 지도 미표시)                  |
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`                                                               | 결제 위젯                                           |
| `NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED`                                                                | 결제 UI 노출 플래그 (서버 플래그와 동일 값)         |
| `REVALIDATE_TOKEN`                                                                                   | 온디맨드 ISR 갱신 시크릿 (서버 전용, 미설정 시 503) |
| `BLOB_READ_WRITE_TOKEN`                                                                              | Vercel Blob 업로드 (서버 사이드)                    |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` · `NEXT_PUBLIC_CLARITY_PROJECT_ID` · `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` | 계측·광고 (선택)                                    |

전체 목록은 루트 [.env.example](../../.env.example)에 있습니다.

## SEO 및 공유 카드

공개 페이지는 canonical·Open Graph·구조화 데이터를 제공합니다. 홈·마켓·리뷰·라운지의 정적 공유 이미지는 `public/og/`에 있고 `node scripts/generate-share-images.mjs`로 재생성합니다(한국어 글꼴 필요). 카드에는 헤더와 동일한 `logo-square-sketch.svg` 심벌과 `logo-text-ko.svg`/`logo-text-en.svg` 벡터 워드마크를 사용합니다. 일반 폰트로 브랜드명을 대신 쓰거나 별도 심벌을 만들지 않습니다. 한글 카드 4장의 제목은 나눔손글씨 펜체이며 `scripts/share-titles/`의 SVG 윤곽선을 사용합니다. 글꼴 출처·라이선스 및 제목 재생성 방법은 [글꼴 안내](scripts/fonts/nanum-pen-script/README.md)를 참고하세요. 이미지 생성은 빌드/런타임 요청 경로에 포함되지 않습니다. sitemap은 첫 요청부터 공개 글 전체와 연결 도서를 수집해 6시간 데이터 캐시에 보관하며, 실패 시 불완전한 결과를 저장하지 않습니다. XML 응답도 Vercel CDN에서 6시간 캐시하고 preview에서는 no-store로 제공합니다. 잘못된 하위 URL은 전체 경로 검사로 렌더 전에 차단합니다. 번역 사전은 공통 정적 JS에서 재사용해 HTML/RSC의 중복 전송을 줄입니다. 언어별 페이지는 첫 요청에 생성하고 각 페이지의 기존 ISR 주기를 유지하여 빌드 시 API 서버에 의존하지 않습니다. 배포 직후 캐시가 없는 첫 방문에는 생성 시간이 추가될 수 있습니다. 상세 내용은 [SEO 점검 보고서](../../docs/seo-audit-2026-09-19.md)와 [캐싱 문서](docs/CACHING.md)를 참고하세요.
