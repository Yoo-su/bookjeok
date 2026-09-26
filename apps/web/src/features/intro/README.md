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

- **어디서**: 슬라이더와 같은 폭(`max-w-5xl`)의 좌우 끝에서 나옵니다. 820px은 애니메이션 전 구간에서 몸이 출판사 칩과, 이름이 제목과 겹치지 않는 폭을 재서 정했습니다(칩 약 804px, 이름 약 788px이 한계). 이름은 떠 있는 동안 숙인 머리·흔드는 손과도 15px 이상 떨어지게 몸에서 34px 띄웁니다. 레이어가 슬라이더 폭으로 잘리므로 몸이 경계 너머에 숨어 있다가 옆으로 미끄러져 나옵니다. 다리는 아래로 흐려집니다.
- **동작**: 작가·방향·동작(고개 숙여 인사·손 흔들기·손하트)을 무작위로 고릅니다. 손하트는 위로 뜨는 분홍 하트가 있어야 알아봅니다(손은 15px 안팎).
- **이름**: 캐리커처만으로는 누군지 모르므로, 자리를 잡으면 머리 옆 가운데 쪽에 영문 성이 서명처럼 써졌다가 들어가기 전에 흐려집니다(`Kafka`·`Camus` 등, 22px). 두 언어 모두 영문 그대로이고, 폰트를 받지 않도록 글자를 경로로 바꿔 둡니다.
- **빈도**: 첫 등장 1.5초 뒤, 이후 들어간 지 3~6초마다 횟수 제한 없이 나옵니다. 화면 폭 820px 미만·동작 줄이기·탭이 안 보일 때·머리글이 화면 밖일 때·다른 창(소개 모달 등)이 떠 있을 때는 건너뜁니다.
- **로딩**: 캐릭터 코드는 `next/dynamic`으로 따로 떼어, 넓은 화면이면 마운트 직후 미리 받아 둡니다(첫 등장 때 받기 시작하면 그만큼 늦게 나옴). 홈 첫 화면 번들에는 들어가지 않습니다.
- 시안과 동작 확인은 Storybook `Home/AuthorPeek`(`Autoplay`는 계속 무작위 재생).

## 구현 메모

- 전환은 Framer Motion / GSAP 기반이며 스크롤 진행도를 각 장면의 진입·이탈 애니메이션에 매핑합니다.
- 텍스트는 `next-intl` 번역 키를 사용합니다. 문구를 하드코딩하지 마세요.
- `useReducedMotion`(`shared/hooks/use-prefers-reduced-motion`)을 존중해, 모션 최소화 설정에서는 전환을 단순화합니다.
- 홈 첫 화면이라 LCP에 직접 영향을 줍니다. 이미지 추가 시 우선순위와 포맷을 함께 확인하세요.
