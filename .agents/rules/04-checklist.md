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

---

## 2. 빌드 및 테스트 검증 커맨드

```bash
# 1. 공용 패키지 빌드 (의존 관계 순서)
#    core 빌드는 기본 힙으로는 OOM으로 죽습니다. NODE_OPTIONS를 반드시 붙이세요.
NODE_OPTIONS="--max-old-space-size=8192" pnpm --filter @bookjeok/core build
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

> 로컬에 운영과 같은 스키마의 Postgres가 없어 **서버를 띄운 통합 검증은 해 본 적이 없습니다.**
> 배포 후 실제 페이지로 확인하세요. (Docker 가용 여부는 머신마다 다릅니다 — `AGENTS.md` 참고)
>
> ```bash
> curl -sL -o /dev/null -w "%{http_code}\n" https://bookjeok.com/ko
> ```

---

## 3. 코드 점검·리팩터링 시

- **모든 지적에 재현 경로나 실측치를 붙이세요.** 근거 없는 심각도 판정은 시간을 낭비시킵니다.
- **성능 수치는 웜/콜드를 구분해 여러 번 재세요.** 콜드 캐시 1회 측정으로 "4.9초 장애"라고
  보고했다가 웜에서 442ms인 것을 확인하고 정정한 전례가 있습니다
  (`docs/book-data-migration-plan.md` 9-c).
- **프론트 캐시를 함께 보세요.** 느린 엔드포인트라도 페이지가 `revalidate`로 ISR 캐시하면
  사용자 체감은 다릅니다.
- **테이블 크기를 확인하고 인덱스를 권하세요.** 수십 행짜리 테이블은 인덱스가 있어도
  Postgres가 Seq Scan을 택합니다.
- 이미 검토하고 기각한 제안은 `docs/book-data-migration-plan.md` 9-c에 근거와 함께
  있습니다. 먼저 확인해 같은 논의를 반복하지 마세요.
