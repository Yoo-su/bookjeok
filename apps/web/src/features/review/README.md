# Frontend Feature: Review (도서 리뷰)

Tiptap 기반 리뷰 작성·수정·조회와 리액션 UI를 담당합니다.

## 1. 폴더 구조

```
review/
├── schemas.ts                        # Zod 검증 스키마
├── constants/
│   ├── ui.ts
│   └── mutation-keys.ts
├── hooks/
│   ├── use-review-view.ts            # 상세 진입 시 조회수 기록
│   └── use-review-with-auth.ts       # 로그인 필요 액션 게이트 (+ 테스트)
├── mutations/
├── __tests__/                        # mutations · use-review-with-auth
└── components/
    ├── review-write/                 # 작성 진입점
    ├── review-edit/ (+ skeleton)     # 수정 진입점
    ├── review-form/                  # 공용 폼 (RHF + Zod + Tiptap)
    ├── review-viewer/                # 저장된 HTML 안전 렌더링
    ├── review-detail/
    │   ├── book-review-detail/       # header · content · actions
    │   │                             #  · private-overlay · skeleton
    │   ├── recommend-reviews/        # 서버 추천 리뷰
    │   └── related-reviews/          # 같은 도서의 다른 리뷰
    ├── review-list/
    │   ├── review-feed-list/         # 피드형
    │   ├── review-grid-list/         # 그리드형
    │   ├── popular-review-list/ (+ item)
    │   ├── my-review-list/
    │   └── review-home-filters/      # 카테고리 필터 + 활성 태그 칩
    ├── recent-review-list/           # 홈 티커 (index · review-ticker · review-row · skeleton)
    ├── review-home-hero/ (+ hero-images.ts)
    └── common/
        ├── review-card/              # 합성 컴포넌트 (root/parts/context/skeleton/stories)
        └── review-json-ld/           # Review 구조화 데이터
```

## 2. 핵심 로직

### 에디터와 렌더링

작성/수정은 Tiptap 3 에디터(공용 `shared/components/editor`)를 사용하며, 본문은 **HTML 문자열**로 저장합니다. 마크다운이 아닙니다.

```
review-form ──▶ Tiptap ──▶ HTML 문자열 ──▶ POST/PATCH /reviews
                                              │
                                              ▼
ReviewDetailContent ◀── prepareReviewContent ◀── 저장된 HTML
```

렌더링 시 `shared/utils/sanitize-review-content`(내부적으로 `sanitize-html`)로 반드시 정제합니다. **`dangerouslySetInnerHTML`을 정제 없이 직접 호출하지 마세요.**

이미지는 `use-editor-image-handler`(shared hook)가 압축 후 Vercel Blob에 업로드하고, 본문에서 제거된 이미지는 서버의 `ReviewImageHelper`가 정리합니다.

### 읽기 목차와 작성 도구 (2026-09-18)

- 실제 상세 본문은 `review-detail/book-review-detail/content.tsx`에서 정제 HTML을 렌더링합니다. 읽기 화면에 Tiptap 인스턴스를 추가하지 않습니다.
- `prepareReviewContent()`는 같은 정제 과정에서 H1~H6에 결정적 ID(`review-section-N`)를 부여하고 목차를 생성합니다. 빈 제목은 목차에서 제외하고, 중복 제목과 기존 제목 수준은 보존합니다. ID는 저장하지 않으므로 제목 삽입·삭제 후에는 기존 절 링크의 대상이 달라질 수 있습니다.
- 유효한 제목이 두 개 이상일 때 목차를 표시합니다. 1536px 이상은 기존 본문 너비 바깥 오른쪽의 208px 목차, 그 미만은 사이트 헤더 아래 접이식 목차입니다. 목차의 sticky 영역은 본문에서 끝납니다.
- 작성 툴바와 접이식 목차는 `StickyReadingSurface`를 공유합니다. 헤더 아래 12px 간격을 두고, 고정되는 동안에만 위쪽 64px에 1·2·4·8·16px 블러를 서로 다른 그라데이션 마스크로 겹쳐 표시합니다. 흰색 덮임을 낮춰 도구에 가까워질수록 본문이 점진적으로 흐려집니다. 목차 이동 오프셋에도 간격을 반영합니다.
- 진행률 표시는 기존 Magic UI `ScrollProgress`에 본문 진행률을 전달합니다. 기존 그라데이션·스프링을 유지하며, 동작 줄이기 설정에서는 스프링을 생략합니다. 진행률을 전달하지 않는 다른 사용처는 기존처럼 페이지 전체를 추적합니다.
- `use-review-reading`은 본문만 기준으로 진행률과 현재 절을 계산합니다. 클릭 시 헤더 높이를 반영한 smooth scroll, 제목 포커스, 해시 링크·뒤로 가기를 지원하고, 휠·터치·스크롤 키 입력은 자동 이동 중 강조 고정을 해제합니다. 동작 줄이기 설정에서는 즉시 이동합니다. 이미지 로딩·화면 크기 변화 시 위치를 다시 계산합니다.
- 비공개 마스킹 분기에는 본문 컴포넌트를 렌더링하지 않아 목차나 진행률로 내용을 노출하지 않습니다.
- 에디터의 문단 선택은 본문·큰 소제목(H2)·작은 소제목(H3)을 제공합니다. 기존 H1/H4~H6도 손실 없이 편집하고 현재 수준을 표시합니다. 제목 사용은 필수가 아닙니다.
- 툴바는 한국어·영어 설명, 단축키 안내, 실행 취소·다시 실행, 글자 서식 지우기, 링크 입력·검증·해제 팝오버를 제공합니다. 모바일 추가 도구는 더보기로 펼칩니다. 글자 서식 지우기는 문단 종류와 목록을 유지합니다.
- 입력 중 커서가 고정 툴바 뒤나 화면 밖에 있으면 해당 줄만 보이도록 스크롤합니다. `handleScrollToSelection`과 입력 후 프레임에서 위치를 확인하며, 커서·포커스·IME 조합 상태를 변경하지 않습니다. 모바일 visual viewport를 반영하고 보이는 줄에서는 스크롤하지 않습니다.
- 선택 메뉴는 Tiptap BubbleMenu로 위치를 계산하며 굵게·기울임·형광펜·링크를 제공합니다. StarterKit의 Link/Underline은 꺼서 개별 확장과 중복 등록하지 않습니다.
- 작성 폼의 읽기 미리보기는 상세 본문 렌더러를 공유합니다. 미리보기에서만 이미지의 `blob:` URL을 허용해 업로드 전 이미지를 표시하며, 저장된 리뷰의 정제 정책은 유지합니다.
- Storybook `Feature/ReviewReading`에 긴 리뷰, 제목 없는 리뷰, 긴 목차, 작성 화면 사례가 있습니다. 스크롤 회귀·정제·링크 검증은 인접 테스트에서 검증합니다.

### 홈 최신 리뷰 티커 (`recent-review-list`)

20건을 받아 5건만 보여주고 4초마다 맨 위 한 줄을 밀어 올립니다. 구현은 `review-ticker`에 있습니다.

- **뷰포트 높이를 5줄로 잠급니다.** 행을 흐름에서 빼면 컨테이너가 한 줄만큼 줄었다 늘며 아래 광고·푸터까지 들썩입니다. 그래서 한 줄 더 그려 두고 목록 전체를 올린 뒤, 전환이 끝나면 시작 위치를 옮기고 이동량을 0으로 되돌립니다.
- 행 높이는 표지 썸네일이 정하고 `sm`에서 한 번 바뀌므로 실측합니다. 실측 전에는 잘라내기 없이 상위 5건을 그리므로 서버가 구운 HTML과 첫 클라이언트 렌더가 일치합니다.
- **호버·포커스에 멈춥니다.** 포커스까지 보는 것은 키보드로 들어간 사용자가 그 줄과 함께 포커스를 잃기 때문입니다. `prefers-reduced-motion`에서는 회전 자체를 끕니다.
- `review-row`의 링크는 `prefetch={false}`입니다. 20건이 차례로 뷰포트를 통과하므로 기본값이면 클릭 없이 리뷰 상세 20개가 ISR에 구워집니다([캐싱 문서](../../../docs/CACHING.md#목록-링크의-prefetch)).

### 목록 필터 링크 — 태그·도서 (2026-09-21)

리뷰 홈은 `category`·`search` 외에 **`tag`와 `isbn`**을 URL에서 읽습니다. 서버는
`GET /reviews?tag=`(쉼표로 다중)와 `?isbn=`을 처음부터 지원했는데 웹에 호출처가
없어 두 필터 모두 닿지 않는 상태였습니다. 태그는 어디서나 클릭되지 않는 `<span>`
이었고, 도서 상세의 "리뷰 더보기"는 `?isbn=`을 달고도 필터 없는 목록으로 갔습니다.

- 링크는 `PATHS.REVIEWS_BY_TAG(tag)` / `PATHS.REVIEWS_BY_ISBN(isbn)`으로만
  만듭니다. 값에 `&`·공백이 들어와도 파라미터가 쪼개지지 않도록
  `encodeURIComponent`를 여기서 한 번만 겁니다.
- 파라미터는 `review-home-view/with-params`가 읽어 `ReviewGridList`까지
  내려갑니다. 필터가 걸린 빈 목록은 "첫 리뷰 작성"이 아니라 "전체 목록 보기"를
  보여줍니다.
- 활성 필터는 `review-home-filters`의 칩으로 보이고, 칩을 누르면 **그 파라미터만**
  빠지고 나머지는 남습니다(`clearParam`). 전체 해제는 기존 "필터 초기화"입니다.
- 도서 칩은 ISBN 13자리 대신 제목을 보여주려고 `useBookDetailQuery`를 씁니다.
  도서 상세에서 넘어온 경로가 대부분이라 같은 쿼리 키가 이미 캐시에 있습니다.
- **태그를 링크로 만드는 곳은 리뷰 상세(`book-review-detail/header`)와 인사이트의
  인기 태그뿐입니다.** 카드·티커의 태그는 카드 전체가 이미 `<Link>`라 앵커를
  중첩할 수 없어 `<span>`으로 둡니다. 링크가 필요하면 카드 링크 구조부터
  바꿔야 합니다.
- 리뷰 홈의 canonical은 `/ko/book/reviews`이므로 `?tag=`·`?isbn=` URL은 색인되지
  않고 크롤 경로로만 쓰입니다. 태그 전용 색인 페이지는 별도 작업입니다.
- 계약은 `src/__tests__/review-filter-links.test.tsx`가 고정합니다.

### 태그 입력 자동완성 (2026-09-21)

`review-form/tag-input.tsx`가 태그 입력과 기존 태그 제안을 함께 담당합니다. 폼 본체에서
분리한 이유는 디바운스·키보드 탐색·조합 입력 처리가 폼 로직과 섞이면 읽기 어려워서입니다.

**제안은 태그를 합치는 장치가 아니라 새로 지어내는 것을 막는 장치입니다.** 2026-09-21
실측에서 고유 태그 117개 중 99개(85%)가 1회성이었는데, 원인은 표기 흔들림이 아니라
`카뮈`/`알베르카뮈`처럼 뜻이 같은 태그를 매번 새로 만드는 것이었습니다. 이미 저장된 태그는
그대로 둡니다. 합치려면 별칭 테이블과 사람의 판단이 필요하고, 그건 지금 규모에서 할 일이
아닙니다.

- 입력이 멎고 250ms 뒤에 조회합니다. 같은 문자열은 쿼리 키가 같아 캐시에서 바로 나옵니다.
- 추가할 때 `normalizeTagName()`을 겁니다. **서버와 같은 함수**라 중복 판정이 어긋나지
  않습니다.
- 조합 중(`isComposing`)의 Enter는 조합 확정이지 태그 추가가 아닙니다. 한글 입력에서
  이 분기가 없으면 첫 글자만 태그로 들어갑니다.
- 제안 클릭은 `onMouseDown`입니다. `onClick`이면 input의 blur가 먼저 일어나 목록이 닫힙니다.
- 상한은 `REVIEW_TAG_MAX_COUNT`(core) 하나를 폼·zod 스키마·서버 DTO가 함께 봅니다.

**정규화가 소문자화와 내부 공백 제거를 하지 않는 이유**는 표시가 망가지기 때문입니다.
소문자로 내리면 `SF`가 `sf`로 저장되고, 공백을 지우면 `의식의 흐름`·`가즈오 이시구로`가
붙어버립니다. 대소문자 흔들림은 `ILIKE` 제안이 기존 `SF`를 띄워 흡수합니다.

계약은 `__tests__/tag-input.test.tsx`(웹)와 core의 `tag-normalize.test.ts`가 고정합니다.

### 합성 컴포넌트 (`review-card`)

피드·그리드·홈 위젯 등 맥락마다 노출 정보가 달라 Context 기반 합성 컴포넌트로 구성했습니다(`book-sale-item`과 동일한 패턴).

### 인증이 필요한 액션

`use-review-with-auth`가 리액션·작성 등 로그인 필요 동작을 감쌉니다. 비로그인 상태면 로그인으로 유도하고, 복귀 후 원래 위치로 돌아옵니다(`auth/utils/return-url`).

### 비공개 리뷰

`isPublic: false`인 리뷰는 작성자 외에게 `private-overlay`로 가려집니다. 실제 차단은 서버에서 수행하며 오버레이는 표시용입니다.

### 리액션

공감 / 인사이트 / 응원 3종 토글이며 옵티미스틱 업데이트로 카운트를 즉시 반영합니다. 같은 타입을 다시 누르면 해제됩니다.

## 3. SEO

`review-json-ld`가 리뷰 상세에 구조화 데이터를 삽입하고, 리뷰 피드는 `/rss.xml`에도 포함됩니다.

## 4. 관련

- 서버: [`features/review`](../../../../server/src/features/review/README.md), [`features/comment`](../../../../server/src/features/comment/README.md)
- 뷰: `review-home-view`, `review-detail-view`, `review-write-view`, `review-edit-view`, `my-reviews-view`
- 댓글 UI는 [`comment`](../comment/README.md) 기능에 있습니다.

### 검색·공유 (2026-09-19)

- 미선택 별점 0은 JSON-LD에서 생략하고, 평가 척도는 0.5~5로 선언합니다. reviewBody는 공용 HTML 정제 유틸로 텍스트화합니다.
- `utils/share.ts`의 설명 생성기를 OG와 카카오 공유 버튼이 함께 사용합니다. 작성자가 비공개 원문을 조회한 상태에서도 감상 발췌를 공유하지 않습니다.
- 리뷰 피드는 핵심 SSR 쿼리로 지정해 조회 실패 시 빈 HTML을 ISR에 저장하지 않습니다. sitemap은 공개 리뷰 전체를 커서로 순회합니다. 앞자리 0이 있는 상세 URL은 정규 URL로 308 이동합니다.

- 공개 목록 페이지는 빌드 시 사전 생성을 생략하고 첫 요청부터 ISR을 생성합니다. API 없는 CI에서도 빌드할 수 있고, 운영 조회 실패는 정상 캐시를 빈 목록으로 덮어쓰지 않습니다.
