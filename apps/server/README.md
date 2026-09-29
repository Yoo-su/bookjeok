# 🛠️ @bookjeok/server (Backend)

북적의 백엔드 서버는 **NestJS 11**과 **TypeORM (PostgreSQL + pgvector)**을 기반으로 구축되었으며, 안정적인 데이터 관리와 실시간 WebSocket 통신, 그리고 RAG 기반 AI 기능을 제공합니다.

---

## 🚀 주요 기능 (Key Features)

### 1. 인증 및 보안 (Auth & Security)

- **JWT 이중 토큰 인증:** Access Token 및 Refresh Token 발급/검증 (`POST /auth/refresh`).
- **1회용 인증 티켓 교환 (OAuth Ticket Exchange):** 소셜 로그인 콜백 시 JWT를 브라우저 URL에 노출하지 않고 60초 일회용 티켓을 발급하여 `POST /auth/exchange`로 교환.
- **`tokenVersion` 기반 즉시 무효화:** 사용자 로그아웃 또는 계정 보안 이벤트 시 DB `tokenVersion`을 증가시켜 이전 Access·Refresh Token을 즉시 만료.
- **Rate Limiting:** `@nestjs/throttler`를 활용한 무차별 대입 공격(Brute-Force) 방어.

### 2. 도서 검색 및 RAG 기반 AI 도서 추천 (Search & LLM)

- **자체 도서 카탈로그 & RAG 검색:** 오프라인 파이프라인으로 적재된 자체 도서 DB 및 pg_trgm 전문 검색.
- **3단계 RAG 파이프라인:**
  1. 의도 분류 (Gemini Flash Function Calling)
  2. `pgvector` 코사인 유사도 벡터 검색 (`gemini-embedding-001` 768차원 임베딩)
  3. RAG 합성 및 리랭킹 (맞춤 추천 이유 `reason` 생성)
- **SSE(Server-Sent Events) 스트리밍:** 실시간 대화형 도서 탐색 스트림 전송 (`POST /search/ai/stream`, 일괄 응답은 `POST /search/ai`).
- **AI 도서 3단 요약:** Gemini 모델을 통한 도서별 서사 분석 및 DB 캐싱.

### 3. 중고 도서 장터, 결제/거래 및 실시간 채팅 (Market, Order, Trade & Chat)

- **중고 거래 CRUD:** 트랜잭션을 통한 도서 메타데이터 매핑 및 위치(지오코딩) 기반 판매글 관리, 상태 전이 및 잠금 규칙.
- **에스크로 주문 & 배송 관리 (`order`):** 토스페이먼츠 에스크로 결제 승인, 운송장 등록 및 배송 추적, 자동 취소/환불/확정 스케줄러.
- **거래 완료 및 후기 (`trade`):** 직거래/에스크로 거래 완료 기록(`TradeCompletion`), 양방향 거래 후기(`TradeReview`), 신뢰 지표 집계.
- **Socket.IO 실시간 채팅:** 판매글별 1:1 채팅방 생성, 실시간 메시지 전송, 읽음 처리, 타이핑 상태 표시, 거래 시스템 메시지.

### 4. 독서 기록, 커뮤니티, 인사이트 (Reading Log, Review, Insights)

- **독서 캘린더 & 통계:** 월별 독서 기록 조회 및 사용자 독서 통계 집계.
- **리뷰 & 리액션:** Tiptap 리치 텍스트 리뷰 CRUD(서버 측 `sanitize-html` 정제) 및 리액션(공감/인사이트/응원) 집계.
- **인사이트 대시보드:** 지역별/카테고리별 거래량, 가격 분포, 인기 태그 통계 연산.

---

## 📂 프로젝트 구조 (Structure)

```
src/
├── app/app.module.ts   # 루트 모듈 (TypeORM, CLS 트랜잭션, Throttler, Cache, Schedule)
├── main.ts             # 엔트리포인트 (cookie-parser, helmet, compression, CORS, 전역 필터/인터셉터, ValidationPipe, Swagger)
├── features/           # 도메인 모듈 (Controller - Service - Entity - DTO)
│   ├── auth            # JWT 인증, OAuth, 티켓 교환, 이메일 인증 가드, Throttler
│   ├── book            # 도서 카탈로그 조회 및 상세 정보 제공
│   ├── used-book-sale  # 중고책 판매글 관리 (거리 검색, 커서 페이지네이션)
│   ├── order           # 토스페이먼츠 에스크로 주문, 배송 추적, 자동 환불/확정 스케줄러
│   ├── trade           # 직거래/택배 거래 완료, 양방향 거래 후기, 신뢰 지표 집계
│   ├── search          # RAG 벡터 검색 및 SSE 스트림
│   ├── search-keyword  # 인기 검색어 실시간 집계
│   ├── chat            # Socket.IO WebSocket 게이트웨이 & 채팅방
│   ├── notification    # 사용자 알림 (Socket.IO 게이트웨이 + 이벤트 리스너)
│   ├── llm             # Gemini 임베딩 및 AI 도서 요약
│   ├── reading-log     # 독서 기록 및 라운지 피드
│   ├── review          # 도서 리뷰 및 리액션
│   ├── comment         # 도서/리뷰 댓글 시스템
│   ├── user            # 사용자 프로필 & tokenVersion 관리
│   ├── wishlist        # 위시리스트
│   ├── insights        # 서비스 전체 누적 통계 집계
│   ├── feedback        # 사용자 문의·제보 접수, 운영자 답변, 답변 알림
│   └── health          # @nestjs/terminus 헬스체크
└── shared/             # 횡단 관심사
    ├── activity/       # 활동 로그 (@TrackActivity + 인터셉터)
    ├── cache/          # SmartCache (프리픽스 기반 캐싱/무효화 데코레이터)
    ├── exceptions/     # BusinessException, ERROR_CODES
    ├── filters/        # GlobalExceptionFilter
    ├── interceptors/   # Transform, Logging, Idempotency, ViewCount
    └── mail/           # Resend 메일 서비스 & 이벤트 리스너
```

---

## 🏗️ 개발 원칙 (Development Rules)

1. **DTO의 `@bookjeok/core` 계약 준수**: 모든 요청/응답 DTO는 `@bookjeok/core` 인터페이스를 `implements`하여 정의합니다.
2. **Entity 정보 은닉**: 비밀번호, `tokenVersion` 등 내부 컬럼은 DTO 반환 시 절대 외부에 노출하지 않습니다.
3. **트랜잭션 무결성**: 복수 엔티티의 변경이 수반되는 작업(도서 생성 + 판매글 등록, 주문 생성 + 판매 상태 변경 등)은 `@nestjs-cls/transactional`의 `@Transactional()`로 처리합니다.
4. **에러 처리**: `HttpException`을 직접 던지지 말고 `ERROR_CODES`에 등록된 코드와 `BusinessException`을 사용합니다.
5. **신규 모듈 등록**: 새 기능 모듈은 `src/app/app.module.ts`의 `imports`에 반드시 등록합니다.
