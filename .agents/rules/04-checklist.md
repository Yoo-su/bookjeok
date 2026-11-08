# 04. 핵심 체크리스트 및 빌드 검증

> AI 에이전트 및 개발자가 코드 수정/생성 전후로 반드시 확인해야 하는 체크리스트입니다.

---

## 1. 10대 핵심 체크리스트

1. **API 경로**: `API_PATHS` (core) 사용. 문자열 경로 하드코딩 절대 금지.
2. **라우트 경로**: `PATHS` (web shared constants) 사용. `router.push("/...")` 하드코딩 금지.
3. **에러 처리**: `BusinessException` + `ERROR_CODES` 등록 코드 사용. 직접 `HttpException` 금지.
4. **쿼리 키**: `@lukemorales/query-key-factory` 기반 키 사용. 인라인 문자열 배열 금지.
5. **Directives**: `@bookjeok/react-query`의 모든 훅 파일 최상단에 `"use client";` 선언.
6. **Query/Mutation 분리**: react-query 패키지 내 `queries.ts`와 `mutations.ts` 명확히 분리.
7. **새 모듈 등록**: `apps/server/src/app/app.module.ts`의 imports에 신규 기능 모듈 등록 필수.
8. **index.ts export**: `core`, `api-client`, `react-query`에 새 기능 추가 시 루트 `index.ts`에 export 필수 등록.
9. **서버 Import Alias**: 서버 코드에서는 항상 `@/features/...`, `@/shared/...` 사용 (`../../` 상대경로 지양).
10. **엔티티 타임스탬프**: Date 컬럼에 `@CreateDateColumn({ type: 'timestamptz' })` 사용.

**ESLint가 자동으로 막는 항목** (각 패키지 `eslint.config.mjs`, `pnpm lint`):

- 2번 — 웹의 `router.push/replace/prefetch`와 `href`에 `/`로 시작하는 문자열·템플릿 리터럴 (루트 `"/"`와 `//` 외부 주소는 허용)
- 3번 — 서버에서 Nest 기본 HTTP 예외(`BadRequestException` 등)를 `new`로 직접 생성 (꺼진 결제 가드 1곳만 예외 주석)
- 9번 — 서버의 `../../` 상대 import
- 의존 방향 — core의 `@bookjeok/*` import, api-client의 react-query import, 서버의 api-client·react-query import

나머지 항목(쿼리 키 팩토리, `"use client"`, 모듈·export 등록, timestamptz)은 아직 사람이 확인합니다. react-query의 `"use client"`는 tsup 배너가 빌드 결과 전체에 붙여 런타임 영향이 없어 규칙을 두지 않았습니다.

---

## 2. 빌드 및 테스트 검증 커맨드

```bash
# 1. 공용 패키지 빌드 (의존 관계 순서)
pnpm --filter @bookjeok/core build
pnpm --filter @bookjeok/api-client build
pnpm --filter @bookjeok/react-query build

# 2. 전체 모노레포 빌드 검증
pnpm build

# 3. 린트 검사
pnpm lint

# 4. 전체 단위/통합 테스트 실행
pnpm test
```

> **`packages/core`를 수정했다면 웹 테스트 전에 반드시 1번을 먼저 돌리세요.**
> 웹은 소스가 아니라 `dist`를 참조하므로, 재빌드하지 않으면 옛 코드로 테스트합니다.

---

## 3. 코드 점검·리팩터링 시

- 지적에는 재현 경로나 실측치를 붙입니다.
- 성능은 캐시 유무를 구분해 여러 번 측정합니다.
- 인덱스를 제안하기 전에 테이블 크기와 실행 계획을 확인합니다.
