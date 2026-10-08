# Frontend Feature: Intro (홈 히어로 인트로)

메인 페이지(`/`) 상단입니다. 지금 홈에 쓰는 것은 `home-heading`(h1)이고, `hero/home-hero`는 홈에서 빠진 채 남아 있습니다(장면 전환형 히어로, 퀄리티·테마 문제로 내림).

보존 중인 `hero/home-hero/logo-scene.tsx`의 심벌도 `BRAND_ASSETS.symbol`(A 자유로운 펜선)로 통일했습니다. 로고 자산 제작·보존 규칙은 [브랜드 안내](../../../../../assets/brand/README.md)를 따릅니다.

## 폴더 구조

```
intro/
├── constants/data.ts               # SCENES 정의
├── types/index.ts
├── components/home-heading/        # 홈 h1 손글씨 한 줄 + 형광펜(「북적」은 sr-only)
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

홈의 h1입니다. 화면에는 손글씨(Gaegu 400) 한 줄 「책 좋아하는 사람들로 북적이는 곳」만 보이고, 「북적이는」에 형광펜을 한 번 긋습니다. 휴대폰은 「북적이는」 앞에서 두 줄로 끊습니다(메시지의 `<br>`이 `md`부터 숨음).

- **이름은 화면에서 뺀다**: 큰 「북적」(고운바탕)을 두었다가 상단바 로고와 겹쳐 뺐습니다(2026-10-08). 이름은 h1 안 `sr-only`로 남아 서버 HTML에 「북적 — 책 좋아하는…」이 그대로 있습니다. 부제의 「북적이는」이 이름의 뜻을 대신 보여 줍니다.
- **형광펜은 펜 자국 모양**: 큰 글자에 `.highlighter-mark`(직사각형)를 쓰면 칠한 상자로 보여, 끝이 비스듬하고 가장자리가 고르지 않은 SVG 도형(`.home-heading-mark`)을 씁니다. CSS `clip-path`로 왼쪽부터 드러나 JS 없이 서버 HTML만으로 그어집니다.
- **브랜드 검색용 h1**: 홈 본문에 "북적"이 글자로 없어서(로고는 SVG) 넣었습니다. 회전·글자 단위 애니메이션을 걸지 마세요(형광펜은 글자 뒤 별도 SVG라 괜찮음). 크롤러가 읽는 서버 HTML에 문장이 그대로 있어야 합니다.
- 기능 링크 줄은 넣었다가 뺐습니다. 바로 아래 출판사 슬라이더와 이어 읽혀 어색했고, 같은 링크가 상단 메뉴·푸터에 있습니다.
- 슬라이더 제목 「출판사별 베스트셀러」는 `sr-only` h2입니다. 보이게 두면 h1과 칩 사이에서 구역을 갈라 머리글이 따로 놀았습니다.

## 작가 인사 (제거됨)

홈 머리글 옆으로 독서 키재기 작가가 가끔 나와 인사하던 `author-greeting`은 2026-10-07에 뺐습니다. 작가 그림을 연필 시안 전신으로 바꾼 뒤 홈에서는 과하다는 판단이었습니다. 코드·문서는 커밋 `da715533`까지의 이력에 있습니다.

## 구현 메모

- 전환은 Framer Motion / GSAP 기반이며 스크롤 진행도를 각 장면의 진입·이탈 애니메이션에 매핑합니다.
- 텍스트는 `next-intl` 번역 키를 사용합니다. 문구를 하드코딩하지 마세요.
- `useReducedMotion`(`shared/hooks/use-prefers-reduced-motion`)을 존중해, 모션 최소화 설정에서는 전환을 단순화합니다.
- 홈 첫 화면이라 LCP에 직접 영향을 줍니다. 이미지 추가 시 우선순위와 포맷을 함께 확인하세요.
