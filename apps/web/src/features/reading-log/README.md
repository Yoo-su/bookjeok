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
    │   ├── reading-log-card-deck.tsx # 3D 카드 덱 뷰어
    │   └── share-deck-dialog.tsx     # 공유 전 연간 덱 미리보기
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
        ├── reading-log-form-dialog/  # 기록 작성·수정 (날짜·메모)
        ├── mark-as-read-button/      # 도서 상세의 「읽었어요」
        └── day-details-dialog/       # 특정 날짜의 기록 상세
```

## 2. 두 개의 축

이 기능은 성격이 다른 두 화면을 함께 담고 있습니다.

|        | 개인 독서 기록                         | 독서 라운지              |
| ------ | -------------------------------------- | ------------------------ |
| 라우트 | `/my-page/reading-log`                 | `/lounge`                |
| 접근   | 본인만                                 | 공개                     |
| 구성   | calendar-view · list-view · stats-view | lounge-feed/\*           |
| 데이터 | `/reading-logs`, `/reading-logs/stats` | `/reading-logs/lounge/*` |

라운지 공개 여부는 `/reading-logs/settings`로 사용자가 직접 제어합니다.

## 3. 핵심 로직

### 캘린더

`reading-log-calendar`가 월 단위로 기록을 조회해 `reading-log-day-cell`에 배치하고, 셀을 클릭하면 `day-details-dialog`가 그날의 완독 도서와 한 줄 메모를 보여줍니다. 작성·수정은 `reading-log-form-dialog`에서 처리합니다. `use-seasonal-theme`이 월에 따라 배색을 바꿉니다.

### 기록 진입 경로

- 캘린더 날짜 칸 → `day-details-dialog` → 도서 검색 → 폼. 지난 날짜를 채울 때 씁니다.
- 도서 상세의 `mark-as-read-button` → 폼. 날짜 기본값은 오늘입니다. 비로그인이면 복귀 경로를 저장하고 로그인으로 보냅니다.

폼은 두 경로 모두 날짜를 바꿀 수 있고 미래 날짜는 막습니다. 같은 책·같은 날 중복은 서버가 409(`READING_LOG_002`)로 거절하고, 뮤테이션이 「그날 이미 기록한 책」 안내를 띄운 뒤 폼을 열어 둡니다. 수정에서 날짜를 바꾸면 기록이 다른 달로 옮겨 가므로, 수정 뮤테이션은 모든 월 목록 캐시에서 빼고 새 달에만 넣습니다. 생성·수정 모두 **캐시가 없는 달에는 심지 않습니다.** `[data]`를 심으면 그 달이 한 권짜리로 먼저 그려집니다.

### 3D 카드 덱 (`deck-view`)

Framer Motion으로 완독 기록을 카드 덱처럼 넘겨보는 뷰입니다. 보기 전환(달력·리스트)에는 없고, 히어로의 공유 버튼이 여는 `share-deck-dialog`에서 연간 덱을 미리 봅니다. 공개 페이지는 `/share/deck/[handle]`(`share-deck-view`)입니다.

공개 페이지는 공개 설정된 기록만 보여 주므로, 비공개 사용자에게는 다이얼로그가 링크 복사 대신 공개 전환 안내를 띄웁니다.

> 모션 부하가 큰 화면이라 `use-prefers-reduced-motion`을 존중하고, 카드 수가 많을 때 렌더 범위를 제한합니다.

### 라운지 피드

- 라운지 페이지는 군중 일러스트 아래에 페이지 소개를 두고, 인기 도서 → 활동 중인 독자 → 광고 → 최근 기록 순서로 보여줍니다. 페이지 제목과 섹션 제목의 크기를 달리해 위계를 구분합니다.
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
