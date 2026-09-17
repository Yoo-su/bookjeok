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
    │   └── review-home-filters/      # 카테고리·정렬 필터
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
review-viewer ◀── sanitize-review-content ◀── 저장된 HTML
```

렌더링 시 `shared/utils/sanitize-review-content`(내부적으로 `sanitize-html`)로 반드시 정제합니다. **`dangerouslySetInnerHTML`을 정제 없이 직접 호출하지 마세요.**

이미지는 `use-editor-image-handler`(shared hook)가 압축 후 Vercel Blob에 업로드하고, 본문에서 제거된 이미지는 서버의 `ReviewImageHelper`가 정리합니다.

### 홈 최신 리뷰 티커 (`recent-review-list`)

20건을 받아 5건만 보여주고 4초마다 맨 위 한 줄을 밀어 올립니다. 구현은 `review-ticker`에 있습니다.

- **뷰포트 높이를 5줄로 잠급니다.** 행을 흐름에서 빼면 컨테이너가 한 줄만큼 줄었다 늘며 아래 광고·푸터까지 들썩입니다. 그래서 한 줄 더 그려 두고 목록 전체를 올린 뒤, 전환이 끝나면 시작 위치를 옮기고 이동량을 0으로 되돌립니다.
- 행 높이는 표지 썸네일이 정하고 `sm`에서 한 번 바뀌므로 실측합니다. 실측 전에는 잘라내기 없이 상위 5건을 그리므로 서버가 구운 HTML과 첫 클라이언트 렌더가 일치합니다.
- **호버·포커스에 멈춥니다.** 포커스까지 보는 것은 키보드로 들어간 사용자가 그 줄과 함께 포커스를 잃기 때문입니다. `prefers-reduced-motion`에서는 회전 자체를 끕니다.
- `review-row`의 링크는 `prefetch={false}`입니다. 20건이 차례로 뷰포트를 통과하므로 기본값이면 클릭 없이 리뷰 상세 20개가 ISR에 구워집니다([캐싱 문서](../../../docs/CACHING.md#목록-링크의-prefetch)).

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
