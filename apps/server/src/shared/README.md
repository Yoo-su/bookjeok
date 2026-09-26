# `src/shared` — 횡단 관심사 (Cross-cutting Concerns)

도메인에 속하지 않고 요청 파이프라인 전반에 걸쳐 동작하는 코드가 모여 있습니다. 대부분 `main.ts`에서 전역 등록되거나 데코레이터로 선언적으로 적용됩니다.

---

## 전역 파이프라인 순서 (`main.ts`)

```
helmet → compression → cookie-parser → CORS(화이트리스트)
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

`ttl`은 밀리초입니다(cache-manager 3.x 기준).

**응답이 요청자에 따라 달라지지 않으면 반드시 `global`을 쓰세요.** 공용 데이터에 `ip`를 걸면
IP마다 캐시가 갈라져 히트율이 무너지고, prefix→key 맵에 IP 수만큼 키가 쌓입니다(만료돼도 맵에는
남습니다). `ip`·`user`는 응답에 실제로 요청자별 정보가 섞일 때만 씁니다.

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

`ERROR_CODES`는 도메인 프리픽스로 묶여 있습니다 — `AUTH_xxx`, `USER_xxx`, `BOOK_xxx`, `SALE_xxx`, `ORDER_xxx`, `REVIEW_xxx`, `COMMENT_xxx`, `CHAT_xxx`, `VALIDATION_xxx`, `INTERNAL_xxx`. 각 항목은 `{ code, message }` 형태이며, 프론트는 `code`로 분기하고 `message`를 그대로 노출할 수 있습니다.

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

계측 지점은 auth(로그인·가입), book(조회), review(작성·조회·리액션·수정·삭제), comment, reading-log, used-book-sale, wishlist, llm, search-keyword 등 20여 곳입니다.

> **현재 `activity_logs`를 읽는 기능은 없습니다.** 감사·분석용 원장으로 적재만 하고 있으며, 인사이트 대시보드의 통계는 각 도메인 테이블(`used_book_sales`, `reviews` 등)에서 직접 집계합니다. 이 테이블은 계속 증가하므로 보존 기간 정책이 필요합니다.

---

## `mail/` — Resend 메일

```
mail/
├── mail.module.ts
├── mail.service.ts
└── listeners/mail-event.listener.ts
```

| 용도                      | 트리거                                      |
| ------------------------- | ------------------------------------------- |
| 회원가입 이메일 인증 링크 | `AuthService` / `UserService`에서 직접 호출 |
| 채팅방 개설 알림          | `chat.room_created` 이벤트 (`async: true`)  |

발신 주소는 `RESEND_FROM_EMAIL`이며 미설정 시 `북적 <onboarding@resend.dev>`를 사용합니다. 메일 발송은 이벤트 리스너에서 비동기로 처리해 채팅방 생성 응답을 지연시키지 않습니다.

---

## `middlewares/` · `types/`

- `logger.middleware.ts` — 요청 진입 시점 로깅
- `types/express.d.ts` — `Request`에 인증 사용자 등을 얹기 위한 타입 확장

---

## 회원 탈퇴 캐스케이드

탈퇴는 각 모듈을 직접 호출하지 않고 `user.withdrawn` 이벤트 하나만 발행합니다. 아래 리스너들이 각자 자기 데이터를 정리합니다.

```
user.withdrawn
  ├── chat/listeners/chat-cleanup.listener
  ├── comment/listeners/comment-cleanup.listener
  ├── llm/listeners/llm-cleanup.listener
  ├── notification/listeners/notification-cleanup.listener
  ├── reading-log/listeners/reading-log-cleanup.listener
  ├── review/listeners/review-cleanup.listener
  ├── used-book-sale/listeners/used-book-sale-cleanup.listener
  ├── user/listeners/user-cleanup.listener
  └── shared/activity/listeners/activity-cleanup.listener
```

새 도메인을 추가할 때 사용자 데이터를 보관한다면 이 이벤트를 구독하는 리스너를 함께 추가하세요.

- **리스너는 반드시 `@OnEvent('user.withdrawn', { suppressErrors: false })`로 선언하세요.** `@nestjs/event-emitter`는 기본값으로 리스너 에러를 로그만 남기고 삼킵니다. 그러면 `emitAsync`가 성공으로 끝나 롤백이 일어나지 않고, DB 에러로 중단된 트랜잭션은 COMMIT이 조용히 ROLLBACK으로 바뀌어 "탈퇴 완료" 응답만 나갑니다. `user/listeners/user-withdrawn-listeners.spec.ts`가 9개 리스너 전부를 검사하니 새 리스너도 목록에 추가하세요.
- 이벤트 발행 전에 `UserService`가 탈퇴를 막거나 직접 정리하는 것들: 활성 결제 주문(차단), 판매자로서 예약 중인 판매글(차단, `USER_HAS_RESERVED_SALE_CANNOT_WITHDRAW`), 구매자로 예약된 남의 판매글(판매중으로 해제하고 커밋 후 `trade.reservation_cancelled` 발행).
