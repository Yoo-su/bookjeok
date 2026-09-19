# Frontend Feature: Reading Log (독서 기록 · 독서 라운지)

개인 독서 기록(캘린더·통계·3D 덱)과 공개 피드인 독서 라운지를 담당합니다.

## 1. 폴더 구조

```
reading-log/
├── hooks/
│   ├── use-reading-log-prefetch.ts   # RSC 캐시 prefetch
│   └── use-seasonal-theme.ts         # 계절별 캘린더 테마
├── constants/ui.ts
├── mutations/
├── __tests__/                        # queries · day-details-dialog
└── components/
    ├── calendar-view/
    │   ├── reading-log-calendar/     # 월별 캘린더 본체
    │   ├── reading-log-day-cell/     # 날짜 셀 (완독 표시)
    │   ├── reading-log-controls/     # 월/연 이동, 뷰 전환
    │   └── reading-log-calendar-skeleton/
    ├── deck-view/
    │   └── reading-log-card-deck.tsx # 3D 카드 덱 뷰어
    ├── list-view/
    │   └── reading-log-list-view/
    ├── stats-view/
    │   ├── reading-log-stats/        # 독서 통계
    │   └── reading-timeline/         # 연도별 타임라인
    ├── lounge-feed/                  # 독서 라운지 (/lounge)
    │   ├── lounge-feed-list/
    │   ├── lounge-feed-card/ (+ stories)
    │   ├── lounge-popular-banner/ (+ card, stories)
    │   ├── lounge-active-readers/    # index · reader-row · skeleton
    │   ├── lounge-book-detail-modal/
    │   ├── lounge-home-widget/       # 홈에 얹는 축약 위젯
    │   └── lounge-empty-state/
    └── common/
        ├── reading-log-hero/
        ├── reading-log-form-dialog/  # 기록 작성·수정
        └── day-details-dialog/       # 특정 날짜의 기록 상세
```

## 2. 두 개의 축

이 기능은 성격이 다른 두 화면을 함께 담고 있습니다.

|        | 개인 독서 기록                                     | 독서 라운지              |
| ------ | -------------------------------------------------- | ------------------------ |
| 라우트 | `/my-page/reading-log`                             | `/lounge`                |
| 접근   | 본인만                                             | 공개                     |
| 구성   | calendar-view · list-view · stats-view · deck-view | lounge-feed/\*           |
| 데이터 | `/reading-logs`, `/reading-logs/stats`             | `/reading-logs/lounge/*` |

라운지 공개 여부는 `/reading-logs/settings`로 사용자가 직접 제어합니다.

## 3. 핵심 로직

### 캘린더

`reading-log-calendar`가 월 단위로 기록을 조회해 `reading-log-day-cell`에 배치하고, 셀을 클릭하면 `day-details-dialog`가 그날의 완독 도서·한줄평·감상문을 보여줍니다. 작성·수정은 `reading-log-form-dialog`에서 처리합니다. `use-seasonal-theme`이 월에 따라 배색을 바꿉니다.

### 3D 카드 덱 (`deck-view`)

Framer Motion으로 완독 기록을 카드 덱처럼 넘겨보는 뷰입니다. `/share/deck/[handle]`(`share-deck-view`)로 공유 가능한 공개 페이지가 별도로 존재합니다.

> 모션 부하가 큰 화면이라 `use-prefers-reduced-motion`을 존중하고, 카드 수가 많을 때 렌더 범위를 제한합니다.

### 라운지 피드

- `lounge-feed-list` — 다른 독자들의 최근 기록 무한 스크롤
- `lounge-popular-banner` — 인기 도서 배너
- `lounge-active-readers` — 활동 중인 독자
- `lounge-book-detail-modal` — 피드에서 도서 상세를 페이지 이동 없이 확인
- `lounge-home-widget` — 홈에서 라운지를 미리 보여주는 축약본

라운지 페이지는 ISR로 정적 서빙되며, 라우트의 `ServerQueryBoundary`가 RSC 단계에서 공개 쿼리 캐시를 채웁니다.

## 4. 관련

- 서버: [`features/reading-log`](../../../../server/src/features/reading-log/README.md) (`reading-log.controller` + `lounge.controller`)
- 뷰: `reading-log-view`, `lounge-view`, `share-deck-view`

### 라운지 검색 노출 (2026-09-19)

- 라운지 페이지 RSC가 인기 도서·활성 독자와 함께 `readingLog.loungeFeed`의 첫 페이지를 시딩합니다. 최신 피드는 필수 쿼리로 지정해 장애 시 빈 HTML이 ISR에 저장되지 않게 합니다.
- 페이지 제목(h1)·설명과 카드 도서명 링크를 제공합니다. 제목 링크는 도서 상세로 이동하고 나머지 카드 클릭은 기존 독자 모달을 엽니다. 다수 링크의 RSC 선요청은 끕니다.
- 한국어·영어 전용 정적 OG 카드를 사용합니다.

- 공개 목록 페이지는 빌드 시 사전 생성을 생략하고 첫 요청부터 ISR을 생성합니다. API 없는 CI에서도 빌드할 수 있고, 운영 조회 실패는 정상 캐시를 빈 목록으로 덮어쓰지 않습니다.
