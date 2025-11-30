# 📚 Releaf: 문화와 지식을 잇는 아카이브

**Releaf**는 스쳐 지나가는 문화 예술 정보와 잠들어 있는 중고 서적의 가치를 다시 발견하고 연결하는 웹 플랫폼입니다. 공연, 전시 등 다채로운 문화 예술 정보를 탐색하고, 소장하고 있던 중고 서적을 다른 사람과 쉽고 편리하게 거래하며 지식의 선순환을 만들어보세요.

<br/>

### 🌐 서비스 바로가기 (Service URL)

**[http://releaf.vercel.app](http://releaf.vercel.app)**

<br/>

---

## 📖 목차 (Table of Contents)

1.  [**주요 기능 (Features)**](#-주요-기능-features)
2.  [**아키텍처 (Architecture)**](#-아키텍처-architecture)
3.  [**기술 스택 및 선정 이유 (Tech Stack & Rationale)**](#️-기술-스택-및-선정-이유-tech-stack--rationale)
4.  [**주요 기술적 내용 (Technical Highlights)**](#-기술적-주요-결정-technical-highlights)
5.  [**서비스 화면 (Service Preview)**](#-서비스-화면-service-preview)
6.  [**시작하기 (Getting Started)**](#-시작하기-getting-started)

---

## 🚀 주요 기능 (Features)

Releaf는 사용자의 문화 생활과 지식 공유를 돕기 위해 다음과 같은 핵심 기능들을 제공합니다.

- **🎨 문화 예술 정보 탐색 (Art Discovery)**
  - 공연/전시 정보를 장르별, 상태별(공연중, 공연예정)로 필터링하여 조회할 수 있습니다.
  - KOPIS API를 활용하여 신뢰도 높은 최신 데이터를 제공합니다.
  - 스타일리시한 슬라이더 UI와 `useInfiniteQuery`를 이용한 무한 스크롤로 사용자 경험을 극대화했습니다.

- **📖 중고 서적 거래 (Used Book Marketplace)**
  - 네이버 책 검색 API를 통해 판매할 도서 정보를 손쉽게 등록할 수 있습니다.
  - 판매 게시글에 대한 생성(Create), 조회(Read), 수정(Update), 삭제(Delete) 기능을 완벽하게 지원합니다.
  - 최신 등록된 판매글을 메인 페이지에서 바로 확인할 수 있습니다.

- **💬 실시간 채팅 (Real-time Chat)**
  - 판매자와 구매자 간의 1:1 실시간 채팅 기능을 제공하여 원활한 거래를 돕습니다.
  - Socket.IO를 기반으로 메시지 전송, 상대방 입력 상태 표시, 채팅방 나가기 등 필수적인 기능을 구현했습니다.
  - 채팅 위젯을 통해 어느 페이지에서든 채팅 목록을 확인하고 대화를 이어갈 수 있습니다.

- **🤖 AI 도서 요약 (AI Book Summary)**
  - Google Gemini LLM을 연동하여, 책 상세 페이지에서 AI가 생성한 핵심 요약 및 도서 추천 대상 정보를 제공합니다.

- **👤 간편한 소셜 로그인 및 마이페이지 (Social Login & My Page)**
  - 카카오, 네이버 소셜 로그인을 통해 3초 만에 간편하게 서비스를 시작할 수 있습니다.
  - 마이페이지에서 내가 등록한 판매글 목록을 관리하고, 판매 상태를 손쉽게 변경할 수 있습니다.

---

## 🏛️ 아키텍처 (Architecture)

### Feature-Based 아키텍처

프로젝트의 유지보수성과 확장성을 높이기 위해 **Feature-Based 아키텍처**를 채택했습니다. 각 기능(feature)별로 관련된 코드를 그룹화하여 응집도를 높이고, 다른 기능과의 결합도는 낮췄습니다.

```
src/
├── 📁 app/         # Next.js App Router (라우팅 및 페이지 레이아웃)
├── 📁 features/    # 핵심 비즈니스 로직 및 상태 관리 (e.g., auth, book, chat)
├── 📁 views/        # 페이지 단위의 UI 컴포넌트 조합
├── 📁 layouts/     # 공통 레이아웃 컴포넌트
└── 📁 shared/      # 전역적으로 재사용되는 컴포넌트, 유틸리티, 타입 등
```

- **`features`**: 각 도메인의 비즈니스 로직, API 연동, 상태 관리를 담당합니다. 예를 들어 `features/book`에는 책 관련 API 함수, 커스텀 훅, 타입 정의 등이 포함됩니다.
- **`views`**: 특정 페이지 또는 페이지의 큰 섹션을 구성하는 컴포넌트들의 조합을 담당합니다. `features`와 `shared`의 컴포넌트와 훅을 사용하여 UI를 완성합니다.
- **`shared`**: 여러 도메인에서 공통적으로 사용되는 UI 컴포넌트(e.g., Button, Input), 유틸리티 함수, 타입, 상수 등을 포함하여 코드 재사용성을 극대화합니다.

### Next.js App Router와 라우트 그룹

Next.js 13+의 App Router를 사용하여 라우팅을 관리합니다. 특히, `(auth)`나 `(default)`와 같은 **라우트 그룹**을 활용하여 URL 경로에 영향을 주지 않으면서 관련 페이지들을 논리적으로 그룹화하고 파일을 정리하는 목적으로 사용했습니다. 이는 프로젝트 구조의 직관성을 높이는 데 기여합니다.

---

## 🛠️ 기술 스택 및 선정 이유 (Tech Stack & Rationale)

| 구분               | 기술                                                                                                       | 선정 이유                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Framework**      | ![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)                     | SSR, SSG, App Router 등 현대적인 웹 앱 개발에 필요한 기능을 통합 제공하여 생산성과 성능을 모두 확보했습니다.                 |
| **Language**       | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)              | 정적 타입을 통해 코드의 안정성과 예측 가능성을 높이고, 대규모 애플리케이션에서의 협업 효율을 증대시켰습니다.                 |
| **Styling**        | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)         | Utility-First 접근 방식으로 빠르고 일관된 UI 개발을 가능하게 하며, 커스터마이징이 용이합니다.                                |
| **UI Components**  | ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white)                | 재사용 가능하고 접근성 높은 컴포넌트 구성을 제공하며, 코드 베이스에 직접 추가하여 자유롭게 수정할 수 있습니다.               |
| **Animation**      | ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?logo=framer&logoColor=white)            | 선언적인 API를 통해 복잡한 애니메이션과 인터랙션을 쉽게 구현하여 사용자 경험의 질을 높였습니다.                              |
| **Server State**   | ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery&logoColor=white)      | API 요청, 캐싱, 동기화 등 서버 상태 관리를 자동화하여 보일러플레이트를 줄이고 데이터 흐름을 안정적으로 관리합니다.           |
| **Client State**   | ![Zustand](https://img.shields.io/badge/Zustand-433E38?logo=react&logoColor=white)                         | 가볍고 간결한 API로 전역 UI 상태(e.g., 채팅 위젯 상태)를 관리하며, Context API의 단점을 보완합니다.                          |
| **Forms**          | ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?logo=reacthookform&logoColor=white) | 폼 상태 관리의 복잡성을 줄이고, Zod 스키마를 통해 타입 추론과 유효성 검사를 동시에 처리하여 안정성을 높였습니다.             |
| **Authentication** | ![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)                          | 백엔드에서 소셜 로그인(OAuth) 처리 및 JWT(Access/Refresh Token) 발급을 모두 담당합니다. 프론트엔드는 토큰을 받아 사용합니다. |
| **Real-time**      | ![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=white)               | 실시간 양방향 통신을 위한 표준 라이브러리로, 채팅 기능 구현에 필수적인 웹소켓 연결을 안정적으로 관리합니다.                  |
| **Deployment**     | ![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)                          | Next.js에 최적화된 배포 환경과 CI/CD 파이프라인을 제공하여 개발부터 배포까지의 과정을 자동화했습니다.                        |

---

## 💡 주요 기술적 내용 (Technical Highlights)

### 1. 서버 상태와 클라이언트 상태의 명확한 분리

- **TanStack Query (Server State)**: 모든 API 데이터는 TanStack Query를 통해 관리됩니다. `useInfiniteQuery`와 `IntersectionObserver`를 결합하여 효율적인 무한 스크롤을 구현했으며, `useMutation`을 활용한 낙관적 업데이트(Optimistic Updates)로 네트워크 지연 시간에도 불구하고 즉각적인 UI 피드백을 제공하여 사용자 경험을 향상시켰습니다. 또한, `@lukemorales/query-key-factory`를 도입하여 타입-세이프한 쿼리 키를 생성함으로써 쿼리 관리의 복잡성과 휴먼 에러를 줄였습니다.
- **Zustand (Client State)**: 로그인 후 API를 통해 받아온 사용자 정보(프로필), 채팅 위젯의 열림/닫힘 상태 등 순수 클라이언트 측의 전역 상태는 Zustand를 사용하여 간결하고 직관적으로 관리합니다. 이를 통해 불필요한 리렌더링을 방지하고 상태 관리 로직을 단순화했습니다.

### 2. NestJS 백엔드 기반의 JWT 통합 인증 (with HttpOnly Cookie)

보안 강화를 위해 인증 로직을 백엔드에 집중시키고, 프론트엔드는 인증 상태만 관리하도록 역할을 명확히 분리했습니다. 사용자가 소셜 로그인을 시도하면, 프론트엔드는 NestJS 백엔드로 구현된 소셜 로그인 API를 호출합니다. 백엔드는 모든 OAuth 인증 과정을 처리한 후, 서비스 전용 JWT(Access/Refresh Token)를 **`HttpOnly` 쿠키**에 담아 클라이언트에게 응답합니다.

이 방식의 장점은 다음과 같습니다.

- **보안 강화**: `HttpOnly` 속성으로 인해 JavaScript 코드로 쿠키에 접근할 수 없으므로, XSS(Cross-Site Scripting) 공격을 통해 토큰이 탈취될 위험을 원천적으로 차단합니다.
- **인증 자동화**: 브라우저는 동일한 도메인으로 API를 요청할 때마다 자동으로 인증 쿠키를 포함하여 전송하므로, 프론트엔드에서 `Authorization` 헤더를 수동으로 설정할 필요가 없습니다.

### 3. Vercel Blob과 Server Actions을 이용한 서버리스 이미지 처리

사용자가 업로드하는 이미지는 Next.js의 Server Actions을 통해 Vercel Blob 스토리지에 직접 업로드됩니다. 이 방식을 통해 별도의 이미지 처리용 백엔드 API 서버 없이도 파일 업로드를 구현할 수 있었으며, 서버 부하를 줄이고 프론트엔드와 긴밀하게 통합된 업로드 환경을 구축했습니다.

### 4. AI 기반 도서 정보 요약 및 추천

Google의 Gemini LLM을 활용하여 책 상세 정보 페이지에 'AI 요약'과 '이런 분에게 추천해요' 섹션을 구현했습니다. 백엔드 API를 통해 Gemini 모델을 호출하고, 도서 정보를 바탕으로 생성된 내용을 사용자에게 제공함으로써 책 선택에 도움을 주는 부가 가치를 창출했습니다.

---

## 🏁 시작하기 (Getting Started)

1.  **Repository 클론:**

    ```bash
    git clone https://github.com/Maeve-Kim/Releaf.git
    cd releaf-front
    ```

2.  **의존성 설치:**

    ```bash
    npm install
    ```

3.  **.env 파일 생성:**
    루트 디렉토리에 `.env` 파일을 생성하고 아래 환경 변수를 설정합니다.

    ```env
    # KOPIS API (공연/전시 정보)
    KOPIS_API_KEY=

    # Naver API (책 검색)
    NAVER_CLIENT_ID=
    NAVER_CLIENT_SECRET=

    # Backend API URL
    NEXT_PUBLIC_API_URL=http://localhost:8000

    # Vercel Blob
    BLOB_READ_WRITE_TOKEN=
    ```

4.  **개발 서버 실행:**

    ```bash
    npm run dev
    ```

5.  브라우저에서 `http://localhost:3000`으로 접속하여 확인합니다.
