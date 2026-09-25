# Frontend Feature: Reading Log (독서 기록 · 독서 라운지)

개인 독서 기록(캘린더·리스트·책탑·통계)과 공개 피드인 독서 라운지를 담당합니다.

## 1. 폴더 구조

```
reading-log/
├── hooks/
│   ├── use-reading-log-prefetch.ts   # RSC 캐시 prefetch
│   └── use-seasonal-theme.ts         # 계절별 캘린더 테마
├── constants/ui.ts
├── mutations/
├── stores/
│   ├── use-tower-settings-store.ts   # 책탑 키·캐릭터 (기기에만 저장)
│   └── use-reading-log-view-store.ts # 마지막으로 본 보기 (달력·리스트·책탑)
├── __tests__/                        # queries · mutations · day-details-dialog · tower-height-card
└── components/
    ├── calendar-view/
    │   ├── reading-log-calendar/     # 월별 캘린더 본체
    │   ├── reading-log-day-cell/     # 날짜 셀 (완독 표시)
    │   ├── reading-log-controls/     # 월/연 이동, 뷰 전환
    │   └── reading-log-calendar-skeleton/
    ├── tower-view/                   # 책탑
    │   ├── reading-tower/            # 내 책탑 조립 (+ stories, stories-data)
    │   ├── public-reading-tower/     # 공개 프로필 책탑: 캐릭터 없음 (+ stories)
    │   ├── tower-stage/              # 책탑과 캐릭터를 같은 축척으로 그리는 무대 (캐릭터 생략 가능)
    │   ├── tower-height-chip/        # 「내 키」 버튼 → 팝오버로 키 입력 카드
    │   ├── tower-height-card/        # 키 입력·남녀 캐릭터
    │   ├── tower-progress/           # 키까지 진행률·합계
    │   ├── tower-stack-list/         # 쌓인 순서 (월별 지층)
    │   ├── tower-book-dialog/
    │   ├── tower-share-dialog/       # 공유 이미지 (Canvas)
    │   ├── tower-skeleton/           # 코드 분할·데이터 로딩 공용 스켈레톤
    │   ├── hooks/use-tower-copy.ts   # 문구
    │   ├── hooks/use-tower-person.ts # 내 캐릭터·키 (저장값 없으면 프로필 성별·평균 키)
    │   └── lib/                      # 장면 생성·손그림 선·캐릭터·SVG/Canvas 렌더러
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

### 책탑 (`tower-view`)

한 해에 읽은 책을 **실제 두께로** 눕혀 쌓고, 사용자가 입력한 키만 한 손그림 캐릭터를 옆에 세웁니다. 보기 전환의 「책탑」 탭으로 들어오고, **마지막으로 본 보기를 기억**해 다음 방문 때 그대로 엽니다(`use-reading-log-view-store`). 데이터는 `GET /reading-logs/tower?year=`이고, 책 크기는 `book_dimensions`(알라딘 실측 수확본)에서, 없으면 서버가 추정합니다(`sizeSource`).

- **같은 축척**: 무대의 책탑과 캐릭터는 같은 px/mm로 그립니다. 캐릭터는 인체 비율(무릎 28%·허리 60%·어깨 82%)이라 말풍선의 "허리까지 9cm"가 그림과 맞습니다.
- **장면 하나, 렌더러 둘**: `lib/scene.ts`가 도형 목록을 만들고, 화면은 SVG(`scene-svg.tsx`), 공유 이미지는 Canvas(`draw-canvas.ts`)로 같은 목록을 그립니다. 좌표를 px로 굳혀 두 결과가 같습니다.
- **공유**: 입력한 키가 적용된 장면을 1080px 이미지(스토리 9:16·피드 4:5)로 그려, 모바일은 공유 시트, 데스크톱은 파일로 내보냅니다. 공개 링크 페이지는 없습니다. 다이얼로그에도 「내 키」 버튼이 있어 키를 바꾸면 이미지를 다시 그립니다(150ms 모아서).
- **키는 서버에 보내지 않습니다.** `use-tower-settings-store`(localStorage)에만 둡니다. 입력 전에는 평균 키(남 173·여 161cm), 캐릭터는 `users.gender`(`'M' | 'F'`)로 시작합니다. 키 입력은 화면에 늘 펼쳐 두지 않고, 무대 위 「내 키 입력 / 내 키 170cm」 버튼의 팝오버(`tower-height-chip`)에 둡니다.
- **기록하면 알린다**: 기록을 만들면(달력·도서 상세 「읽었어요」) 그해 책탑을 받아 "기록했어요. 책탑이 1.7cm 높아졌어요"와 다음 부위까지 남은 높이(또는 "무릎을 넘었어요!")를 토스트로 띄우고, 올해 기록이면 「책탑 보기」로 보냅니다. 책탑을 못 받으면 평범한 완료 알림입니다(`mutations/index.tsx`).
- **공개 프로필**: `/users/[handle]`의 독서 기록은 캘린더·리스트 대신 `public-reading-tower`입니다. 주인의 키는 기기에만 있으므로 **캐릭터·말풍선·진행률 없이 탑만** 세우고, 축척을 탑 높이에 맞춥니다(최소 40cm). 공유·키 입력은 없고, 연도 이동과 쌓인 순서·책 다이얼로그만 둡니다. 데이터는 `GET /reading-logs/users/:handle/tower?year=`(인증 없음, 비공개면 빈 목록).
- **표지색이 없는 책**(10/30 이후 신간 등)은 `fallbackCoverColor`(core)의 옅은 색으로 칠합니다.
- **책이 많을 때**: 축척이 줄어 한 화면에 들어오고, 쌓는 애니메이션은 권수와 무관하게 약 2초로 묶었습니다. 키를 넘으면 다음 목표를 키의 N배로 올립니다.
- **손글씨 글꼴** Gaegu(`styles/fonts.ts`)는 글자 묶음별로 늦게 받아지므로, 무대가 `document.fonts`의 `loadingdone`마다 다시 재서 말풍선 폭을 맞춥니다.
- **움직임**: 캐릭터 선을 세 벌 번갈아 보여 떨리게 하고(`globals.css`의 `tower-boil`), 동작 줄이기 설정이면 멈춥니다. 보이지 않는 탭에서는 인트로를 건너뜁니다.
- **키가 바뀔 때**: 한 번 바뀌면 380ms 트윈, 슬라이더 드래그처럼 연달아 바뀌면 트윈 없이 바로 따라갑니다. 바뀌는 동안은 캐릭터를 한 벌만 그립니다(세 벌이 장면 생성 비용의 2/3, 300권 기준 3.9ms → 1.7ms). 장면 항목에는 `id`가 있어 React key로 쓰고, 눈금 수가 바뀌어도 책·캐릭터 노드가 밀리지 않습니다.
- **코드 분할**: 캘린더는 `ReadingTower`를, 공개 프로필은 `PublicReadingTower`를 `next/dynamic`으로 불러옵니다. 연도마다 `key`로 새로 마운트합니다.
- **키 입력**: 입력 중에는 유효한 값(80~230)만 반영하고, 오류는 칸을 벗어날 때만 띄웁니다.

> 카드덱 뷰(`deck-view`)와 공유 페이지는 책탑으로 대체하며 지웠습니다(2026-09-25). 옛 링크 `/share/deck/[handle]`은 그 사용자의 공개 프로필로 영구 리다이렉트합니다.

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
- 뷰: `reading-log-view`, `lounge-view`

### 라운지 검색 노출 (2026-09-19)

- 라운지 페이지 RSC가 인기 도서·활성 독자와 함께 `readingLog.loungeFeed`의 첫 페이지를 시딩합니다. 최신 피드는 필수 쿼리로 지정해 장애 시 빈 HTML이 ISR에 저장되지 않게 합니다.
- 페이지 제목(h1)·설명과 카드 도서명 링크를 제공합니다. 제목 링크는 도서 상세로 이동하고 나머지 카드 클릭은 기존 독자 모달을 엽니다. 다수 링크의 RSC 선요청은 끕니다.
- 한국어·영어 전용 정적 OG 카드를 사용합니다.

- 공개 목록 페이지는 빌드 시 사전 생성을 생략하고 첫 요청부터 ISR을 생성합니다. API 없는 CI에서도 빌드할 수 있고, 운영 조회 실패는 정상 캐시를 빈 목록으로 덮어쓰지 않습니다.
