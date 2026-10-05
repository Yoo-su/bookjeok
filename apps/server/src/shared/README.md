# `src/shared` — 횡단 관심사 (Cross-cutting Concerns)

도메인에 속하지 않고 요청 파이프라인 전반에 걸쳐 동작하는 코드가 모여 있습니다. 대부분 `main.ts`에서 전역 등록되거나 데코레이터로 선언적으로 적용됩니다.

---

## 전역 파이프라인 순서 (`main.ts`)

```
cookie-parser → helmet → compression → CORS(화이트리스트)
  │
  ▼
ThrottlerGuard (전역, 60초 / 120회)
  │
  ▼
LoggingInterceptor            요청/응답 로깅
SmartCacheInterceptor         캐시 히트 시 즉시 반환
ActivityTrackingInterceptor   @TrackActivity 활동 적재
CacheInvalidationInterceptor  @InvalidateCache 프리픽스 삭제
TransformInterceptor          성공 응답 봉투 통일
ClassSerializerInterceptor    @Exclude 등 직렬화 규칙 적용
  │
  ▼
ValidationPipe({ transform, whitelist, forbidNonWhitelisted })
  │
  ▼
GlobalExceptionFilter         모든 예외를 표준 에러 응답으로 변환
```

인터셉터는 등록 순서대로 요청을 감싸므로, **캐시 히트 시 활동 로그와 무효화 로직을 건너뛰도록** 캐시 인터셉터를 앞쪽에 두었습니다.

### 사용자 직렬화

`User` 엔티티는 판매글·리뷰·댓글·채팅에 작성자로 실려 **남에게 보입니다.** 그래서 필드를 셋으로 나눕니다(2026-09-28, 그 전에는 `password`만 숨겨 공개 페이지에 판매자 이메일·실명이 실렸음).

| 구분      | 필드                                                                               | 규칙                                     |
| --------- | ---------------------------------------------------------------------------------- | ---------------------------------------- |
| 항상 숨김 | `password`, `emailVerificationToken`, `emailVerificationExpiresAt`, `tokenVersion` | `@Exclude()`                             |
| 본인만    | `email`, `provider`, `providerId`, `name`, `gender`, `ageRange`                    | `@Expose({ groups: [USER_SELF_GROUP] })` |
| 공개      | 그 외 (`nickname`, `handle`, `deletedAt` 등)                                       | 기본 노출                                |

- 응답의 `User`가 요청자 본인이면 핸들러에 `@SerializeOptions({ groups: [USER_SELF_GROUP] })`를 붙입니다(로그인·회원가입). 내 프로필은 `MyProfileResponseDto`가 필드를 직접 고릅니다.
- **소켓 emit은 이 인터셉터를 거치지 않습니다.** 엔티티를 보낼 때는 `websocket/to-socket-payload.ts`의 `toSocketPayload()`를 거치세요. 안 그러면 비밀번호 해시까지 상대에게 갑니다.
- `IdempotencyInterceptor`는 응답을 캐시(JSON)에 저장했다가 재생하므로 저장 전에 같은 규칙으로 직렬화합니다.

---

## `cache/` — SmartCache

`@nestjs/cache-manager`가 프리픽스 단위 삭제를 제공하지 않아 그 위에 얇은 레이어를 올렸습니다.

```
cache/
├── smart-cache.module.ts
├── smart-cache.store.ts                    # prefix → key 집합을 인메모리로 관리
├── decorators/
│   ├── smart-cache.decorator.ts            # @SmartCache({ prefix, ttl, keyStrategy })
│   └── invalidate-cache.decorator.ts       # @InvalidateCache(prefix)
└── interceptors/
    ├── smart-cache.interceptor.ts
    └── cache-invalidation.interceptor.ts
```

### 사용법

```typescript
@Get('popular')
@SmartCache({ prefix: 'reviews:popular', ttl: 60_000, keyStrategy: 'global' })
async findPopular() { ... }

@Post()
@InvalidateCache('reviews:popular')
async create() { ... }
```

### `keyStrategy`

| 값        | 캐시 키 스코프   |
| --------- | ---------------- |
| `global`  | 전체 사용자 공유 |
| `ip`      | 요청 IP별        |
| `user`    | 인증 사용자별    |
| `ip+user` | 두 값 조합       |

`ttl`은 밀리초입니다(cache-manager 7 기준).

**응답이 요청자에 따라 달라지지 않으면 반드시 `global`을 쓰세요.** 공용 데이터에 `ip`를 걸면
IP마다 캐시가 갈라져 히트율이 무너지고, prefix→key 맵에 IP 수만큼 키가 쌓입니다(만료돼도 맵에는
남습니다). `ip`·`user`는 응답에 실제로 요청자별 정보가 섞일 때만 씁니다.

prefix 하나의 키가 1,000개에 닿으면 그 prefix를 비우고 다시 채웁니다. 기본 메모리 저장소(Keyv `Map`)는 만료 항목을 조회될 때만 지우므로, 검색어처럼 입력마다 새 키가 생기는 캐시가 쓰기 없이 끝없이 쌓이는 것을 막습니다.

> **주의**: `SmartCacheStore`의 prefix→key 맵은 **프로세스 인메모리**입니다. 인스턴스를 수평 확장하면 각 인스턴스가 자기 캐시만 무효화합니다. 다중 인스턴스 운영 시에는 공유 저장소(Redis 등) 기반으로 교체해야 합니다.

---

## `exceptions/` — 표준 에러 체계

```
exceptions/
├── error-codes.ts        # ERROR_CODES 레지스트리
├── business.exception.ts # BusinessException
└── index.ts
```

서비스 계층에서는 `HttpException`을 직접 던지지 않고 **항상** `BusinessException`을 사용합니다.

```typescript
throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
```

`ERROR_CODES`는 도메인 프리픽스로 묶여 있습니다 — `AUTH_xxx`, `USER_xxx`, `BOOK_xxx`, `SALE_xxx`, `ORDER_xxx`, `TRADE_xxx`, `REVIEW_xxx`, `COMMENT_xxx`, `CHAT_xxx`, `WISHLIST_xxx`, `FEEDBACK_xxx`, `VALIDATION_xxx`, `INTERNAL_xxx` 등(전체는 `error-codes.ts`). 각 항목은 `{ code, message }` 형태이며, 프론트는 `code`로 분기하고 `message`를 그대로 노출할 수 있습니다.

새 에러를 만들 때는 반드시 `error-codes.ts`에 먼저 등록합니다.

---

## `filters/` — GlobalExceptionFilter

`BusinessException`, NestJS 내장 `HttpException`, 그 외 미처리 예외를 모두 동일한 JSON 형태로 변환합니다. 프론트(`@bookjeok/api-client`의 인터셉터와 웹의 `api-error` 유틸)가 단일 형태만 다루면 되도록 하는 것이 목적입니다.

---

## `interceptors/`

| 파일                             | 역할                                             |
| -------------------------------- | ------------------------------------------------ |
| `transform.interceptor.ts`       | 성공 응답을 공통 봉투로 감쌈                     |
| `logging.interceptor.ts`         | 메서드·경로·소요시간 로깅                        |
| `idempotency.interceptor.ts`     | `x-idempotency-key` 기반 중복 요청 차단          |
| `base-view-count.interceptor.ts` | 조회수 인터셉터 공통 베이스 (리뷰·판매글이 확장) |

### 멱등성 인터셉터

`x-idempotency-key` 헤더가 없으면 그대로 통과합니다. 헤더가 있으면:

1. `idempotency:{userId}:{key}`에 `processing` 락을 10분 TTL로 설정
2. 이미 `processing`이면 → `409 REQUEST_IN_PROGRESS (이미 처리 중인 요청)`
3. 이미 `completed` 완료 상태면 → **최초 응답 객체를 그대로 캐시에서 반환** (중복 실행 방지 및 안전한 재시도 지원)
4. 핸들러가 실패하면 락을 지워 같은 키로 재시도할 수 있게 함

캐시 조회와 `processing` 기록 사이에는 await가 있어, 같은 키의 동시 요청이 둘 다 빈 값을 보고 핸들러를 두 번 실행할 수 있었습니다. 지금은 그 구간을 프로세스 안의 동기 점유(`acquiring` Set)로 감싸 늦은 요청을 `409`로 돌려보냅니다. 캐시가 프로세스 메모리이므로 **보장 범위도 단일 인스턴스**입니다. 서버를 여러 대로 늘리면 공유 저장소의 원자적 쓰기(예: set-if-absent)나 DB 유일성으로 바꿔야 합니다. 회귀 테스트는 `interceptors/idempotency.interceptor.spec.ts`(실제 `cache-manager` 메모리 저장소 사용).

결제·거래 확정 등 재시도가 부작용을 낳는 변경 엔드포인트에 적용합니다. CORS 허용 헤더에 `x-idempotency-key`가 포함되어 있습니다.

---

## `activity/` — 활동 로그

```
activity/
├── activity.module.ts
├── activity-type.enum.ts
├── entities/activity-log.entity.ts
├── decorators/track-activity.decorator.ts       # @TrackActivity(type)
├── interceptors/activity-tracking.interceptor.ts
├── services/activity.service.ts
└── listeners/activity-cleanup.listener.ts       # user.withdrawn
```

`@TrackActivity(ActivityType.XXX)`가 붙은 엔드포인트 호출을 인터셉터가 가로채 `activity_logs`에 **비동기로** 적재합니다. 적재 실패가 원래 요청을 실패시키지 않습니다.

계측 지점은 auth(로그인·가입), book(조회), review(작성·조회·리액션·수정·삭제), comment, reading-log, used-book-sale, wishlist, llm, search-keyword 등 30여 곳입니다.

> **현재 `activity_logs`를 읽는 기능은 없습니다.** 감사·분석용 원장으로 적재만 하고 있으며, 인사이트 대시보드의 통계는 각 도메인 테이블(`used_book_sales`, `reviews` 등)에서 직접 집계합니다. 이 테이블은 계속 증가하므로 보존 기간 정책이 필요합니다.

---

## `mail/` — Resend 메일

```text
mail/
├── mail.module.ts             # 전역 MailService 등록
├── mail.service.ts            # send(definition, input): 정책 → 렌더링 → 전달·결과·로그
├── mail-definition.ts         # MailDefinition<Input>, MailResult 계약
├── mail-recipient.ts          # 인증된 사용자·설정된 주소의 공통 수신 정책
├── mail-renderer.ts           # html 태그(자동 이스케이프), 레이아웃·버튼
└── resend-mail-delivery.ts    # Resend 연결·발신 주소·키 미설정 콘솔 대체
```

공통 모듈은 User·Feedback 엔티티나 도메인 이벤트를 참조하지 않습니다. 각 도메인의
`mail/*.mail.ts` 정의가 입력 타입·수신 정책·제목·본문을 함께 소유합니다.

| 용도 | 정의·연결 | 수신 조건 |
| --- | --- | --- |
| 가입·이메일 변경·인증 재발송 | `user/mail/verification.mail.ts` → AuthService / UserService 직접 호출 | 미인증 이메일에도 발송 |
| 채팅방 개설 알림 | `chat/mail/chat-room-created.mail.ts` → `ChatMailListener`, `chat.room_created` (`async: true`) | 이메일 존재·인증 완료·`deleted_` 주소 제외 |
| 문의·제보 접수 알림 | `feedback/mail/feedback-notice.mail.ts` → `FeedbackNotifyListener`, `feedback.created` (`async: true`) | `FEEDBACK_NOTIFY_EMAIL` 설정 필요, 문의 작성자의 인증 여부는 무관 |

발신 주소는 `RESEND_FROM_EMAIL`이며 미설정 시 `북적 <onboarding@resend.dev>`입니다.
링크는 `CLIENT_DOMAIN`을 사용하고 미설정 시 `http://localhost:3000`입니다. 제목·본문·CTA·수신 조건을
유지하며 모든 동적 HTML 값은 `html` 태그에서 이스케이프합니다. 중첩할 HTML은 같은 태그로 만든
조각만 사용합니다. URL의 경로·쿼리 값은 정의에서 인코딩하고, 사용자 입력을 URL 전체나 HTML/CSS
구문으로 사용하지 않습니다. HTML 이스케이프는 URL의 안전한 프로토콜을 검증하는 기능이 아닙니다.

### 결과와 실패 처리

- `sent`: Resend API가 발송 요청을 수락함(수신함 도착 보장은 아님).
- `logged`: `RESEND_API_KEY` 미설정 시 기존 콘솔 대체 동작. 발송과 구분하며 인증 재발송에서는 기존처럼 성공으로 처리.
- `skipped`: 수신 정책 때문에 발송하지 않음. 이유는 `missing-email`, `unverified`, `deleted`, `missing-configuration`.
- `failed`: 렌더링·정책 예외(`rendering`) 또는 공급자 응답·네트워크 실패(`delivery`). 공통 모듈에서 이유를 기록하고 결과로 반환.

가입·이메일 변경은 발송 완료를 기다리지 않으며 채팅·문의 이벤트도 실패를 원래 요청으로 전달하지
않습니다. 인증 재발송은 결과를 기다리고 실패 시 **503 `AUTH_VERIFICATION_EMAIL_SEND_FAILED`
(`AUTH_017`)**를 전달합니다. 토큰은 발송 전에 기존처럼 24시간 유효기간으로 저장하며 실패하더라도
저장된 토큰을 되돌리지 않습니다. 재시도하면 새 토큰을 만듭니다. 공급자 실패를 콘솔 대체 성공으로
바꾸거나 실패한 인증 링크를 콘솔에 출력하지 않습니다. 자동 재시도·큐·outbox는 없습니다.

### 새 이메일 추가

1. 해당 도메인의 `mail/*.mail.ts`에 `MailDefinition<Input>` 객체를 추가합니다.
   `recipient`에서 기존 공통 수신 정책을 선택하거나 업무 정책을 명시하고 `render`에서 제목·본문을 만듭니다.
2. 기존 이벤트 리스너 또는 직접 호출 지점에서 `mailService.send(definition, input)`을 연결합니다.
   새 이벤트라면 도메인에 이벤트 계약과 리스너를 정의하고 그 도메인 모듈에 등록합니다.
3. 발송 interface를 통해 수신 조건·제목·링크·사용자 입력·실패 동작을 검증합니다.

새 메일 때문에 MailService·Resend 연결·공통 레이아웃에 전용 메서드나 분기를 추가하지 않습니다.
입력 타입은 정의에서 결정되므로 필수 필드가 빠진 호출은 타입 검사에서 거절됩니다.
새 환경 변수는 `.env.example`과 `turbo.json.globalEnv`에도 함께 등록합니다.

---

## `middlewares/` · `types/`

- `logger.middleware.ts` — 요청 진입 시점 로깅
- `types/express.d.ts` — `Request`에 인증 사용자 등을 얹기 위한 타입 확장

## `websocket/` · `events/` · `utils/`

- `websocket/authenticate-socket.ts` — 소켓 핸드셰이크 JWT 검증(게이트웨이 공용)
- `websocket/to-socket-payload.ts` — 소켓으로 보낼 엔티티를 HTTP와 같은 규칙으로 직렬화
- `events/domain-event.ts` — 도메인 소유 계약의 타입 검사·Nest 발행/구독 함수
- `utils/adjust-counter.ts` — 조회수·반응수·좋아요 수 증감. TypeORM `increment`/`decrement`는 `updatedAt`까지 갱신해 "수정됨"·sitemap 수정일이 밀리므로 카운터는 이걸로만 바꾼다
- `utils/clamp-number.ts` — 클라이언트가 보낸 개수·페이지 값을 범위 안으로 가둠(`take(0)`·음수 OFFSET 방지)

---

## 회원 탈퇴 캐스케이드

탈퇴는 각 모듈을 직접 호출하지 않고 `user.withdrawn` 이벤트 하나만 발행합니다. 이름과 페이로드 타입은 `features/user/events/user-withdrawn.event.ts`(`USER_WITHDRAWN_EVENT`, `UserWithdrawnEvent`, `userWithdrawnEvent`)에 있습니다. 아래 리스너들이 각자 자기 데이터를 정리합니다.

```
user.withdrawn
  ├── chat/listeners/chat-cleanup.listener
  ├── comment/listeners/comment-cleanup.listener
  ├── feedback/listeners/feedback-cleanup.listener
  ├── llm/listeners/llm-cleanup.listener
  ├── notification/listeners/notification-cleanup.listener
  ├── reading-log/listeners/reading-log-cleanup.listener
  ├── review/listeners/review-cleanup.listener
  ├── used-book-sale/listeners/used-book-sale-cleanup.listener
  ├── user/listeners/user-cleanup.listener
  └── shared/activity/listeners/activity-cleanup.listener
```

새 도메인을 추가할 때 사용자 데이터를 보관한다면 이 이벤트를 구독하는 리스너를 함께 추가하세요.

- **리스너는 반드시 `@OnDomainEvent(userWithdrawnEvent, { suppressErrors: false })`로 선언하세요.** `@nestjs/event-emitter`는 기본값으로 리스너 에러를 로그만 남기고 삼킵니다. 그러면 `emitAsync`가 성공으로 끝나 롤백이 일어나지 않고, DB 에러로 중단된 트랜잭션은 COMMIT이 조용히 ROLLBACK으로 바뀌어 "탈퇴 완료" 응답만 나갑니다. `user/listeners/user-withdrawn-listeners.spec.ts`가 10개 리스너 전부를 검사하니 새 리스너도 목록에 추가하세요.
- 이벤트 발행 전에 `UserService`가 탈퇴를 막거나 직접 정리하는 것들: 활성 결제 주문(차단), 판매자로서 예약 중인 판매글(차단, `USER_HAS_RESERVED_SALE_CANNOT_WITHDRAW`), 구매자로 예약된 남의 판매글(판매중으로 해제하고 커밋 후 `trade.reservation_cancelled` 발행).

## 다중 인스턴스 전제

서버는 **단일 인스턴스를 전제로** 아래 상태를 프로세스 메모리에 둡니다. 운영 replica 수는 이 저장소에 설정이 없어(배포 workflow는 이미지만 교체) 확인되지 않았습니다. 수평 확장이 필요해지면 항목마다 맞는 공유 구현으로 바꿔야 하며, Redis 하나로 전부 해결된다고 가정하지 마세요. 지금은 요구가 없어 공유 저장소·Socket.IO adapter를 도입하지 않았습니다.

| 상태 | 위치 | 여러 대일 때 생기는 일 | 바꿀 방향 |
| --- | --- | --- | --- |
| 응답 캐시·prefix 맵 | `CacheModule`(메모리) · `cache/smart-cache.store.ts` | A에서 한 무효화가 B 캐시에 닿지 않아 낡은 응답 | 공유 캐시 + prefix 무효화 재설계 |
| 조회수 중복 방지 | `interceptors/base-view-count.interceptor.ts` (같은 캐시) | 인스턴스마다 따로 세어 중복 집계 | 공유 캐시 |
| 멱등성 키 | `interceptors/idempotency.interceptor.ts` | 다른 인스턴스로 간 재시도·동시 요청이 다시 실행 | 공유 저장소 set-if-absent 또는 DB 유일성 |
| 채팅방 생성 합치기 | `features/chat` `roomCreationTasks` Map | 같은 (판매글, 구매자) 방이 둘 생길 수 있음 | 확장할 때 구매자 컬럼 + 유일성 제약 검토 |
| Socket.IO room | 채팅·알림 게이트웨이 (adapter 없음) | B에 붙은 사용자가 A의 room 발행을 못 받음 | 공유 adapter |
| 도메인 이벤트 | `EventEmitter2` 인메모리 | 발행한 인스턴스에서만 처리, 재시작 시 유실 | 전달 보장이 요구되면 outbox·큐 |
| 스케줄러 | `features/order/services/order-scheduler.service.ts` (현재 결제 플래그로 꺼짐) | 결제를 켜면 인스턴스마다 같은 크론 실행 | 분산 락 또는 단일 실행 워커 |
| 요청 제한 | `ThrottlerModule` 기본 메모리 저장소 | 한도가 인스턴스 수만큼 늘어남 | 공유 저장소 |
| 임베딩 질의 캐시 | `features/search/services/embedding.service.ts` | 적중률만 떨어짐(정합성 문제 없음) | 그대로 둬도 됨 |

## 도메인 이벤트 계약 (`events/domain-event.ts`)

업무 이벤트의 이름·payload는 각 `features/*/events/`에 있습니다. 공용 폴더는 이벤트 목록을
소유하지 않습니다. 활동 로그만 횡단 관심사 모듈인 `activity/events/activity-log-created.event.ts`에
`ACTIVITY_LOG.CREATED`·payload 계약을 둡니다. 활동 로그의 `async: true`·버퍼·실패 처리는 유지합니다.

| 소유 모듈 | 계약 | 소비자 |
| --- | --- | --- |
| chat | `chat-room-created.event.ts` | ChatMailListener |
| comment | `comment.events.ts` | CommentNotificationListener |
| review | `review.events.ts` | ReviewNotificationListener |
| feedback | `feedback.events.ts` | 운영자 메일·답변 알림 리스너 |
| trade | `trade.events.ts`, `trade-review-created.event.ts` | TradeEventListener, OrderEventListener(후기), UserService(예약 해제 발행) |
| order | `order.events.ts` | OrderEventListener |
| user | `user-withdrawn.event.ts` | 10개 탈퇴 정리 리스너 |
| activity | `activity-log-created.event.ts` | ActivityService |

`defineDomainEvent<Payload>()('이름')`으로 도메인 계약을 정의하고 `emitDomainEvent(emitter, contract,
payload)`·`emitDomainEventAsync`·`@OnDomainEvent(contract, options)`로 연결합니다. 발행 payload는
계약에서만 추론하고, 리스너 매개변수는 계약과 양방향으로 호환되는지 검사하므로 필수 필드 누락과
nullable 축소를 거부합니다. 주문의 대기 객체는 도메인별 union과 `emitPendingOrderEvent`로 연결합니다.

함수들은 기존 EventEmitter2의 `emit`·`emitAsync`와 Nest `OnEvent`를 그대로 호출합니다.
payload를 복제·정규화하지 않고 emit 반환값·Promise·오류를 그대로 전달합니다. 리스너의
async/suppressErrors 옵션·catch·트랜잭션 경계는 호출 지점이 소유합니다. 인메모리 전달이며
전달 보장·재시도·큐·outbox를 추가하지 않았습니다. Socket.IO 이벤트는 별도 계약입니다.

검증: 서버 `tsc --noEmit`은 `apps/server/test/domain-event.typecheck.ts`의 `@ts-expect-error` 사례도 검사합니다.
`domain-event.spec.ts`는 기존 26개 이름, 실제 리스너의 이름·옵션(묶음 구독 포함), 즉시 payload 전달과
오류 전파를 확인합니다. `user-withdrawn-listeners.spec.ts`는 실제 10개 리스너 오류가 `emitAsync`까지
전파되는지 검사합니다. 새 계약은 도메인에 추가하고 발행·구독 양쪽을 연결한 뒤 이 검증도 갱신하세요.
