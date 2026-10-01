# User Module (`features/user`)

`UserModule`은 사용자 계정(`users`)과 프로필·탈퇴·이메일 인증 관련 비즈니스 로직을 관리합니다. 소셜·이메일 로그인 자체는 [`auth`](../auth/README.md)가 담당하고, 이 모듈은 사용자 조회·생성을 제공합니다.

## 1. 주요 파일 및 역할

- **`controllers/user.controller.ts`**: `/user` 경로의 API. 내 프로필·통계·판매글, 공개 프로필, 닉네임 검사, 프로필 수정, 회원 탈퇴.
- **`services/user.service.ts`**: 사용자 조회·생성(소셜/이메일), 프로필 수정(이메일 변경 시 재인증 토큰 발급, 로컬 유저는 이메일을 `null`로 비울 수 없음), 공개 프로필 집계, `tokenVersion` 증가, 이메일 인증 토큰 검증·재발송, **회원 탈퇴**(아래 참고). 개발 환경에서는 `onModuleInit`이 `users` id 시퀀스를 동기화합니다.
- **`entities/user.entity.ts`**: `users` 테이블. 필드별 공개 범위(항상 숨김/본인만/공개)는 [`shared/README.md`의 「사용자 직렬화」](../../shared/README.md)를 보세요. **`wishlist.entity.ts`**(`Wishlist`)도 이 폴더에 있고, 위시리스트 API는 [`wishlist`](../wishlist/README.md) 모듈이 제공합니다.
- **`dtos/`**: `update-user.dto.ts`(닉네임·프로필 이미지·실명·성별·연령대·이메일. 아래 「프로필 수정 검증」 참고), `my-profile-response.dto.ts`(내 프로필 응답, `role` 포함), `public-user-profile.dto.ts`(공개 프로필), `update-sale-status.dto.ts`.
- **`decorators/current-user.decorator.ts`**: `req.user`를 `@CurrentUser()`로 꺼냅니다.
- **`utils/nickname-generator.ts`**: 신규 사용자에게 "형용사 + 명사" 패턴 닉네임(15×15조합)을 부여합니다.
- **`listeners/user-cleanup.listener.ts`**: `user.withdrawn`을 받아 사용자 행을 익명화합니다. 탈퇴 리스너 목록은 [`shared/README.md`](../../shared/README.md#회원-탈퇴-캐스케이드).
- **`constants.ts`**: 공개 프로필 노출 개수 상한, `USER_SELF_GROUP`.

## 2. API 엔드포인트

| HTTP Method | 경로 (`/user/...`) | 설명                                                                           | 인증                          |
| :---------- | :----------------- | :----------------------------------------------------------------------------- | :---------------------------- |
| `GET`       | `/profile`         | 내 프로필 (`MyProfileResponseDto`)                                             | ✅                            |
| `GET`       | `/profile/:handle` | 공개 프로필 (핸들·닉네임·숫자 id 순으로 조회, 탈퇴 회원은 404)                 | ❌                            |
| `GET`       | `/check-nickname`  | 닉네임 사용 가능 여부 (`?nickname=`). 로그인 상태면 내 현재 닉네임은 사용 가능 | 선택 (`OptionalJwtAuthGuard`) |
| `PATCH`     | `/`                | 프로필 수정                                                                    | ✅                            |
| `GET`       | `/my-sales`        | 내가 등록한 판매글                                                             | ✅                            |
| `GET`       | `/stats`           | 내 판매글 상태별 개수·활성 채팅방 수·리뷰 수                                   | ✅                            |
| `DELETE`    | `/me`              | 회원 탈퇴                                                                      | ✅                            |

위시리스트(`/user/wishlist/*`)는 경로만 `/user` 아래일 뿐 이 컨트롤러가 아니라 `wishlist` 모듈의 컨트롤러입니다.

### 프로필 수정 검증

생략한 필드는 바꾸지 않습니다. 규칙 상수는 `@bookjeok/core`(`features/user/constants.ts`)에 있고 웹 모달도 같은 값을 씁니다.

| 필드              | 규칙                                                                                                                                                                                                    |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nickname`        | NFC 정규화·앞뒤 공백 제거 후 2~20자, 한글 완성형·영문·숫자·`_`, 단어 사이 공백 한 칸. `null`·빈 값 거부. 허용 목록인 이유는 한글 채움 문자(U+3164)·폭 없는 공백으로 만든 빈 닉네임을 막기 위해서입니다. |
| `email`           | 형식 검사. 로컬 가입자는 이메일로 로그인하므로 `null`로 비울 수 없습니다(`LOCAL_USER_EMAIL_REQUIRED`).                                                                                                  |
| `name`            | 50자 이하. 공백뿐이면 `null`로 저장합니다.                                                                                                                                                              |
| `gender`          | `M`·`F`·`U` 또는 `null`                                                                                                                                                                                 |
| `ageRange`        | `0-9` ~ `60-` 7개 값 또는 `null`                                                                                                                                                                        |
| `profileImageUrl` | 기본 이미지 식별자(`default_profile1~10`) 또는 Vercel Blob(`https://*.public.blob.vercel-storage.com/...`) 주소, 또는 `null`. 가입 시 받은 소셜 프로필 주소는 그대로 두면 유지됩니다.                   |

회원가입(`RegisterDto`)의 닉네임 규칙은 2~10자·공백 불가로 더 엄격합니다. 자동 생성 닉네임("행복한 판다")에 공백이 있어 수정 규칙에서는 공백을 허용합니다.

## 3. `User` 엔티티 주요 컬럼

| 컬럼명                                                  | 타입                     | 설명                                                  |
| :------------------------------------------------------ | :----------------------- | :---------------------------------------------------- |
| `id`                                                    | `number`                 | PK                                                    |
| `provider` / `providerId`                               | `string`                 | `naver`·`kakao`·`local`, 소셜 측 고유 ID              |
| `email`                                                 | `string` (nullable)      | `@Unique`                                             |
| `password`                                              | `string` (nullable)      | 이메일 가입 해시. 항상 숨김                           |
| `nickname` / `handle`                                   | `string`                 | 표시 이름 / 프로필 URL용 고유 핸들 (핸들은 수정 불가) |
| `profileImageUrl`                                       | `string` (nullable)      |                                                       |
| `isReadingLogPublic`                                    | `boolean`                | 독서 기록 공개 여부 (기본 `true`)                     |
| `role`                                                  | `'USER' \| 'ADMIN'`      | `AdminGuard`가 확인. 운영자는 SQL로 지정              |
| `name` / `gender` / `ageRange`                          | `string` (nullable)      | 소셜에서 받은 값. 본인만 볼 수 있음                   |
| `isEmailVerified`                                       | `boolean`                | 이메일 인증 여부. `EmailVerifiedGuard` 기준           |
| `emailVerificationToken` / `emailVerificationExpiresAt` | nullable                 | 인증 링크 토큰과 24시간 만료. 항상 숨김               |
| `tokenVersion`                                          | `number`                 | 토큰 즉시 무효화용. 항상 숨김                         |
| `lastActiveAt`                                          | `timestamptz` (nullable) | 최근 활동 시각                                        |
| `deletedAt`                                             | `timestamptz` (nullable) | 탈퇴 시각 (소프트 삭제)                               |
| `createdAt` / `updatedAt`                               | `timestamptz`            |                                                       |

관계: `usedBookSales`, `chatParticipants`, `reviews`, `readingLogs` (1:N).

## 4. 회원 탈퇴

`UserService.withdraw`는 한 트랜잭션에서 상태를 바꾼 뒤 `user.withdrawn` 이벤트로 각 도메인이 자기 데이터를 정리하게 합니다. 활성 결제 주문이 있거나 판매자로서 예약 중인 판매글이 있으면 탈퇴를 막고, 구매자로 예약된 남의 판매글은 판매중으로 되돌립니다(커밋 후 `trade.reservation_cancelled` 발행). 자세한 규칙은 [`shared/README.md`의 「회원 탈퇴 캐스케이드」](../../shared/README.md#회원-탈퇴-캐스케이드)에 있습니다.

## 5. 관련

- 웹: [`features/user`](../../../../web/src/features/user/README.md)
- 인증·가드: [`features/auth`](../auth/README.md)
