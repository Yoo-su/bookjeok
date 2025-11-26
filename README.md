# Releaf (릴리프)

**문화와 지식을 잇는 아카이브, Releaf**

Releaf는 공연, 전시 등 다채로운 문화 예술 정보를 탐색하고, 소장하고 있던 중고 서적을 거래하며 지식의 선순환을 만드는 웹 플랫폼입니다.

## 📂 프로젝트 구조 (Project Structure)

이 프로젝트는 **TurboRepo**를 사용한 모노레포(Monorepo) 구조로 구성되어 있습니다.

```
releaf/
├── releaf-front/   # Next.js 기반 프론트엔드 애플리케이션
└── releaf-back/    # NestJS 기반 백엔드 API 서버
```

- **[Frontend (releaf-front)](./releaf-front/README.md)**: Next.js 15, React 19, Tailwind CSS, TanStack Query
- **[Backend (releaf-back)](./releaf-back/README.md)**: NestJS, PostgreSQL, TypeORM, Socket.IO

## 🚀 시작하기 (Quick Start)

### 사전 요구사항 (Prerequisites)

- Node.js (v18+)
- pnpm (권장) 또는 npm
- PostgreSQL (백엔드 실행 시 필요)

### 설치 (Installation)

루트 디렉토리에서 의존성을 설치합니다.

```bash
pnpm install
```

### 실행 (Running)

TurboRepo를 사용하여 프론트엔드와 백엔드를 동시에 실행할 수 있습니다.

```bash
pnpm dev
```

또는 각 디렉토리에서 개별적으로 실행할 수도 있습니다.

- **Frontend**: `cd releaf-front && npm run dev`
- **Backend**: `cd releaf-back && npm run start:dev`

## ✨ 주요 기능 (Key Features)

- **문화 예술 정보**: KOPIS API 연동을 통한 실시간 공연/전시 정보 제공
- **중고 서적 거래**: 네이버 책 검색 API 연동 및 중고 거래 게시판 (CRUD)
- **실시간 채팅**: Socket.IO를 이용한 판매자-구매자 간 1:1 채팅
- **AI 도서 요약**: Google Gemini LLM을 활용한 도서 정보 요약 및 추천
- **소셜 로그인**: 카카오, 네이버 OAuth2.0 지원

## 📝 라이선스 (License)

This project is licensed under the MIT License.
