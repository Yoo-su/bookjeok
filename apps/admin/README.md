# 🛡️ @bookjeok/admin (Admin Portal)

> **2026-09-23 현재: 초기 세팅만 된 미사용 앱입니다.** 배포 워크플로가 없고, 아래 기능 설명은
> 계획 단계의 서술입니다. 로그인 화면은 `src/app/login/`이 아니라 `src/app/page.tsx`에 있습니다.

**Next.js 15 (App Router)** 기반의 북적 서비스 관리자 포털입니다.
서비스 운영 통계 모니터링, 부적절한 게시물(사기/스팸) 검수 및 블라인드, 사용자 웹 서비스의 온디맨드 ISR 캐시 갱신 기능을 제공합니다.

---

## 🚀 주요 기능 (Key Features)

### 1. 운영 통계 모니터링 (`/dashboard`)

- 누적 중고 도서 매물, 작성된 리뷰 수, 공감 리액션, 인기 태그 등 서비스 전반의 실시간 통계 시각화 (`@bookjeok/core`의 `InsightsResponse` 연동).

### 2. 중고 도서 장터 모니터링 및 검수 (`/dashboard/sales`)

- 실시간 등록된 중고 도서 매물 목록 조회 및 부적절한 거래글(사기/스팸) 삭제/블라인드.
- 해당 도서 판매 상세 페이지의 사용자 웹 캐시 즉시 갱신(Revalidate) 지원.

### 3. 도서 리뷰 모니터링 및 검수 (`/dashboard/reviews`)

- 독자 도서 리뷰 실시간 모니터링 및 어뷰징/스팸 리뷰 삭제.
- 해당 리뷰 상세 페이지의 사용자 웹 캐시 즉시 갱신 지원.

### 4. 온디맨드 ISR 캐시 제어 센터 (`/dashboard/cache`)

- 사용자 웹 애플리케이션(`apps/web`)의 주요 ISR 페이지(메인 홈, 독서 라운지, 중고 장터, 리뷰 피드, 인사이트 등)에 대해 시크릿 토큰 기반 Webhook을 호출하여 온디맨드로 캐시를 즉시 갱신.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand (관리자 세션 관리)
- **Domain Models**: `@bookjeok/core`
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

---

## 📂 프로젝트 구조 (Structure)

```
src/
├── app/
│   ├── login/                  # 관리자 로그인 페이지
│   └── dashboard/
│       ├── page.tsx            # 통합 통계 대시보드
│       ├── sales/              # 중고 장터 검수 페이지
│       ├── reviews/            # 도서 리뷰 검수 페이지
│       └── cache/              # ISR 캐시 제어 센터
├── layouts/                    # AdminLayout (네비게이션 사이드바 & 테마)
├── libs/                       # axios 인스턴스 (관리자 토큰 인터셉터)
└── stores/                     # useAuthStore (관리자 JWT 및 세션)
```
