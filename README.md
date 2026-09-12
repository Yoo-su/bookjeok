# bookjeok (북적)

**책과 지식의 선순환 플랫폼**

> AI 도서 추천·요약, 키워드 도서 검색, 독서 기록 관리, 에스크로 결제 기반 중고책 거래, 실시간 채팅, 도서 리뷰, 독자 커뮤니티가 결합된 통합 도서 플랫폼.

[![Live Demo](https://img.shields.io/badge/Live-bookjeok.com-4f46e5?style=flat-square)](https://bookjeok.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-f69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)

---

## 목차

- [한눈에 보기](#한눈에-보기)
- [시스템 아키텍처](#시스템-아키텍처)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [핵심 엔지니어링 결정](#핵심-엔지니어링-결정)
- [외부 서비스 연동](#외부-서비스-연동)
- [Shared Packages](#shared-packages)
- [Project Structure](#project-structure)
- [Security](#security)
- [Testing & Quality](#testing--quality)
- [Deployment](#deployment)
- [Getting Started](#getting-started)
- [환경 변수](#환경-변수)
- [문서 인덱스](#문서-인덱스)
- [License](#license)

---

## 한눈에 보기

|                |                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **서비스**     | https://bookjeok.com                                                                                |
| **구성**       | Turborepo 모노레포 — 앱 3개(web / server / admin), 공용 패키지 3개(core / api-client / react-query) |
| **프론트엔드** | Next.js 15 App Router + React 19, 한국어/영어 다국어, ISR + On-Demand Revalidation                  |
| **백엔드**     | NestJS 11 + TypeORM + PostgreSQL(pgvector, cube/earthdistance)                                      |
| **AI**         | Google Gemini — Function Calling 의도 분류 → pgvector 벡터 검색 → RAG 리랭킹                        |
| **실시간**     | Socket.IO 채팅·알림 게이트웨이, SSE 기반 AI 추천 스트리밍                                           |
| **결제**       | 토스페이먼츠 에스크로 + Delivery Tracker 배송 추적 + 스케줄러 기반 자동 확정/환불                   |
| **인프라**     | Vercel(web) · Azure Container Apps(server) · Supabase PostgreSQL                                    |

---

## 시스템 아키텍처

```
                          ┌─────────────────────────────┐
                          │  Browser / Mobile Web       │
                          └──────────────┬──────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │ HTTPS (REST)             │ SSE                      │ WebSocket
              ▼                          ▼                          ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │  apps/web — Next.js 15 (Vercel)                                        │
   │  App Router · RSC/ISR · next-intl(ko/en) · TanStack Query · Zustand    │
   │  Route Handlers: /api/upload, /api/revalidate, /rss.xml, sitemap.ts    │
   └───────────────────────────────┬────────────────────────────────────────┘
                                   │
                    @bookjeok/react-query → api-client → core
                                   │
                                   ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │  apps/server — NestJS 11 (Azure Container Apps, Docker)                │
   │                                                                        │
   │  Global Pipeline                                                       │
   │   helmet → compression → cookie-parser → CORS                          │
   │   ThrottlerGuard → LoggingInterceptor → SmartCacheInterceptor          │
   │   → ActivityTrackingInterceptor → CacheInvalidationInterceptor         │
   │   → TransformInterceptor → ClassSerializerInterceptor                  │
   │   → ValidationPipe(whitelist) → GlobalExceptionFilter(ERROR_CODES)     │
   │                                                                        │
   │  Domain Modules                                                        │
   │   auth · user · book · review · comment · reading-log · wishlist       │
   │   used-book-sale · order · trade · chat · llm · search · search-keyword │
   │   insights · notification · health                                     │
   │                                                                        │
   │  Cross-cutting                                                         │
   │   CLS Transactional · EventEmitter · @nestjs/schedule · Resend Mail    │
   │   SmartCache · Activity Log · Idempotency                              │
   └───┬──────────────┬───────────────┬────────────────┬────────────────────┘
       │              │               │                │
       ▼              ▼               ▼                ▼
  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌────────────────────────┐
  │ Supabase │  │ Gemini     │  │  Toss    │  │ Naver · Kakao · Aladin │
  │ Postgres │  │ Flash /    │  │ Payments │  │ KOPIS · Delivery       │
  │ pgvector │  │ embedding  │  │ (Escrow) │  │ Tracker · Resend       │
  │ earthdist│  │            │  │          │  │ Vercel Blob            │
  └──────────┘  └────────────┘  └──────────┘  └────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │  apps/admin — Next.js 15 관리자 포털                                    │
  │  운영 통계 · 매물/리뷰 검수 · On-Demand ISR 캐시 제어                    │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## Features

### 키워드 기반 도서 검색

자체 DB에 적재한 도서 약 5.7만 종을 제목·저자·출판사로 검색합니다. `pg_trgm` GIN 인덱스 기반 부분일치이며, 관련도(완전일치 → 접두일치 → 부분일치)로 버킷을 나눈 뒤 알라딘 판매지수(`salesPoint`)로 순서를 가립니다. **런타임에 외부 도서 API를 호출하지 않습니다**(아래 「외부 서비스 연동」 참고). TanStack Query 기반 무한 스크롤로 결과를 점진적으로 탐색하며, 사용자 검색어는 정규화 후 별도로 기록되어(초성 제거·공백 정리·2글자 미만 폐기) 최근 1년 기준 인기 검색어 Top 10을 집계합니다.

---

### RAG 기반 AI 도서 추천

사용자가 "주말에 가볍게 읽을 만한 에세이 찾고 있어요" 같은 자연어를 입력하면, 도서 DB에서 의미론적 유사도를 기반으로 도서를 찾아 추천합니다.

도서 메타데이터(제목·저자·줄거리·장르)를 결합한 텍스트를 Google `gemini-embedding-001` 모델로 768차원 벡터로 변환하여 PostgreSQL `pgvector`에 저장하는 사전 임베딩 작업을 거칩니다. 검색 시점에는 사용자의 질문도 동일한 모델로 임베딩한 뒤, 코사인 유사도 기반 벡터 검색으로 후보 도서를 추출합니다.

#### 3단계 RAG 파이프라인

1. **의도 분류 (1차 LLM)** — Gemini Flash에 Function Calling 도구(`search_books`)를 등록하여, 사용자의 발화가 실제 도서 검색 요청인지 단순 대화인지를 판단합니다. 단순 인사나 모호한 표현에는 꼬리 질문으로 대화를 이어가고, 구체적 독서 의도가 감지될 때만 검색 쿼리를 생성합니다.
2. **벡터 검색 (pgvector)** — 생성된 검색 쿼리를 768차원으로 임베딩하고 L2 정규화한 뒤, `match_books` RPC 함수를 호출하여 코사인 유사도 상위 후보 도서를 추출합니다. 유사도 임계값(`AI_SIMILARITY_THRESHOLD`, 기본 0.35) 미만은 사전 필터링하고, 후보 풀 크기는 `AI_CANDIDATE_POOL_SIZE`로 조정합니다.
3. **RAG 합성 & 리랭킹 (2차 LLM)** — 후보 도서 목록과 대화 맥락을 함께 넘겨, 사용자의 독자층·장르·분위기에 실제로 부합하는 도서만 엄선합니다. 최종적으로 전체 추천 서두 메시지와 책별 개별 추천 사유(`reason`)를 JSON 구조로 생성하여 반환합니다.

```
사용자 메시지
      │
      ▼
┌──────────────────────────────────────────────┐
│  1차 LLM Agent — 의도 분류                    │
│  Gemini Flash + Function Calling             │
│  search_books 도구 호출 여부 판단             │
└──────────────────┬───────────────────────────┘
                   │ searchQuery 생성
                   ▼
┌──────────────────────────────────────────────┐
│  EmbeddingService                            │
│  gemini-embedding-001 → 768차원 벡터 생성     │
│  L2 정규화                                    │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  pgvector 코사인 유사도 검색                  │
│  match_books RPC (상위 후보 추출)             │
│  유사도 임계값 사전 필터링 + 중복 도서 제거    │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  2차 LLM — RAG 합성 & 리랭킹                 │
│  대화 맥락 + 후보 도서 → 최종 추천 엄선       │
│  추천 서두 메시지 + 책별 개별 reason 생성      │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
   SSE 스트리밍 (POST /search/ai/stream)
   응답을 조각 단위로 브라우저에 즉시 전달
```

결과는 `POST /search/ai`(일괄 응답)와 `POST /search/ai/stream`(SSE 스트리밍) 두 가지로 제공되며, 웹에서는 커스텀 `sse-chat-client`가 스트림을 파싱해 챗 UI에 점진적으로 렌더링합니다.

---

### AI 도서 핵심 요약

도서 상세 페이지에서 Gemini에 제목·저자·줄거리·출판사 정보를 전달하여, 단순 소개글과 차별화된 분석적 요약을 생성합니다.

- **summary** — 책의 고유한 서사적 갈등과 핵심 사건을 담은 250~350자 완성형 문단
- **keyPoints** — 핵심 인사이트 3가지
- **targetAudience** — 이 책이 필요한 독자의 구체적 상황이나 고민
- **keywords** — 연관 태그 5개

생성된 요약은 ISBN 기준으로 `ai_book_summaries` 테이블에 캐싱하여 동일 도서에 대한 반복 API 호출을 방지합니다. 모든 AI 요청은 토큰 사용량, 응답 지연시간, 성공/실패 여부를 `ai_request_logs` 테이블에 별도로 기록합니다.

---

### 중고책 마켓플레이스 + 에스크로 결제

카카오 맵 API 및 지오코딩을 활용한 위치 기반 중고책 거래 플랫폼입니다. 시/도, 시/군/구 단위 필터링과 지도 기반 거래 장소 확인, PostgreSQL `cube`/`earthdistance` 확장과 GiST 인덱스를 이용한 반경·거리순 정렬을 지원합니다.

판매글은 거래 방식을 `DIRECT_ONLY`(직거래) / `DELIVERY_ONLY`(택배) / `BOTH`로 선택할 수 있고, 택배 거래에는 **토스페이먼츠 에스크로 결제**가 연결됩니다.

> **결제는 현재 운영에서 꺼져 있습니다.** PG 심사 전이라 `FEATURE_PAYMENT_ENABLED`
> 플래그 뒤에 봉인돼 있고, `orders` 테이블은 0행입니다. 아래 상태 머신과 스케줄러는
> **구현돼 있으나 동작하지 않는 상태**입니다. 직거래는 결제 없이 정상 동작합니다.
> 플래그를 켜기 전에 처리할 항목이
> [docs/book-data-migration-plan.md](docs/book-data-migration-plan.md) 9-c
> 「결제 활성화 전 점검 항목」에 있습니다.

```
판매자가 채팅방에서 구매자 선택
        │
        ▼
  AWAITING_PAYMENT ──(24h 미결제)──▶ CANCELLED
        │ 구매자 결제 승인
        ▼
      PAID ──(3일 미배송 자동 환불)──▶ CANCELLED
        │ 판매자 운송장 등록
        ▼
    SHIPPED ──(Delivery Tracker 폴링)──▶ DELIVERED
                                            │
                          구매자 확정 / 2일 후 자동 확정
                                            ▼
                                        CONFIRMED
                                            ▲
              구매확정 거부 → DISPUTED ──────┘ (7일 미해결 시 자동 환불)
```

- **금액 위변조 방어** — 결제 승인 금액을 서버에서 판매글 가격과 대조 검증
- **동시성 제어** — `@VersionColumn` 낙관적 잠금 + `x-idempotency-key` 멱등성 인터셉터
- **보상 트랜잭션** — 토스 승인 성공 후 DB 저장 실패 시 자동 환불
- **스케줄러 6종** — 미결제 만료, 미배송 환불, 자동 구매확정, 분쟁 만료 환불, 배송 상태 폴링(30분 주기), 만료 임박 알림(매일 자정)
- **Feature Flag** — `FEATURE_PAYMENT_ENABLED`와 `PaymentFeatureGuard`로 PG 심사 전에도 결제 경로만 차단한 채 안전 배포
- **이메일 인증 게이트** — `EmailVerifiedGuard`로 판매글 작성·거래 채팅·구매자 지정·결제를 인증 회원으로 제한
- **거래 후기** — 거래 완료(`TradeCompletion`) 1건당 구매자·판매자가 각각 한 건씩 남기는 양방향 `TradeReview`, 프로필에 "거래 완료 N건 · 긍정 후기 N%" 신뢰 지표 노출

상세 설계는 [docs/used-book-pay-implementation.md](docs/used-book-pay-implementation.md)를 참고하세요.

---

### 실시간 채팅 & 알림

Socket.IO 게이트웨이 2종(채팅 / 알림)을 운영합니다.

- **채팅** — 판매글별 1:1 채팅방, 이미지 전송, 타이핑 인디케이터, **읽음 워터마크**(참가자별 `lastReadMessageId`) 기반 안 읽은 개수 계산, 핸드셰이크 단계 JWT 검증(`authenticateSocket`)
- **알림** — 리뷰 리액션·리뷰 댓글·댓글 좋아요에 더해 중고거래 11종을 포함한 **14종 알림 타입**을 실시간 푸시. 도메인 서비스는 `EventEmitter` 이벤트만 발행하고, 리스너가 알림 생성·채팅 시스템 메시지·메일 발송을 비동기로 처리합니다.
- **메일** — Resend로 회원가입 이메일 인증 링크와 채팅방 개설 알림을 발송합니다(`chat.room_created` 이벤트 → `MailEventListener`, `async: true`).

---

### 도서 리뷰 & 독서 기록

- **리뷰** — Tiptap 리치 텍스트 에디터(이미지 리사이즈·하이라이트·정렬·링크·색상 확장), 별점, 태그, 공개/비공개, 리액션(공감/인사이트/응원) 집계, 조회수 인터셉터, `sanitize-html` 기반 XSS 방어
- **독서 기록** — 월별/연도별 독서 캘린더, 완독 도서·한줄평·감상문 기록, 개인 독서 통계와 공개 설정
- **3D 덱 뷰어** — Framer Motion 기반 카드 덱으로 완독 기록을 인터랙티브하게 탐색하고 `/share/deck/[handle]`로 공유
- **독서 라운지** — `/lounge`에서 다른 독자들의 실시간 독서 기록, 인기 도서, 활동 중인 독자, 같은 책을 읽는 독자를 조회

---

### 인사이트 대시보드

`/insights`에서 지역별 중고 거래 분포, 가격대 분포, 인기 태그 순위, 리액션 비율 등 서비스 전체의 독서·거래 데이터를 ApexCharts로 시각화합니다.

---

### 문화예술 정보

KOPIS(공연예술통합전산망) 공공 API를 프록시하여 공연·전시 목록과 상세 정보를 제공합니다(`/art/[id]`).

---

### 그 외

- **위시리스트** — 관심 도서 담기 및 내 위시리스트 관리
- **댓글** — 리뷰 댓글, 댓글 좋아요, 내가 쓴 댓글 모아보기
- **배경음악 플레이어** — Zustand 전역 스토어 기반 플로팅 뮤직 플레이어(재생목록·반복 모드)
- **다국어(ko/en)** — `next-intl` 기반 `[locale]` 라우팅
- **SEO** — 동적 `sitemap.ts`, `robots.ts`, `manifest.ts`, RSS 피드(`/rss.xml`), JSON-LD 구조화 데이터, canonical/hreflang
- **분석·광고** — Vercel Analytics/Speed Insights, Google Analytics, Microsoft Clarity, Google AdSense

---

## Tech Stack

### Monorepo & Tooling

| 항목                | 기술                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| 빌드 오케스트레이션 | Turborepo 2.7 (태스크 그래프 + 캐시)                                             |
| 패키지 매니저       | pnpm 10 Workspaces (`overrides`로 React 19 / axios / TanStack Query 버전 단일화) |
| 언어                | TypeScript 5 (`tsconfig.base.json` 공유)                                         |
| 린트·포맷           | ESLint 9 Flat Config, Prettier 3, `eslint-plugin-simple-import-sort`             |
| 런타임              | Node.js 22.x                                                                     |

### Frontend — `apps/web`

| 항목            | 기술                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 프레임워크      | Next.js 15 (App Router, RSC, SSG/ISR, Route Handlers, Server Actions) · React 19                                                   |
| 서버 상태       | TanStack Query v5 + `@lukemorales/query-key-factory` (쿼리 키 팩토리)                                                              |
| 클라이언트 상태 | Zustand v5 (음악 플레이어, 확인 모달, 최근 본 책 등)                                                                               |
| 스타일링        | Tailwind CSS v4(`@tailwindcss/postcss`), `tailwind-merge`, `class-variance-authority`, `tw-animate-css`, `@tailwindcss/typography` |
| UI 컴포넌트     | Radix UI (shadcn/ui 패턴) + Lucide React                                                                                           |
| 애니메이션      | Framer Motion / `motion`, GSAP, Swiper                                                                                             |
| 에디터          | Tiptap 3 (StarterKit, Image + resize, Link, Highlight, TextAlign, Color, Underline, Placeholder, BubbleMenu)                       |
| 폼 & 검증       | React Hook Form + Zod 4 + `@hookform/resolvers`                                                                                    |
| 차트            | ApexCharts / `react-apexcharts`                                                                                                    |
| 지도·주소       | `react-kakao-maps-sdk`, `react-daum-postcode`                                                                                      |
| 결제            | `@tosspayments/tosspayments-sdk` v2                                                                                                |
| 실시간          | `socket.io-client`, 커스텀 SSE 클라이언트                                                                                          |
| 다국어          | `next-intl` 4 (ko/en)                                                                                                              |
| 테마            | `next-themes` (다크 모드)                                                                                                          |
| 이미지          | `browser-image-compression`, `@vercel/blob`                                                                                        |
| 마크다운·정제   | `react-markdown` + `remark-gfm`, `sanitize-html`                                                                                   |
| 토스트·UX       | `sonner`, `react-intersection-observer`                                                                                            |
| 계측            | `@vercel/analytics`, `@vercel/speed-insights`, GA4, Microsoft Clarity, AdSense                                                     |
| 테스트·문서     | Vitest 4 + Testing Library + jsdom, Storybook 8, `@next/bundle-analyzer`                                                           |

### Backend — `apps/server`

| 항목       | 기술                                                                              |
| ---------- | --------------------------------------------------------------------------------- |
| 프레임워크 | NestJS 11 (Express 플랫폼)                                                        |
| ORM / DB   | TypeORM 0.3 · PostgreSQL(`pgvector`, `cube`, `earthdistance`) · `pg`              |
| 트랜잭션   | `nestjs-cls` + `@nestjs-cls/transactional` (TypeORM 어댑터) — 선언적 CLS 트랜잭션 |
| 인증       | Passport (JWT / JWT-Refresh / Naver / Kakao), `@nestjs/jwt`, bcrypt               |
| 실시간     | `@nestjs/websockets` + `@nestjs/platform-socket.io`, Socket.IO 4                  |
| AI         | `@google/generative-ai` (Gemini Flash, `gemini-embedding-001`)                    |
| 캐싱       | `@nestjs/cache-manager` + `cache-manager` 7 위에 자체 SmartCache 레이어           |
| 스케줄링   | `@nestjs/schedule` (Cron)                                                         |
| 이벤트     | `@nestjs/event-emitter` (도메인 이벤트 · 탈퇴 정리 · 알림 팬아웃)                 |
| 검증       | `class-validator`, `class-transformer`, 전역 `ValidationPipe(whitelist)`          |
| 보안       | `helmet`, `@nestjs/throttler`, `cookie-parser`, CORS 오리진 화이트리스트          |
| 성능       | `compression`, TypeORM 커넥션 풀(max 40)                                          |
| 외부 통신  | `@nestjs/axios`, `fast-xml-parser`(KOPIS/알라딘 XML)                              |
| 메일       | Resend                                                                            |
| 스토리지   | `@vercel/blob`                                                                    |
| API 문서   | `@nestjs/swagger` — `/api`에서 OpenAPI 문서 제공                                  |
| 헬스체크   | `@nestjs/terminus` — `GET /health`                                                |
| 테스트     | Jest 29 + ts-jest, Supertest                                                      |

### Infrastructure

| 항목              | 기술                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| 프론트엔드 호스팅 | Vercel (ISR + On-Demand Revalidation)                                           |
| 백엔드 호스팅     | Azure Container Apps + Azure Container Registry (Docker)                        |
| 데이터베이스      | Supabase PostgreSQL                                                             |
| CI                | GitHub Actions (`lint` → `test` → `build`), GitLab CI (Docker 이미지 빌드/푸시) |
| CD                | GitHub Actions → ACR 이미지 푸시 → Container Apps 배포                          |
| 로컬 개발         | Docker Compose (PostgreSQL + pgvector)                                          |

---

## 핵심 엔지니어링 결정

### 1. Contract-First 모노레포

새 기능은 항상 `packages/core`의 인터페이스·`API_PATHS`·쿼리 키부터 정의하고, 서버 DTO가 그 인터페이스를 `implements`합니다. 프론트와 백엔드가 같은 타입 정의를 **컴파일 타임에** 공유하므로 API 계약이 깨지면 빌드가 실패합니다. 의존성은 `core → api-client → react-query → web/admin` 단방향이며, 역방향 import와 앱 간 직접 import를 금지합니다.

### 2. SmartCache — 프리픽스 기반 선언적 캐시 무효화

`@SmartCache({ prefix, ttl, keyStrategy })` 데코레이터로 응답을 캐싱하고, `@InvalidateCache(prefix)`로 쓰기 시점에 해당 프리픽스의 키를 한 번에 제거합니다. `SmartCacheStore`가 prefix→key 집합을 인메모리로 관리해 cache-manager가 제공하지 않는 "프리픽스 단위 삭제"를 구현했습니다. `keyStrategy`로 `ip` / `user` / `ip+user` / `global` 스코프를 선택합니다.

### 3. 멱등성 인터셉터

`x-idempotency-key` 헤더가 있는 요청은 캐시에 `processing` 락을 걸고 중복 요청을 409로 차단합니다. 결제처럼 재시도가 곧 이중 과금이 되는 경로를 방어합니다.

### 4. 표준화된 에러 체계

`ERROR_CODES`에 도메인별 코드(`AUTH_xxx`, `SALE_xxx`, `ORDER_xxx` …)와 메시지를 등록하고 서비스는 `BusinessException`만 던집니다. `GlobalExceptionFilter`가 모든 예외를 동일한 JSON 형태로 변환하고 `TransformInterceptor`가 성공 응답 봉투를 통일해, 프론트는 단일 에러 핸들러로 대응합니다.

### 5. 이벤트 기반 회원 탈퇴 정리

탈퇴 시 `user.withdrawn` 이벤트 하나만 발행하면 chat · comment · llm · notification · reading-log · review · used-book-sale · user · activity 9개 리스너가 각자의 데이터를 정리합니다. 도메인 모듈 간 직접 의존 없이 정리 로직을 확장할 수 있습니다.

### 6. 선언적 트랜잭션 (CLS)

`@nestjs-cls/transactional`로 `QueryRunner`를 서비스 시그니처에 끌고 다니지 않고 트랜잭션을 전파합니다. 판매글 생성 + 도서 메타데이터 매핑, 주문 생성 + 판매 상태 변경처럼 복수 엔티티가 얽힌 작업에 적용됩니다.

### 7. 활동 로그 인터셉터

`@TrackActivity(type)`가 붙은 엔드포인트 호출을 `ActivityTrackingInterceptor`가 가로채 `activity_logs`에 비동기 적재합니다. 로그인·검색·조회·작성 등 20여 개 지점이 계측되어 있으며, 현재는 감사(audit) 로그 용도로 **적재만** 하고 조회하는 기능은 없습니다.

### 8. 거리 검색: PostGIS 대신 cube + earthdistance

전체 GIS 스택이 필요하지 않아 PostgreSQL 기본 확장인 `cube`/`earthdistance`만 활성화하고, `ll_to_earth(latitude, longitude)` GiST 인덱스를 모듈 부팅 시 `CREATE INDEX IF NOT EXISTS`로 보장합니다. 반경 필터(`radius`)와 거리순 정렬을 인덱스로 처리합니다.

### 9. 커서 페이지네이션

판매글 검색은 offset이 아닌 Base64 커서를 사용해, 목록이 실시간으로 바뀌어도 중복·누락 없이 무한 스크롤됩니다.

### 10. 읽음 워터마크

채팅 읽음 처리를 메시지별 `read_receipts` 테이블에서 참가자별 `lastReadMessageId` 워터마크 방식으로 전환해, 읽음 레코드가 메시지 수에 비례해 증가하던 구조를 제거했습니다. 적용 이력은 [docs/manual-ddl-log.md](docs/manual-ddl-log.md)에 있습니다.

### 11. ISR + On-Demand Revalidation

목록·상세 페이지를 ISR로 정적 서빙하고, 관리자 포털의 캐시 제어 센터가 시크릿 토큰 기반 웹훅(`/api/revalidate`)을 호출해 즉시 갱신합니다. 검수로 삭제한 게시물이 캐시에 남는 문제를 해결합니다.

### 12. Feature Flag 기반 안전 배포

`FEATURE_PAYMENT_ENABLED` / `NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED`와 `PaymentFeatureGuard`로, PG 심사 완료 전에도 결제 코드를 운영에 배포한 채 진입만 차단합니다.

---

## 외부 서비스 연동

| 서비스                                | 용도                                                      | 사용 위치                               |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| **네이버 / 카카오 OAuth**             | 소셜 로그인                                               | `server: auth` (Passport 전략)          |
| **Google Gemini**                     | 의도 분류·RAG 합성(Flash), 임베딩(`gemini-embedding-001`) | `server: llm, search`                   |
| **토스페이먼츠**                      | 에스크로 결제 승인·취소·웹훅                              | `server: order`, `web: order`           |
| **Delivery Tracker**                  | 택배 배송 상태 조회 및 30분 주기 폴링                     | `server: order`                         |
| **Resend**                            | 회원가입 이메일 인증 링크, 채팅 개설 알림 메일            | `server: shared/mail`                   |
| **Vercel Blob**                       | 리뷰·판매글·프로필 이미지 업로드/삭제                     | `web: /api/upload`, `server`            |
| **카카오 맵 SDK**                     | 거래 위치 지도, 지오코딩                                  | `web: shared/components/map`            |
| **다음 우편번호**                     | 배송지 주소 입력                                          | `web: order/address-input`              |
| **KOPIS 공공 API**                    | 공연·전시 정보                                            | `server: art`                           |
| **GA4 · Microsoft Clarity · AdSense** | 트래픽 분석, 행동 분석, 광고                              | `web: shared/components/analytics, ads` |

> **도서 데이터는 런타임에 외부 API를 쓰지 않습니다.** 과거에는 네이버 도서 API와
> 알라딘 Open API를 연동했으나, 알라딘 종료(2026-10-30)에 대비해 2026-09-08에
> 공급처 체인에서 제거했습니다. 지금은 검색·상세 모두 자체 DB 단독이며, **외부
> 공급처를 런타임 경로에 두지 않는 것이 방침입니다.** 신규 도서는 서버가 아니라
> 운영자가 주기적으로 돌리는 스크립트로 확보합니다. 표지도 2026-09-09 컷오버로
> Cloudflare R2(`cdn.bookjeok.com`)에서 나갑니다. 경위와 남은 정리 항목은
> [docs/book-data-migration-plan.md](docs/book-data-migration-plan.md)에 있습니다.

---

## Shared Packages

Monorepo `packages/` 디렉토리에 도메인 모델과 통신 클라이언트를 집약하여 플랫폼 전반의 코드 재사용성을 극대화했습니다.

| Package                                         | Role                                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`@bookjeok/core`](packages/core)               | 데이터 모델 인터페이스, API 경로 상수(`API_PATHS`), 포맷터, 쿼리 키 팩토리 (런타임 0B 순수 TS 계약) |
| [`@bookjeok/api-client`](packages/api-client)   | Axios 클라이언트(`publicApiClient`, `privateApiClient`), 토큰 인터셉터, API 호출 모듈               |
| [`@bookjeok/react-query`](packages/react-query) | TanStack Query 쿼리/뮤테이션 훅과 캐시 무효화 규칙                                                  |

---

## Project Structure

```
bookjeok/
├── apps/
│   ├── web/                      # Next.js 15 사용자 웹 프론트엔드
│   │   ├── src/app/              # App Router ([locale] 다국어, route handlers, sitemap/robots/rss)
│   │   ├── src/views/            # 페이지 뷰 조립 레이어
│   │   ├── src/features/         # 도메인 기능 (art, auth, book, book-sale, chat, comment,
│   │   │                         #   confirm, insights, intro, music, notification, order,
│   │   │                         #   reading-log, review, user)
│   │   ├── src/shared/           # 공용 컴포넌트·프로바이더·훅·유틸·i18n·analytics
│   │   ├── src/layouts/          # DefaultLayout, Header, Navigation
│   │   ├── docs/ARCHITECTURE.md  # 컴포넌트 구조 & i18n 가이드
│   │   └── docs/CACHING.md       # ISR · 쿼리 캐시 구조와 재검증 규칙
│   │
│   ├── admin/                    # Next.js 15 관리자 포털
│   │   ├── src/app/dashboard/    # 운영 통계, 매물/리뷰 검수, ISR 캐시 제어
│   │   └── src/stores/           # 관리자 인증 상태
│   │
│   └── server/                   # NestJS 11 백엔드 API
│       ├── src/app/              # 루트 모듈 (TypeORM, CLS, Throttler, Cache, Schedule)
│       ├── src/features/         # 17개 도메인 모듈
│       │   ├── auth/  user/  book/  review/  comment/  reading-log/  wishlist/
│       │   ├── used-book-sale/  order/  chat/  notification/
│       │   ├── llm/  search/  search-keyword/
│       │   └── art/  insights/  health/
│       └── src/shared/           # 횡단 관심사
│           ├── activity/         # 활동 로그 (데코레이터 + 인터셉터)
│           ├── cache/            # SmartCache (캐싱/무효화 데코레이터)
│           ├── exceptions/       # BusinessException, ERROR_CODES
│           ├── filters/          # GlobalExceptionFilter
│           ├── interceptors/     # Transform, Logging, Idempotency, ViewCount
│           └── mail/             # Resend 메일 서비스 & 이벤트 리스너
│
├── packages/
│   ├── core/                     # @bookjeok/core
│   ├── api-client/               # @bookjeok/api-client
│   └── react-query/              # @bookjeok/react-query
│
├── docs/                         # 운영·설계 문서
│   ├── used-book-pay-implementation.md
│   ├── book-data-migration-plan.md
│   ├── manual-ddl-log.md
│   └── ddl/                      # 운영에 적용한 DDL 원본
├── .agents/rules/                # 코드베이스 컨벤션 (개발자 & AI 에이전트 공용)
├── .github/workflows/            # CI, Azure Container Apps 배포
├── docker-compose.yml            # 로컬 PostgreSQL + pgvector
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Security

- **1회용 인증 티켓 (Social Login Ticket Exchange)** — 소셜 로그인 리다이렉트 시 JWT를 URL에 노출하지 않고 60초 일회용 티켓을 발급하여 `POST /auth/exchange`로 안전하게 교환
- **JWT Silent Refresh** — Axios 인터셉터를 통한 Access Token 만료 감지 및 자동 갱신
- **`tokenVersion` 기반 즉시 무효화** — 로그아웃 또는 비정상 세션 감지 시 `user.tokenVersion`을 증가시켜 Refresh Token을 즉시 무효화
- **이메일 인증 게이트** — `EmailVerifiedGuard`로 중고거래 진입 경로를 인증 회원으로 제한(사기·어뷰징 방어)
- **소켓 인증** — `shared/websocket/authenticate-socket.ts`가 WebSocket 핸드셰이크 단계에서 JWT를 검증하고 탈퇴 계정을 차단. 방 참여(`joinRooms`)는 별도로 참여자 여부를 확인
- **Rate Limiting** — 전역 Throttler(60초 / 120회) 위에 로그인·회원가입·티켓 교환·AI 검색은 개별 제한 적용
- **입력 검증** — 전역 `ValidationPipe({ whitelist, forbidNonWhitelisted })`로 정의되지 않은 필드 차단
- **XSS 방어** — 리뷰 본문은 `sanitize-html`로 정제 후 렌더링
- **HTTP 헤더 보안** — `helmet`, CORS 오리진 화이트리스트, `credentials: true` 쿠키 정책
- **결제 무결성** — 서버 측 금액 검증, 낙관적 잠금, 멱등성 키, 승인 후 저장 실패 시 보상 환불
- **AI 사용 로깅** — 모든 AI 요청의 토큰 사용량, 지연시간, 성공/실패 기록

---

## Testing & Quality

| 항목             | 현황                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| 서버 단위 테스트 | Jest — 21개 spec (주문 서비스·스케줄러·토스 연동·채팅 게이트웨이·가드 등)                            |
| 웹 테스트        | Vitest 4 + Testing Library — 41개 테스트 파일 (결제 플로우, 주문 상세, 배송/분쟁 모달, 거래 후기 등) |
| 컴포넌트 문서    | Storybook 8 — 11개 스토리                                                                            |
| 타입 안전성      | `tsc --noEmit` 게이트 (server / web / admin)                                                         |
| 정적 분석        | ESLint 9 Flat Config + Prettier                                                                      |
| CI               | GitHub Actions에서 `pnpm turbo lint test` → `pnpm turbo build`                                       |

```bash
pnpm lint
pnpm test
pnpm build
```

---

## Deployment

| 대상                | 방식                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **apps/web**        | Vercel — ISR 정적 재검증 + `/api/revalidate` 온디맨드 갱신                                                                                                                     |
| **apps/server**     | GitHub Actions가 `apps/server/Dockerfile`을 모노레포 루트 컨텍스트로 빌드 → Azure Container Registry 푸시 → Azure Container Apps 배포 (`main`/`develop` push 또는 수동 트리거) |
| **DB**              | Supabase PostgreSQL. 운영은 `synchronize: false`이며 **마이그레이션 도구 없이 DDL을 수동 적용**합니다 — 반드시 [docs/manual-ddl-log.md](docs/manual-ddl-log.md)에 기록         |
| **컨테이너 이미지** | GitLab CI에서도 web/server 이미지를 빌드해 GitLab Container Registry에 푸시                                                                                                    |

> 서버는 Azure 환경에서 Supabase IPv6 `ENETUNREACH`를 피하기 위해 `main.ts`에서 `dns.setDefaultResultOrder("ipv4first")`를 강제합니다.

---

## Getting Started

### 사전 요구사항

- Node.js 22.x
- pnpm 10.x
- Docker (로컬 PostgreSQL + pgvector 구동용)

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 준비 (루트에 .env 생성)
cp .env.example .env

# 3. 로컬 DB 기동 (PostgreSQL + pgvector)
pnpm db:up

# 4. 공용 패키지 빌드 (의존 순서 준수)
pnpm --filter @bookjeok/core build
pnpm --filter @bookjeok/api-client build
pnpm --filter @bookjeok/react-query build

# 5. 개발 서버 실행
pnpm dev:web      # 웹 + 서버 + core (웹 http://localhost:3000)
pnpm dev:server   # 서버 + core      (http://localhost:8000)
pnpm dev          # 전체 워크스페이스

# 6. 부가 도구
pnpm storybook    # Storybook (http://localhost:6006)
pnpm db:logs      # DB 로그
pnpm db:down      # DB 중지
```

API 문서는 서버 기동 후 **http://localhost:8000/api** (Swagger UI)에서 확인합니다.

### 검증

```bash
pnpm --filter @bookjeok/server exec tsc --noEmit
pnpm --filter @bookjeok/web exec tsc --noEmit
pnpm --filter @bookjeok/admin exec tsc --noEmit
pnpm test
```

---

## 환경 변수

전체 목록과 설명은 [.env.example](.env.example)에 있습니다. 주요 항목:

| 변수                                                 | 필수 | 설명                                                           |
| ---------------------------------------------------- | :--: | -------------------------------------------------------------- |
| `DATABASE_URL`                                       |  ✅  | PostgreSQL 연결 문자열                                         |
| `JWT_SECRET` / `JWT_REFRESH_SECRET`                  |  ✅  | 액세스/리프레시 토큰 서명 키                                   |
| `CLIENT_DOMAIN`                                      |  ✅  | CORS 및 소셜 로그인 리다이렉트 대상                            |
| `NAVER_CLIENT_ID` / `_SECRET` / `_CALLBACK_URL`      |  ✅  | 네이버 소셜 로그인 (도서 검색에는 쓰지 않음)                   |
| `KAKAO_CLIENT_ID` / `_SECRET` / `_CALLBACK_URL`      |  ✅  | 카카오 로그인                                                  |
| `ALADIN_TTB_KEY`                                     |      | **서버는 쓰지 않음.** 서지 수확 스크립트 전용 — 지우지 말 것   |
| `GEMINI_API_KEY`                                     |  ✅  | Google Gemini                                                  |
| `GEMINI_MODEL_NAME`                                  |      | 사용할 Gemini 모델명                                           |
| `AI_SIMILARITY_THRESHOLD` / `AI_CANDIDATE_POOL_SIZE` |      | RAG 벡터 검색 튜닝 (기본 0.35 / 30)                            |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL`               |  ✅  | 이메일 인증·알림 발송                                          |
| `BLOB_READ_WRITE_TOKEN`                              |  ✅  | Vercel Blob 이미지 업로드                                      |
| `TOSS_PAYMENTS_SECRET_KEY` / `_CLIENT_KEY`           |      | 토스페이먼츠 에스크로                                          |
| `DELIVERY_TRACKER_BASE_URL`                          |      | 배송 추적 API 엔드포인트                                       |
| `FEATURE_PAYMENT_ENABLED`                            |      | 서버 측 결제 기능 플래그                                       |
| `NEXT_PUBLIC_API_URL`                                |  ✅  | 웹에서 바라볼 백엔드 주소                                      |
| `NEXT_PUBLIC_KAKAO_APP_KEY`                          |  ✅  | 카카오 맵 JS SDK 키                                            |
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`               |      | 결제 위젯 클라이언트 키                                        |
| `NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED`                |      | 웹 측 결제 기능 플래그                                         |
| `USER_WEB_URL`                                       |      | 관리자 포털 서버가 갱신 요청을 보낼 사용자 웹 주소 (서버 전용) |
| `REVALIDATE_TOKEN`                                   |      | On-Demand ISR 갱신 시크릿 (서버 전용, 폴백 없음)               |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`                      |      | Google Analytics                                               |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID`                     |      | Microsoft Clarity                                              |
| `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`                      |      | Google AdSense                                                 |

---

## 문서 인덱스

### 앱 · 패키지

| 문서                                                                                                                          | 내용                                                      |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [apps/web/README.md](apps/web/README.md)                                                                                      | 웹 프론트엔드 개요 및 개발 원칙                           |
| [apps/web/docs/ARCHITECTURE.md](apps/web/docs/ARCHITECTURE.md)                                                                | 컴포넌트 문맥 기반 그룹화 규칙, i18n 구조                 |
| [apps/web/docs/CACHING.md](apps/web/docs/CACHING.md)                                                                          | 캐시 4개 층의 책임, 서버 시드 쿼리 대장, 재검증 범위 규칙 |
| [apps/server/README.md](apps/server/README.md)                                                                                | 백엔드 개요, 모듈 구조, 개발 원칙                         |
| [apps/admin/README.md](apps/admin/README.md)                                                                                  | 관리자 포털 기능                                          |
| [core](packages/core/README.md) · [api-client](packages/api-client/README.md) · [react-query](packages/react-query/README.md) | 공용 패키지 사용법                                        |

### 도메인 기능 문서

모든 기능 폴더에 개별 README가 있습니다.

- **서버 도메인** — [auth](apps/server/src/features/auth/README.md) · [user](apps/server/src/features/user/README.md) · [book](apps/server/src/features/book/README.md) · [review](apps/server/src/features/review/README.md) · [comment](apps/server/src/features/comment/README.md) · [reading-log](apps/server/src/features/reading-log/README.md) · [wishlist](apps/server/src/features/wishlist/README.md) · [used-book-sale](apps/server/src/features/used-book-sale/README.md) · [order](apps/server/src/features/order/README.md) · [trade](apps/server/src/features/trade/README.md) · [chat](apps/server/src/features/chat/README.md) · [notification](apps/server/src/features/notification/README.md) · [llm](apps/server/src/features/llm/README.md) · [search](apps/server/src/features/search/README.md) · [search-keyword](apps/server/src/features/search-keyword/README.md) · [insights](apps/server/src/features/insights/README.md) · [health](apps/server/src/features/health/README.md)
- **서버 횡단 관심사** — [src/shared](apps/server/src/shared/README.md) (SmartCache · 에러 체계 · 멱등성 · 활동 로그 · 메일 · 탈퇴 캐스케이드)
- **웹 도메인** — [auth](apps/web/src/features/auth/README.md) · [user](apps/web/src/features/user/README.md) · [book](apps/web/src/features/book/README.md) · [book-sale](apps/web/src/features/book-sale/README.md) · [order](apps/web/src/features/order/README.md) · [trade](apps/web/src/features/trade/README.md) · [chat](apps/web/src/features/chat/README.md) · [notification](apps/web/src/features/notification/README.md) · [review](apps/web/src/features/review/README.md) · [comment](apps/web/src/features/comment/README.md) · [reading-log](apps/web/src/features/reading-log/README.md) · [insights](apps/web/src/features/insights/README.md)
- **웹 공통 UX** — [intro](apps/web/src/features/intro/README.md) (홈 히어로) · [music](apps/web/src/features/music/README.md) (배경음악) · [confirm](apps/web/src/features/confirm/README.md) (전역 확인 다이얼로그)

### 설계 · 운영

| 문서                                                                         | 내용                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [docs/used-book-pay-implementation.md](docs/used-book-pay-implementation.md) | 에스크로 결제 시스템 설계·상태 머신·엣지 케이스·단계별 실행 계획 (기능은 현재 플래그로 비활성)                                                                                                                                       |
| [docs/book-data-migration-plan.md](docs/book-data-migration-plan.md)         | 알라딘 API 종료(2026-10-30) 대응 — 표지·서지·검색 탈외부화 계획과 진행 상황 (진행 중)                                                                                                                                                |
| [docs/manual-ddl-log.md](docs/manual-ddl-log.md)                             | 운영 DB에 수동 적용한 DDL 이력 (필독). 실행한 SQL 원본은 [docs/ddl/](docs/ddl/)                                                                                                                                                      |
| [.agents/rules/](.agents/rules/)                                             | 코드베이스 컨벤션 — [모노레포/패키지](.agents/rules/01-monorepo-packages.md) · [서버](.agents/rules/02-server-conventions.md) · [프론트엔드](.agents/rules/03-frontend-conventions.md) · [체크리스트](.agents/rules/04-checklist.md) |

---

## License

This project is licensed under the [MIT License](LICENSE).
