# 🛠️ @bookjeok/server (Backend)

북적의 백엔드 서버는 **NestJS 11**과 **TypeORM (PostgreSQL + pgvector)**을 기반으로 구축되었으며, 안정적인 데이터 관리와 실시간 WebSocket 통신, 그리고 Gemini 기반 AI 도서 요약을 제공합니다. RAG 대화형 추천 모듈(`search`)도 남아 있으나 2026-09-29부터 웹 UI에 노출하지 않습니다.

---

## 🚀 주요 기능 (Key Features)

### 1. 인증 및 보안 (Auth & Security)

- **JWT 이중 토큰 인증:** Access Token 및 Refresh Token 발급/검증 (`POST /auth/refresh`).
- **1회용 인증 티켓 교환 (OAuth Ticket Exchange):** 소셜 로그인 콜백 시 JWT를 브라우저 URL에 노출하지 않고 60초 일회용 티켓을 발급하여 `POST /auth/exchange`로 교환.
- **`tokenVersion` 기반 즉시 무효화:** 사용자 로그아웃 또는 계정 보안 이벤트 시 DB `tokenVersion`을 증가시켜 이전 Access·Refresh Token을 즉시 만료.
- **Rate Limiting:** `@nestjs/throttler`를 활용한 무차별 대입 공격(Brute-Force) 방어.

### 2. 도서 검색 및 AI (Book, Search & LLM)

- **자체 도서 카탈로그 검색:** 운영자 적재 도구(`tools/book-ingest`)로 확보한 자체 도서 DB를 `pg_trgm` 부분일치로 검색. 런타임에 외부 도서 API를 부르지 않음.
- **AI 도서 3단 요약:** ISBN으로 DB 서지(제목·저자·소개·출판사)를 읽어 Gemini로 요약하고 ISBN 기준으로 캐싱.
- **RAG 대화형 추천 (웹 UI 비노출, 서버 유지):** 엔드포인트는 그대로이며 `books.embedding` 값은 비워 둔 상태라 되살리려면 임베딩 재생성이 먼저입니다. 구현된 3단계 파이프라인:
  1. 의도 분류 (Gemini Flash Function Calling)
  2. `pgvector` 코사인 유사도 벡터 검색 (`gemini-embedding-001` 768차원 임베딩)
  3. RAG 합성 및 리랭킹 (맞춤 추천 이유 `reason` 생성)
  - SSE 스트리밍 `POST /search/ai/stream`, 일괄 응답 `POST /search/ai`.

### 3. 중고 도서 장터, 결제/거래 및 실시간 채팅 (Market, Order, Trade & Chat)

- **중고 거래 CRUD:** DB에 있는 도서에만 판매글을 연결(`BookResolvePipe`)하는 위치(지오코딩) 기반 판매글 관리, 상태 전이 및 잠금 규칙.
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
│   ├── search          # RAG 벡터 검색 및 SSE 스트림 (웹 UI 비노출)
│   ├── search-keyword  # 인기 검색어 실시간 집계
│   ├── chat            # Socket.IO WebSocket 게이트웨이 & 채팅방
│   ├── notification    # 사용자 알림 (Socket.IO 게이트웨이 + 이벤트 리스너)
│   ├── llm             # Gemini AI 도서 요약 (임베딩은 search)
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
    └── mail/           # 공통 메일 렌더링·수신 정책·Resend 전달 (정의·리스너는 각 도메인)
```

---

## 🏗️ 개발 원칙 (Development Rules)

1. **DTO의 `@bookjeok/core` 계약 준수**: 모든 요청/응답 DTO는 `@bookjeok/core` 인터페이스를 `implements`하여 정의합니다.
2. **Entity 정보 은닉**: 비밀번호, `tokenVersion` 등 내부 컬럼은 DTO 반환 시 절대 외부에 노출하지 않습니다.
3. **트랜잭션 무결성**: 복수 엔티티의 변경이 수반되는 작업(채팅방 + 참가자 생성, 주문 생성 + 판매 상태 변경, 회원 탈퇴 정리 등)은 `@nestjs-cls/transactional`의 `@Transactional()`로 처리합니다.
4. **에러 처리**: `HttpException`을 직접 던지지 말고 `ERROR_CODES`에 등록된 코드와 `BusinessException`을 사용합니다.
5. **신규 모듈 등록**: 새 기능 모듈은 `src/app/app.module.ts`의 `imports`에 반드시 등록합니다.

도메인 이벤트의 이름·payload는 각 `features/*/events/`가 소유합니다. 발행·구독은 같은 계약의
`emitDomainEvent`·`emitDomainEventAsync`·`@OnDomainEvent`를 사용하며 주문 대기 객체도 타입을
연결합니다. [공용 문서의 계약·검증 규칙](src/shared/README.md#도메인-이벤트-계약-eventsdomain-eventts)을 참고하세요.
