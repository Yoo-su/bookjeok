# Frontend Feature: Auth (인증)

로그인·회원가입·소셜 로그인 콜백·이메일 인증·라우트 보호를 담당합니다.

## 1. 폴더 구조

```
auth/
├── schema.ts                              # Zod 로그인/회원가입 스키마
├── stores/
│   ├── use-auth-store.ts                  # 토큰·사용자 세션 (Zustand)
│   └── __tests__/use-auth-store.test.ts
├── utils/
│   ├── return-url.ts                      # 로그인 후 복귀 경로 저장/복원
│   └── purge-user-storage.ts              # 세션 종료 시 탭 저장소의 사용자 흔적 삭제
├── mutations/
└── components/
    ├── forms/
    │   ├── login-form/
    │   └── signup-form/
    ├── guards/
    │   ├── auth-guard/                    # 로그인 필요 라우트 보호
    │   ├── admin-guard/                   # 운영자(role ADMIN)만 통과 — /admin/feedback
    │   └── guest-guard/                   # 로그인 상태면 진입 차단
    ├── email-verification-alert.tsx       # 미인증 회원 안내 + 재발송
    └── __tests__/email-verification-alert.test.tsx
```

## 2. 인증 플로우

### 소셜 로그인 — 1회용 티켓 교환

JWT를 URL 쿼리스트링에 실어 보내면 브라우저 히스토리·리퍼러·서버 로그에 토큰이 남습니다. 그래서 콜백에는 **60초짜리 1회용 티켓**만 실립니다.

```
/login → 네이버·카카오 OAuth
              │
              ▼
서버 콜백 → createAuthTicket() (UUID, 캐시에 60초 TTL)
              │
              ▼ redirect: /callback?ticket=xxx
/[locale]/(auth)/callback  (callback 페이지)
              │
              ▼ POST /auth/exchange { ticket }
        accessToken + 사용자 정보 수신 (티켓은 즉시 폐기)
              │
              ▼
useAuthStore 저장 → return-url 로 복귀
```

콜백은 `ticket`만 받습니다. URL로 토큰을 직접 받던 예전 경로는 공격자가 자기 토큰을 담은 링크로 피해자를 공격자 계정에 로그인시킬 수 있어 제거했습니다.

### Silent Refresh

Access Token 만료는 `@bookjeok/api-client`의 Axios 인터셉터가 처리합니다. 401을 감지하면 refresh를 시도하고 원래 요청을 재시도합니다. **프론트 코드에서 토큰 갱신을 직접 다루지 마세요.** refresh가 **401로 거부**되면 스토어를 비우고 로그인으로 보냅니다. 네트워크 오류·5xx·429는 일시 장애로 보고 로그인 상태를 유지합니다(SSE 클라이언트도 같은 규칙).

서버는 `user.tokenVersion`을 올려 Access·Refresh Token을 즉시 무효화할 수 있습니다(로그아웃·보안 이벤트).

### 세션 종료

로그아웃·refresh 거부·탈퇴는 모두 하드 내비게이션으로 끝내 쿼리 캐시·스토어·소켓을 폐기합니다(`shared/utils/session.ts`). `clearAuth()`는 로그인 세션이 있었을 때 sessionStorage의 최근 본 책과 AI 대화 기록도 지웁니다.

### 이메일 인증

```
회원가입 → POST /auth/send-verification-email (Resend 발송)
                  │
                  ▼ 메일의 링크
/[locale]/(auth)/verify-email → POST /auth/verify-email
```

`email-verification-alert`는 미인증 회원에게 안내와 재발송 버튼을 노출합니다. **중고거래 진입(판매글 작성·거래 채팅·구매자 지정·결제)은 인증 완료 회원만 가능**하며, 최종 차단은 서버의 `EmailVerifiedGuard`가 수행합니다.

## 3. 가드

| 컴포넌트      | 동작                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `auth-guard`  | 비로그인 시 로그인으로 리다이렉트 + 복귀 경로 저장                                                                               |
| `admin-guard` | `role !== ADMIN`이면 접근 차단. 현재 `admin-feedback-view`(`/admin/feedback`)에만 씁니다. 최종 차단은 서버 `AdminGuard`가 합니다 |
| `guest-guard` | 이미 로그인했으면 로그인/회원가입 페이지 진입 차단                                                                               |

공개 라우트 목록은 `shared/constants/public-routes.ts`에 있고, 라우트 상수는 `shared/constants/paths.ts`(`PATHS`)를 사용합니다. 경로 문자열을 하드코딩하지 마세요.

전역 사용자 컨텍스트는 `shared/providers/user-provider.tsx`가 제공합니다.

## 4. 관련

- 서버: [`features/auth`](../../../../server/src/features/auth/README.md)
- 뷰: `login-view`, `signup-view`, `verify-email-view`, `/[locale]/(auth)/callback`
