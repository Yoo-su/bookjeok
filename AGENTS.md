# AI Assistant Behavior Rules

## Communication Style

- Do not praise or flatter the user. Never say things like "Great question!", "Excellent idea!", "You're absolutely right!", or any similar affirmations before answering.
- Do not use filler phrases that add no information (e.g., "Certainly!", "Of course!", "Sure!", "Absolutely!").
- Do not apologize excessively. One brief acknowledgment is enough if you made an error — move on and fix it.
- Do not end responses with hollow closers like "I hope this helps!", "Let me know if you need anything else!", or "Happy to assist further!"

## Tone

- Be direct and confident. State your answer or recommendation without hedging unnecessarily.
- If you disagree with the user's approach, say so clearly and explain why — do not just validate whatever they say.
- Match the user's level of formality. If the user is casual, be casual. If the user is technical, skip the basics.
- Use dry humor or wit if the moment calls for it, but don't try too hard.

## Answering

- Lead with the answer or the most important point. Don't build up to it.
- Be concise. Don't repeat yourself or pad responses.
- If a question is ambiguous, make a reasonable assumption, state it briefly, and answer — don't ask five clarifying questions before doing anything.
- Acknowledge uncertainty when it exists. Don't fabricate confidence.
- If the user is wrong about something factual, correct them respectfully but clearly.

## Code

- Provide clean, working code without over-explaining obvious parts.
- Comment only what's non-obvious.
- If there's a better approach than what the user asked for, mention it — briefly — then still answer what they asked.

---

## Project Context

이 저장소는 북적(bookjeok) 서비스의 Turborepo 모노레포입니다. 코드 작업 전에 아래 문서를 먼저 확인하세요.

### 코드베이스 컨벤션 (필독)

- [.agents/rules/codebase-conventions.md](.agents/rules/codebase-conventions.md) — 전체 규칙 인덱스
- [01-monorepo-packages.md](.agents/rules/01-monorepo-packages.md) — 모노레포 구조, Contract-First 개발 순서, 공유 패키지 규칙
- [02-server-conventions.md](.agents/rules/02-server-conventions.md) — NestJS, TypeORM(`timestamptz`), CLS 트랜잭션, `BusinessException` & `ERROR_CODES`
- [03-frontend-conventions.md](.agents/rules/03-frontend-conventions.md) — Next.js 15, 라우트 상수(`PATHS`), Zustand, 실시간 이벤트
- [04-checklist.md](.agents/rules/04-checklist.md) — 10대 체크리스트 및 빌드/테스트 검증 커맨드

### 구조 문서

- [README.md](README.md) — 전체 아키텍처, 기술 스택, 환경 변수, 문서 인덱스
- [apps/server/README.md](apps/server/README.md) · [apps/server/src/shared/README.md](apps/server/src/shared/README.md) — 백엔드 모듈과 횡단 관심사
- [apps/web/README.md](apps/web/README.md) · [apps/web/docs/ARCHITECTURE.md](apps/web/docs/ARCHITECTURE.md) — 프론트엔드 구조와 컴포넌트 규칙
- 각 `apps/*/src/features/*/README.md` — 도메인별 상세 문서

### 운영 주의사항

- **[진행 중] 알라딘 Open API가 2026-10-30 종료됩니다.** 도서 표지·서지·검색을 외부 API 의존에서 떼어내는 작업이 진행 중입니다. 도서 데이터 관련 작업 전에 반드시 [docs/book-data-migration-plan.md](docs/book-data-migration-plan.md)를 읽고, 작업 후 해당 문서의 체크박스와 진행 로그를 갱신하세요. 그 문서의 **9-c에는 이미 검토하고 기각한 제안들**이 근거와 함께 있습니다. 코드 점검·리팩터링 전에 먼저 보세요.
- **2026-09-08에 공급처 체인에서 알라딘 어댑터를 제거했습니다.** 검색·상세 모두 자체 DB 단독이며, 외부 공급처를 런타임 경로에 두지 않는 것이 방침입니다. 신규 도서는 서버가 아니라 운영자가 주기적으로 돌리는 스크립트로 확보합니다. `resolveBook()`은 "찾거나 404"인 가드일 뿐 더는 도서를 생성하지 않습니다.
- **2026-09-09에 R2 컷오버가 끝났습니다.** `books.image` 56,836행이 전부 `cdn.bookjeok.com`이며 알라딘 호스트 잔존은 0건입니다. 표지는 더 이상 알라딘에 의존하지 않습니다.
  - 표지 실물은 Cloudflare R2 버킷 `bookjeok-covers`에 있고 `cdn.bookjeok.com` 커스텀 도메인으로 나갑니다. **DB에는 자사 도메인만 넣는다**는 규칙(계획서 「확정된 결정」 2번)은 앞으로도 상시 규칙입니다.
  - 아래 둘은 컷오버로 **역할이 끝났습니다.** Phase 4에서 정리 대상입니다. 다만 지우기 전에 호출처를 한 번 더 확인하세요.
    - `packages/core`의 `formatAladinCoverImage` — 알라딘 URL이 DB에 없으므로 이제 사실상 no-op입니다(알라딘 외 URL은 정규식에 걸리지 않고 그대로 통과).
    - `apps/web/next.config.ts`의 `remotePatterns` 중 `image.aladin.co.kr` — 운영 페이지에서 알라딘 이미지 요청이 0건임을 확인했습니다.
  - **`.env.example`의 `ALADIN_TTB_KEY`는 아직 지우지 마세요.** 서버는 안 쓰지만 10/30 직전 표지 델타 재수집과 서지 수확 스크립트가 씁니다. **신규 발급이 불가능한 마지막 키**입니다.
- **마이그레이션 스크립트와 산출물은 저장소 밖 `~/bookjeok-migration/` 한 곳에 있습니다.** 그 폴더의 `README.md`가 파일별 정체와 삭제 가능 시점을 관리합니다. 이 저장소는 공개이고 외부 CDN을 대량으로 긁는 코드가 포함돼 있어 의도적으로 뺐습니다. 되돌려 넣지 마세요. 임시로 `apps/server/scripts/`에 복사해 실행했다면 실행 후 반드시 지우고 `git status`로 확인하세요.
- **운영 DB를 조회할 때는 반드시 읽기 전용 트랜잭션으로 여세요.** 접속 문자열은 `apps/server/.env.prod.local`에 있습니다(gitignore, 권한 600). 참고 구현은 `apps/server/scripts/survey-book-covers.ts`입니다. 직접 연결(`db.<ref>.supabase.co`)은 IPv6 전용이라 쓸 수 없고 Supabase 풀러로 접속합니다. **접속 문자열 자체를 대화나 로그에 남기지 마세요.**
- **`apps/admin`은 초기 세팅만 된 미사용 앱입니다.** 소스 13개에 배포 워크플로도 없습니다. 코드 점검·개선 대상에서 제외하세요.
- 운영 DB는 `synchronize: false`이며 마이그레이션 도구가 없습니다. 엔티티를 바꿨다면 DDL을 수동 적용하고 반드시 [docs/manual-ddl-log.md](docs/manual-ddl-log.md)에 기록하세요.
- 결제 관련 코드는 `FEATURE_PAYMENT_ENABLED` 플래그 뒤에 **꺼져 있습니다.** 플래그는 서버/웹 양쪽 값을 함께 맞춰야 합니다. 지금은 주문·결제가 동작하지 않으므로 개선 우선순위에서 제외하되, **켜기 전에 반드시** `docs/book-data-migration-plan.md` 9-c의 「결제 활성화 전 점검 항목」을 처리하세요(예약/예약취소의 활성 주문 검증 누락 등 4건).
- **도서 임베딩을 신규 생성하지 않는 것은 의도된 상태입니다.** 비용과 Supabase 무료 티어 한계 때문에 일괄 생성만 하고 상시 생성은 두지 않았습니다. 결함으로 보고 고치려 들지 마세요.
- **로컬에 Postgres도 docker도 없습니다.** 서버를 띄운 통합 검증이 불가능하고, `derive-ddl.ts`도 운영과 같은 스키마의 로컬 DB가 필요해 현재 실행할 수 없습니다.
- **`packages/core`를 수정하면 웹 테스트 전에 반드시 재빌드하세요.** 웹은 `dist`를 참조합니다: `pnpm build --filter=@bookjeok/core` (힙 부족 시 `NODE_OPTIONS="--max-old-space-size=8192"`).
- 새 환경 변수를 추가하면 `.env.example`과 `turbo.json`의 `globalEnv`에 **둘 다** 등록하세요. `globalEnv`에 빠지면 Turbo 캐시가 값 변경을 감지하지 못합니다.

### 문서 갱신 규칙

기능을 추가·변경했다면 해당 `features/*/README.md`를 같은 커밋에서 함께 갱신하세요. 새 기능 폴더를 만들면 README도 함께 만들고, 루트 README의 문서 인덱스에 링크를 추가합니다.

**루트 `README.md`도 같은 커밋에서 확인하세요.** feature README에는 갱신 규칙이 있는데 루트 README에는 없어서, 2026-09-12 점검 때 루트 README만 몇 달치 낡아 있었습니다. 네이버·알라딘 API를 런타임 의존으로 서술하고(2026-09-08 제거됨), 거래 후기를 단방향이라 적고(양방향임), 결제가 꺼져 있다는 사실이 빠져 있었습니다. **AGENTS.md와 루트 README가 충돌하면 먼저 읽은 쪽을 믿게 되므로** 아래를 건드렸다면 루트 README도 함께 보세요.

- 외부 서비스 의존을 추가·제거했을 때 (「외부 서비스 연동」 표와 환경 변수 표)
- 기능 플래그로 무언가를 켜거나 껐을 때
- 도메인 규칙이 바뀌었을 때 (예: 후기 방향, 거래 상태)
- `docs/`에 문서를 추가·삭제했을 때 (문서 인덱스와 디렉터리 트리)
