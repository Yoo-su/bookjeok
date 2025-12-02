# 🛠️ Releaf Backend

Releaf의 백엔드 서버는 **NestJS**를 기반으로 구축되었으며, 안정적인 데이터 관리와 실시간 통신, 그리고 AI 기능을 제공합니다.
소셜 로그인부터 중고 서적 거래, 실시간 채팅, 그리고 LLM 기반 도서 요약까지 다양한 기능을 지원합니다.

## 주요 기능

### 1. 인증 (Auth)

- **JWT 기반 인증:** Access Token과 Refresh Token을 사용한 인증 시스템을 구현합니다.
- **소셜 로그인:** Kakao, Naver OAuth2.0을 지원하여 간편 로그인을 제공합니다.
- **가드 (Guards):** 라우트 보호를 위해 인증 가드를 적용하여 인가된 사용자만 접근할 수 있도록 합니다.

### 2. 유저 (User)

- **사용자 정보 관리:** 사용자의 프로필 정보 및 관련 데이터를 관리합니다.
- **판매 내역 관리:** 사용자의 중고 도서 판매 상태를 업데이트하고 내역을 관리합니다.

### 3. 도서 (Book)

- **도서 정보:** 도서 기본 정보를 관리합니다.
- **중고 도서 판매:** 사용자가 중고 도서를 등록하고 판매할 수 있는 기능을 제공합니다.
  - 판매 게시글 등록, 조회, 수정, 삭제 (CRUD)

### 4. 채팅 (Chat)

- **실시간 채팅:** WebSocket을 사용하여 사용자 간의 실시간 채팅 기능을 구현합니다.
- **채팅방 관리:** 중고 도서 판매 게시글에 대한 채팅방 생성 및 관리를 지원합니다.
- **메시지 관리:** 채팅 메시지 전송 및 읽음 처리를 관리합니다.

### 5. LLM (Large Language Model)

- **AI 기반 도서 요약:** Google Generative AI 모델을 활용하여 도서의 핵심 내용을 요약하는 기능을 제공합니다.
- **프롬프트 관리:** AI 모델에 최적화된 프롬프트를 생성하고 관리합니다.

### 6. 리뷰 (Review)

- **리뷰 관리:** 도서에 대한 리뷰 작성, 수정, 삭제 기능을 제공합니다.
- **인기 리뷰 선정:** 조회수와 리액션 수를 가중치로 계산하여 인기 리뷰를 선정합니다.
- **리액션 시스템:** '좋아요', '유익해요', '응원해요' 등 다양한 리액션을 지원하며, 조회수와 함께 사용자 참여를 유도합니다.

## 프로젝트 구조

```
src
├── app                 # 애플리케이션 핵심 모듈
├── features            # 기능별 도메인 모듈
│   ├── auth            # 인증 및 소셜 로그인
│   ├── book            # 도서 정보 및 중고 서적 판매
│   ├── chat            # 실시간 채팅
│   ├── llm             # Google Generative AI 연동
│   └── user            # 사용자 정보
└── shared              # 공용 모듈 및 유틸리티
    ├── middlewares     # 공통 미들웨어
    ├── types           # 공통 타입 정의
    └── utils           # 유틸리티 함수
```

## API 엔드포인트

| 기능 (Feature) | 엔드포인트 (Endpoint)          | HTTP 메소드 | 설명 (Description)                  | 인증 (Authentication) |
| -------------- | ------------------------------ | ----------- | ----------------------------------- | --------------------- |
| **App**        | `/`                            | `GET`       | 서버 상태 확인                      | 없음                  |
| **Auth**       | `/auth/naver`                  | `GET`       | 네이버 OAuth2 로그인 시작           | 없음                  |
|                | `/auth/naver/callback`         | `GET`       | 네이버 OAuth2 콜백 처리             | 없음                  |
|                | `/auth/kakao`                  | `GET`       | 카카오 OAuth2 로그인 시작           | 없음                  |
|                | `/auth/kakao/callback`         | `GET`       | 카카오 OAuth2 콜백 처리             | 없음                  |
|                | `/auth/logout`                 | `POST`      | 로그아웃 (토큰 제거)                | 없음                  |
|                | `/auth/refresh`                | `POST`      | Access Token 갱신                   | JWT (Refresh Token)   |
|                | `/auth/user`                   | `GET`       | 현재 로그인된 사용자 정보 조회      | JWT                   |
| **Book**       | `/book/sale`                   | `POST`      | 중고 도서 판매글 생성               | JWT                   |
|                | `/book/sales/:id/status`       | `PATCH`     | 판매글 상태 업데이트                | JWT                   |
|                | `/book/sales/recent`           | `GET`       | 최근 판매글 목록 조회               | 없음                  |
|                | `/book/sales/:id`              | `GET`       | 판매글 상세 조회                    | 없음                  |
|                | `/book/:isbn/sales`            | `GET`       | 특정 ISBN의 판매글 목록 조회        | 없음                  |
|                | `/book/sales/:id`              | `PATCH`     | 판매글 정보 수정                    | JWT                   |
|                | `/book/sales/:id`              | `DELETE`    | 판매글 삭제                         | JWT                   |
| **Chat**       | `/chat/rooms`                  | `GET`       | 내 채팅방 목록 조회                 | JWT                   |
|                | `/chat/rooms/:roomId/messages` | `GET`       | 특정 채팅방 메시지 조회             | JWT                   |
|                | `/chat/rooms`                  | `POST`      | 판매글에 대한 채팅방 생성 또는 조회 | JWT                   |
|                | `/chat/rooms/:roomId/read`     | `PATCH`     | 채팅방 메시지 읽음 처리             | JWT                   |
|                | `/chat/rooms/:roomId`          | `DELETE`    | 채팅방 나가기                       | JWT                   |
| **LLM**        | `/llm/book-summary`            | `POST`      | AI를 이용한 도서 요약 생성          | 없음                  |
| **Review**     | `/reviews`                     | `POST`      | 리뷰 작성                           | JWT                   |
|                | `/reviews`                     | `GET`       | 리뷰 목록 조회 (필터링 지원)        | 없음                  |
|                | `/reviews/feeds`               | `GET`       | 카테고리별 리뷰 피드 조회           | 없음                  |
|                | `/reviews/popular`             | `GET`       | 인기 리뷰 목록 조회                 | 없음                  |
|                | `/reviews/:id`                 | `GET`       | 리뷰 상세 조회 (조회수 증가)        | 없음                  |
|                | `/reviews/:id`                 | `PATCH`     | 리뷰 수정                           | JWT                   |
|                | `/reviews/:id`                 | `DELETE`    | 리뷰 삭제                           | JWT                   |
|                | `/reviews/:id/reactions`       | `POST`      | 리뷰 리액션 토글                    | JWT                   |
|                | `/reviews/:id/reaction`        | `GET`       | 내 리액션 정보 조회                 | JWT                   |
| **User**       | `/user/me`                     | `GET`       | 내 프로필 정보 조회                 | JWT                   |
|                | `/user/my-sales`               | `GET`       | 내가 등록한 판매글 목록 조회        | JWT                   |

## 🛠️ 사용 기술 (Tech Stack)

| Category      | Technology                                                                                      | Description                                   |
| ------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Framework** | ![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)               | 모듈형 아키텍처를 제공하는 Node.js 프레임워크 |
| **Language**  | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)   | 정적 타입 시스템을 통한 안정성 확보           |
| **Database**  | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)   | 신뢰성 높은 관계형 데이터베이스               |
| **ORM**       | ![TypeORM](https://img.shields.io/badge/TypeORM-FE0C2C?logo=typeorm&logoColor=white)            | 객체와 관계형 데이터베이스 간의 매핑          |
| **Real-time** | ![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=white)    | 실시간 양방향 통신 (채팅)                     |
| **AI**        | ![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?logo=google&logoColor=white) | 도서 요약 및 추천을 위한 LLM                  |
| **Docs**      | ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=black)            | API 문서 자동화                               |

## 시작하기

### 준비물

- Node.js (v18 이상)
- npm
- PostgreSQL

### 1. 프로젝트 클론 및 의존성 설치

```bash
$ git clone https://github.com/your-repository/releaf-back.git
$ cd releaf-back
$ npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고, 환경에 맞게 변수들을 설정합니다.

```bash
$ cp .env.example .env
```

`.env` 파일 예시:

```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=releaf

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Social Login
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CALLBACK_URL=http://localhost:3000/auth/kakao/callback
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
NAVER_CALLBACK_URL=http://localhost:3000/auth/naver/callback

# Google AI
GEMINI_API_KEY=your_gemini_api_key
```

### 3. 데이터베이스 마이그레이션

TypeORM 설정을 통해 서버 실행 시 엔티티와 데이터베이스 스키마가 동기화됩니다.

### 4. 애플리케이션 실행

```bash
# 개발 모드 (watch)
$ npm run start:dev

# 프로덕션 모드
$ npm run build
$ npm run start:prod
```

### 5. 테스트

```bash
# 모든 테스트 실행
$ npm run test

# e2e 테스트 실행
$ npm run test:e2e
```
