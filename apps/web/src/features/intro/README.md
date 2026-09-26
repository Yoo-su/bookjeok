# Frontend Feature: Intro (홈 히어로 인트로)

메인 페이지(`/`) 상단의 스크롤 연동 히어로 섹션입니다. 서비스의 세 축(독서 기록 · 중고 거래 · 리뷰)을 장면 전환으로 소개하고 마지막에 로고로 수렴합니다.

## 폴더 구조

```
intro/
├── constants/data.ts               # SCENES 정의
├── types/index.ts
├── components/author-greeting/     # 「주목할 만한 도서」 옆 작가 인사 (넓은 화면만)
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

## 작가 인사 (`author-greeting`)

홈 「주목할 만한 도서」 머리글 옆으로 독서 키재기 작가 캐리커처가 가끔 나와 인사합니다. 그림과 동작은 `reading-log/components/stack-view/author-peek`이고, 여기는 언제 띄울지만 정합니다.

- **어디서**: 슬라이더와 같은 폭(`max-w-5xl`)의 좌우 끝에서 나옵니다. 레이어가 슬라이더 폭으로 잘리므로 몸이 경계 너머에 숨어 있다가 옆으로 미끄러져 나옵니다. 다리는 아래로 흐려집니다.
- **동작**: 작가·방향·동작(고개 숙여 인사·손 흔들기·손하트)을 무작위로 고릅니다. 손하트는 위로 뜨는 분홍 하트가 있어야 알아봅니다(손은 15px 안팎).
- **빈도**: 첫 등장 3.5초 뒤, 이후 5~10초마다, 한 방문에 최대 6번(슬라이더를 오래 보지 않으므로 짧게). 화면 폭 1024px 미만·동작 줄이기·탭이 안 보일 때·머리글이 화면 밖일 때·다른 창(소개 모달 등)이 떠 있을 때는 건너뜁니다.
- **로딩**: 캐릭터 코드는 `next/dynamic`으로 첫 등장 때 불러와 홈 첫 화면에 영향이 없습니다.
- 시안과 동작 확인은 Storybook `Home/AuthorPeek`(`Autoplay`는 계속 무작위 재생).

## 구현 메모

- 전환은 Framer Motion / GSAP 기반이며 스크롤 진행도를 각 장면의 진입·이탈 애니메이션에 매핑합니다.
- 텍스트는 `next-intl` 번역 키를 사용합니다. 문구를 하드코딩하지 마세요.
- `useReducedMotion`(`shared/hooks/use-prefers-reduced-motion`)을 존중해, 모션 최소화 설정에서는 전환을 단순화합니다.
- 홈 첫 화면이라 LCP에 직접 영향을 줍니다. 이미지 추가 시 우선순위와 포맷을 함께 확인하세요.
