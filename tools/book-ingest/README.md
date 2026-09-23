# book-ingest — 신간 적재 도구

운영자가 필요할 때 로컬에서 돌리는 도구입니다. 고른 출판사의 최신 도서를
카카오 책 검색 API로 훑어 **`books`에 없는 책만** 골라, 표지를 R2에 올린 뒤
`books`에 넣습니다. 서버·웹 코드와는 별개이고 배포하지 않습니다.

배경과 결정 근거는 [계획서 6-d](../../docs/book-data-migration-plan.md)에 있습니다.

## 처리 순서

```
출판사 선택
 → 카카오 조회 (target=publisher, sort=latest, is_end까지·최대 20페이지)
 → 정제 · 제외 규칙
 → books 대조 (ISBN-13·10 모두) → 신규만
 → [적재] 표지 원본 다운로드 → .data/originals 보관 → 가공(7-e 스펙)
        → R2 covers/{isbn}.{webp|jpg} 업로드 → 공개 URL 200 확인
        → INSERT … ON CONFLICT (isbn) DO NOTHING
```

- **R2가 먼저, DB가 나중입니다.** `books.image`에 벤더 URL이나 깨진 링크가 들어가는 순간이 없습니다.
- **이미 있는 R2 키는 덮어쓰지 않고 재사용합니다.** 표지가 `immutable`로 캐시되므로 덮어써도 반영되지 않습니다.
- **`books`에는 SELECT와 INSERT만 합니다.** UPDATE·DELETE·DDL은 없습니다.

## 준비

1. 의존성 설치: 저장소 루트에서 `pnpm install`
2. `packages/core` 빌드(정제 함수를 가져다 씁니다): `pnpm build --filter=@bookjeok/core`
3. `tools/book-ingest/.env.example`을 `.env`로 복사해 채웁니다. 같은 이름이 없으면 루트 `.env`에서 읽습니다.

| 변수                                                      | 용도                                                  | 필요한 명령          |
| --------------------------------------------------------- | ----------------------------------------------------- | -------------------- |
| `KAKAO_REST_API_KEY`                                      | 카카오 책 검색. 로그인용 `KAKAO_CLIENT_ID`와 다릅니다 | scan · apply · serve |
| `INGEST_DATABASE_URL`                                     | 운영 DB(Supabase 풀러)                                | 전부                 |
| `R2_ACCOUNT_ID`·`R2_ACCESS_KEY_ID`·`R2_SECRET_ACCESS_KEY` | 표지 업로드                                           | apply (serve의 적재) |
| `R2_BUCKET`                                               | 기본 `bookjeok-covers`                                |                      |

**자격증명은 권한을 좁혀 발급하세요.** R2 토큰은 `bookjeok-covers` 버킷 한정
Object Read & Write로, DB는 `books`에 SELECT·INSERT만 있는 전용 역할로 만드는 것을
권장합니다. 두 머신(맥·회사 윈도우)에 같은 값을 두게 되기 때문입니다.

서버·웹이 쓰지 않는 값이라 `turbo.json`의 `globalEnv`에는 등록하지 않았습니다.

## 쓰는 법

```bash
# 화면 — 출판사 칩을 고르고 "신간 찾기" → 확인 후 "선택 N권 적재"
pnpm --filter @bookjeok/book-ingest ingest serve

# 찾기만 (쓰기 없음)
pnpm --filter @bookjeok/book-ingest ingest scan --publishers 민음사,창비

# 찾은 신간 전부 적재. --yes 없이는 목록만 보여 주고 멈춥니다
pnpm --filter @bookjeok/book-ingest ingest apply --publishers 민음사 --yes

# 특정 책만
pnpm --filter @bookjeok/book-ingest ingest apply --publishers 민음사 --isbn 9788937477515 --yes
```

화면은 `127.0.0.1:4700`에만 열립니다. 다른 사이트가 브라우저를 통해 적재를
일으키지 못하도록 Host 헤더를 검사하고, 실행마다 새로 만드는 토큰을 요구합니다.

**처음 운영 DB에 돌릴 때는** `scan`으로 결과를 확인하고, `apply --isbn`으로 한 권만
넣어 상세 페이지(`/ko/book/{isbn}/detail`)에서 표지·서지를 확인한 뒤 늘리세요.

## 정제 규칙

| 필드          | 값                                                                                |
| ------------- | --------------------------------------------------------------------------------- |
| `isbn`        | 13자리. DB에 ISBN-10으로만 있는 책도 "보유"로 봅니다                              |
| `title`       | HTML 엔티티만 풉니다. 공백·괄호 정리는 하지 않습니다(검색 쪽 `search_key`가 맡음) |
| `author`      | **저자만, 이름 그대로 `", "`로 연결.** 역자·역할 표기 없음. 비면 빈 문자열        |
| `discount`    | `price`(정가)를 문자열로                                                          |
| `pubDate`     | `datetime` 앞 10자. `Date`로 파싱하지 않습니다(KST 하루 밀림)                     |
| `description` | `contents`. 카카오가 약 250자에서 문장 중간에 자릅니다                            |
| `image`       | `https://cdn.bookjeok.com/covers/{isbn}.{ext}`                                    |
| `salesPoint`  | NULL (0은 "판매 실적 없음"이라는 다른 뜻)                                         |

**제외:** 다른 출판사, 제목 없음, ISBN-13 없음, 잡지(977 ISSN — 호끼리 같은 값을 써서
PK 충돌), 세트, 정가 0 이하, 판매 상태 없음, 원본 표지 URL 없음. **예약판매는 포함합니다.**

표지는 썸네일 URL의 `fname`에 든 `t1.daumcdn.net` 원본을 씁니다(폭 392~458px, 이것이
상한). JPEG는 WebP q85로 바꾸되 PSNR 30dB 미만이거나 오히려 커지면 원본을 그대로
올립니다. WebP 원본은 재인코딩하지 않습니다.

## 산출물 — `.data/` (gitignore)

| 경로                      | 내용                                                                     |
| ------------------------- | ------------------------------------------------------------------------ |
| `runs/{시각}-scan.jsonl`  | 조회한 모든 문서의 판정(신규·보유·제외+사유)과 **카카오 원본 문서 전체** |
| `runs/{시각}-apply.jsonl` | 적재 결과(표지 키·원본 크기·PSNR·재사용 여부)와 카카오 원본              |
| `originals/{isbn}.{ext}`  | 표지 원본. 가공 스펙을 바꾸면 여기서 다시 뽑습니다                       |
| `favorites.json`          | 화면의 즐겨찾기 출판사                                                   |

카카오 원본의 `authors[]`·`translators[]`가 JSONL에 남으므로, 저자 표기 규칙을 바꿀 때
카카오를 다시 부르지 않고 이 파일에서 다시 만들 수 있습니다. 머신마다 따로 쌓입니다.

## 알아둘 것

- **검색 개선 작업의 `search_key` DDL과 동시에 돌리지 마세요.** 그 DDL은 `books`를
  다시 쓰며 테이블 전체를 잠급니다.
- 카카오 약관(저장·캐싱 범위)은 아직 확인하지 않았습니다(계획서 6-d 표의 3번).
- 새로 넣은 책은 임베딩이 없어 AI 추천에 나오지 않고(의도된 상태), 판매지수가 없어
  인기순 뒤쪽에 섭니다. 키워드 검색에는 바로 나옵니다.

## 테스트

```bash
pnpm --filter @bookjeok/book-ingest test       # 정제·스캔·표지 가공·적재 순서·서버 보호
pnpm --filter @bookjeok/book-ingest typecheck
pnpm --filter @bookjeok/book-ingest lint
```

카카오·R2·DB는 테스트에서 가짜로 바꿉니다. 표지 가공 테스트만 `sharp`로 실제 이미지를 만듭니다.
