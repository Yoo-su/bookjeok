# 📚 @bookjeok/web (Frontend)

**Next.js 15 (App Router) & React 19** 기반의 북적 사용자 웹 서비스입니다.
도서 검색·AI 요약, 독서 기록, 중고책 거래와 에스크로 결제, 실시간 채팅·알림, 리뷰 커뮤니티를 다국어 반응형 UI로 제공합니다.

---

## 🚀 주요 기능 (Key Features)

- **🤖 AI 도서 요약** — 도서 상세에서 Gemini 요약을 조회·생성. 대화형 AI 추천(SSE)은 2026-09-29부터 화면에 연결하지 않고 코드만 보존 ([book README](src/features/book/README.md#ai-대화형-추천-sse))
- **💳 에스크로 결제 & 거래 관리** — 토스페이먼츠 SDK 연동, 주문 상태 타임라인, 배송/분쟁/구매확정 및 직거래/택배 거래 완료·후기 관리
- **💬 실시간 소통** — Socket.IO 1:1 거래 채팅(타이핑 인디케이터·읽음 표시)과 전역 실시간 알림 18종
- **📖 독서 기록 & 라운지** — 월별 캘린더, 통계, 독서 키재기(읽은 책을 실제 두께로 쌓아 사물·작가 키와 비교, 이미지 공유), 공개 피드
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
│   │   ├── (default)/        # 홈 · lounge · insights · users/[handle] · my-page(trades·feedback 포함) ·
│   │   │                     #   order · reading-log · reading-height(공개 소개) · admin/feedback(운영자) · 약관
│   │   ├── book/             # search · market · [isbn]/detail · sales(register 포함) · reviews(write 포함)
│   │   └── share/deck/[handle]/  # 폐지된 카드덱 링크 → 공개 프로필로 영구 리다이렉트
│   ├── api/                  # route handlers (upload, revalidate)
│   ├── sitemap.ts · robots.ts · manifest.ts · rss.xml/
│   ├── not-found.tsx · global-error.tsx
├── views/                    # 페이지 단위 조립 뷰 ([feature]-view/)
├── features/                 # 도메인별 기능 UI & 상태
│   ├── auth/                 # 로그인·회원가입·티켓 교환·이메일 인증·가드
│   ├── book/                 # 검색, 상세, AI 요약, 최근 본 책 (AI 챗은 미연결 보존)
│   ├── book-sale/            # 판매글 등록/수정/탐색/상세, 지도, 비디오 히어로, 이미지 업로드
│   ├── order/                # 에스크로 결제, 주문 상세, 배송/분쟁 모달
│   ├── trade/                # 직거래/택배 거래 완료 내역, 양방향 거래 후기, 신뢰 지표 배지/통계 (seller-trust-badge·seller-stats-card)
│   ├── chat/                 # 1:1 실시간 채팅 및 거래 액션 카드
│   ├── notification/         # 실시간 알림 (벨 · 팝오버)
│   ├── reading-log/          # 캘린더·통계·독서 키재기·독서 라운지
│   ├── review/               # Tiptap 리뷰 작성/조회/리액션
│   ├── comment/              # 댓글 · 좋아요
│   ├── user/                 # 프로필·통계·위시리스트·탈퇴
│   ├── insights/             # 서비스 통계 차트
│   ├── intro/                # 홈 히어로 인트로
│   ├── music/                # 전역 배경음악 플레이어
│   ├── confirm/              # 전역 확인 다이얼로그
│   └── announcement/         # 새 기능 소개 모달 (접속 시 한 번)
├── shared/
│   ├── components/           # shadcn · common · editor · map · ads · analytics · icons
│   ├── providers/            # QueryProvider · UserProvider · SocketProvider · IntlMessagesProvider
│   ├── hooks/                # 이미지 업로드, 오버레이, 스크롤, reduced-motion 등
│   ├── config/               # env · metadata · json-ld · crawlers · route-segments · i18n(routing/request)
│   ├── constants/            # PATHS · public-routes · cache
│   ├── libs/                 # axios · query-client · requester
│   ├── utils/                # 포맷터, sanitize, 에러 핸들러, 캐시 퍼지 등
│   ├── actions/              # revalidate server action
│   └── i18n/messages/        # ko.json · en.json
├── layouts/                  # DefaultLayout · Header · Navigation · BottomDock
├── styles/
├── middleware.ts             # next-intl 로케일 라우팅 + 크롤러 차단·라우트 형태 검사 (docs/CACHING.md 「크롤 표면」)
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
7. **토큰 직접 관리 금지** — 토큰 첨부·갱신은 `shared/libs/axios.ts`가 `@bookjeok/api-client`의 인스턴스에 붙이는 인터셉터가 전담합니다(공용 패키지에는 인터셉터 없음).

---

## ⚙️ 실행

```bash
pnpm dev:web              # 웹 + 서버 + core·api-client·react-query watch (http://localhost:3000)
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

### 브랜드 자산 (A 자유로운 펜선)

헤더·로딩·시스템 알림·오류 화면·SEO·앱 아이콘의 경로는 `shared/constants/brand.ts`의 `BRAND_ASSETS`를 사용합니다. 실제 자산은 `public/brand/pen-v1/`, 원본은 루트 `assets/brand/pen-v1/`입니다. A의 SVG 원본으로 PNG·한영 조합·ICO·Apple/앱 아이콘·SNS 프로필 파일을 만들며, B 종이 오리기와 이전 붓 로고는 배포되는 public 밖의 `assets/brand/archive/`에 보존합니다(저장소 자체는 공개). 기존 public 파일명은 새 A의 호환 사본이고 현재 코드는 버전 경로를 사용합니다. `node scripts/generate-brand-assets.mjs` → `node scripts/generate-share-images.mjs` → `node scripts/check-brand-assets.mjs` 순으로 재생성·확인합니다. [브랜드 자산 안내](../../assets/brand/README.md)에 전체 목록과 SNS 교체 파일이 있습니다.

공개 페이지는 canonical·Open Graph·구조화 데이터를 제공합니다. 홈·마켓·리뷰·라운지·독서 키재기의 정적 공유 이미지는 `public/og/pen-v1/`에 있고 `node scripts/generate-share-images.mjs`로 재생성합니다(한국어 글꼴 필요). 독서 키재기 카드는 로고 심벌 대신 화면과 같은 장면 그림(`scripts/share-art/reading-height.svg`, `npx tsx scripts/generate-reading-height-art.ts`로 생성)을 씁니다. 카드에는 헤더와 동일한 `brand/pen-v1/symbol.svg` 심벌과 `logo-text-ko.svg`/`logo-text-en.svg` 벡터 워드마크를 사용합니다. 일반 폰트로 브랜드명을 대신 쓰거나 별도 심벌을 만들지 않습니다. 한글 카드 4장의 제목은 나눔손글씨 펜체이며 `scripts/share-titles/`의 SVG 윤곽선을 사용합니다. 글꼴 출처·라이선스 및 제목 재생성 방법은 [글꼴 안내](scripts/fonts/nanum-pen-script/README.md)를 참고하세요. 이미지 생성은 빌드/런타임 요청 경로에 포함되지 않습니다. sitemap은 첫 요청부터 공개 글 전체와 연결 도서를 수집해 6시간 데이터 캐시에 보관하며, 실패 시 불완전한 결과를 저장하지 않습니다. XML 응답도 Vercel CDN에서 6시간 캐시하고 preview에서는 no-store로 제공합니다. 잘못된 하위 URL은 전체 경로 검사로 렌더 전에 차단합니다. 번역 사전은 공통 정적 JS에서 재사용해 HTML/RSC의 중복 전송을 줄입니다. 언어별 페이지는 첫 요청에 생성하고 각 페이지의 기존 ISR 주기를 유지하여 빌드 시 API 서버에 의존하지 않습니다. 배포 직후 캐시가 없는 첫 방문에는 생성 시간이 추가될 수 있습니다. 상세 내용은 [SEO 점검 보고서](../../docs/seo-audit-2026-09-19.md)와 [캐싱 문서](docs/CACHING.md)를 참고하세요.

본문 글꼴 Pretendard는 공식 1.3.9 dynamic subset을 `public/fonts/pretendard/1.3.9/`에 두고 `src/styles/pretendard.css`로 불러옵니다. `unicode-range`로 나뉜 92개 조각 중 페이지에 쓰인 글자의 조각만 받습니다(검색 페이지 약 230KB, 전체 파일 2MB). 버전 폴더에 1년 immutable 캐시를 걸어 두었으므로 글꼴을 갱신할 때는 파일을 덮어쓰지 말고 새 버전 폴더를 만드세요. 조각 경계를 넘는 문맥 대체는 적용되지 않아 `@`·`+`·`×`·`→`가 대문자나 숫자 옆에 올 때 1px 안팎으로 위치가 다를 수 있습니다.
