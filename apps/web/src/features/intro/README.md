# Frontend Feature: Intro (홈 히어로 인트로)

메인 페이지(`/`) 상단입니다. 지금 홈에 쓰는 것은 `home-heading`(h1)이고, `hero/home-hero`는 홈에서 빠진 채 남아 있습니다(장면 전환형 히어로, 퀄리티·테마 문제로 내림).

보존 중인 `hero/home-hero/logo-scene.tsx`의 심벌도 `BRAND_ASSETS.symbol`(A 자유로운 펜선)로 통일했습니다. 로고 자산 제작·보존 규칙은 [브랜드 안내](../../../../../assets/brand/README.md)를 따릅니다.

## 폴더 구조

```
intro/
├── constants/data.ts               # SCENES 정의
├── types/index.ts
├── components/home-heading/        # 홈 h1 「북적」과 손글씨 부제
└── components/hero/home-hero/
    ├── index.tsx                   # 스크롤 진행도 → 장면 전환 오케스트레이션
    ├── record-scene.tsx            # 독서 기록
    ├── used-scene.tsx              # 중고 거래
    ├── review-scene.tsx            # 리뷰
    ├── logo-scene.tsx              # 브랜드 로고 마무리
    └── scroll-guide.tsx            # 스크롤 유도 인디케이터
```

## 장면 정의

```typescript
export const SCENES = [
  { id: "record", accentClass: "text-stone-900" },
  { id: "used", accentClass: "text-slate-900" },
  { id: "review", accentClass: "text-zinc-900" },
  { id: "logo", accentClass: "text-neogulip-primary" },
] as const;
```

장면을 추가하거나 순서를 바꿀 때는 `SCENES` 배열만 수정하면 되고, 각 `id`에 대응하는 `*-scene.tsx`를 함께 만들면 됩니다.

## 홈 머리글 (`home-heading`)

홈의 h1입니다. 「북적」(고운바탕)과 부제 「책 좋아하는 사람들로 북적이는 곳」(Gaegu 400)만 둡니다. 부제는 이름의 뜻을 풀어 준 문장이고, 손글씨는 옆에서 나오는 작가·독서 키재기·책동산과 같은 글꼴입니다.

- **글꼴을 지정해 둔다**: `font-serif`는 한글 명조 웹폰트가 없어 기기 글꼴로 그려집니다(Windows 바탕, Apple 애플명조, 안드로이드는 고딕일 수 있음). 브랜드 h1이라 고운바탕으로 고정했습니다.

- **브랜드 검색용 h1**: 홈 본문에 "북적"이 글자로 없어서(로고는 SVG) 넣었습니다. 회전·글자 단위 애니메이션을 걸지 마세요. 크롤러가 읽는 서버 HTML에 문장이 그대로 있어야 합니다.
- 기능 링크 줄은 넣었다가 뺐습니다. 바로 아래 출판사 슬라이더와 이어 읽혀 어색했고, 같은 링크가 상단 메뉴·푸터에 있습니다.
- 슬라이더 제목 「출판사별 베스트셀러」는 `sr-only` h2입니다. 보이게 두면 h1과 칩 사이에서 구역을 갈라 머리글이 따로 놀았습니다.

## 작가 인사 (제거됨)

홈 머리글 옆으로 독서 키재기 작가가 가끔 나와 인사하던 `author-greeting`은 2026-10-07에 뺐습니다. 작가 그림을 연필 시안 전신으로 바꾼 뒤 홈에서는 과하다는 판단이었습니다. 코드·문서는 커밋 `da715533`까지의 이력에 있습니다.

## 구현 메모

- 전환은 Framer Motion / GSAP 기반이며 스크롤 진행도를 각 장면의 진입·이탈 애니메이션에 매핑합니다.
- 텍스트는 `next-intl` 번역 키를 사용합니다. 문구를 하드코딩하지 마세요.
- `useReducedMotion`(`shared/hooks/use-prefers-reduced-motion`)을 존중해, 모션 최소화 설정에서는 전환을 단순화합니다.
- 홈 첫 화면이라 LCP에 직접 영향을 줍니다. 이미지 추가 시 우선순위와 포맷을 함께 확인하세요.
