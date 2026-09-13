# 🏗️ Frontend Component Architecture Guide

이 문서는 `bookjeok-front` 프로젝트의 컴포넌트 구조 원칙을 정의합니다.
새로운 기능을 개발하거나 리팩토링할 때, 모든 에이전트와 개발자는 이 규칙을 준수해야 합니다.

## 1. 핵심 철학: "Context-Based Grouping" (문맥 기반 그룹화)

우리는 단순히 컴포넌트의 기능(Button, Input)이 아니라, **"어디서, 어떻게 쓰이는가(Context)"**를 기준으로 폴더를 구조화합니다.
기존의 `components` 폴더에 수십 개의 파일이 플랫하게 나열되는 것을 방지하고, 관련된 컴포넌트끼리 강하게 응집되도록 합니다.

### ❌ 피해야 할 패턴 (Flat & Generic)

```
src/features/reading-log/components/
  ├── Calendar.tsx
  ├── CalendarHeader.tsx
  ├── CalendarDay.tsx
  ├── StatsChart.tsx
  ├── StatsList.tsx
  ├── LogItem.tsx
  └── ... (수십 개가 섞여 있음)
```

### ✅ 지향하는 패턴 (Context-Based)

```
src/features/reading-log/components/
  ├── calendar-view/       # "달력 뷰"라는 문맥
  │   ├── reading-log-calendar/
  │   └── calendar-header/
  ├── stats-view/          # "통계 뷰"라는 문맥
  │   ├── reading-log-stats/
  │   └── report-card/
  ├── list-view/           # "리스트 뷰"라는 문맥
  │   └── log-list/
  └── common/              # 해당 기능(Feature) 내에서 공통으로 쓰임
      └── log-input-modal/
```

---

## 2. Directory Structure Rules (폴더 구조 규칙)

`src/features/<feature-name>/components/` 하위는 반드시 **중간 분류(Context Directory)**를 거쳐야 합니다.

### 2.1 Context Directory Naming

- **View/Page 기반**: `list-view`, `detail-view`, `calendar-view`, `dashboard`
- **역할 기반**: `widgets` (작은 독립 UI), `forms` (입력 폼 집합), `charts` (데이터 시각화), `guards` (보안/인증)
- **공통/기타**: `common` (feature 전역 공통), `partials` (조각들)

### 2.2 Component Directory

- 각 컴포넌트는 자신의 폴더를 가집니다 (예: `user-profile/index.tsx`).
- 컴포넌트와 강하게 결합된 하위 컴포넌트, 스타일, 훅은 해당 컴포넌트 폴더 안에 위치시킵니다.

---

## 3. 예시 (Examples)

### Case A: `book-sale` (중고 거래)

- `sale-market/`: 팝니다 장터 메인 UI (필터, 리스트)
- `sale-detail/`: 판매글 상세 페이지 관련
- `sale-form/`: 판매글 등록/수정 폼
- `my-sales/`: 내 판매 내역 관리

### Case B: `chat` (채팅)

- `room/`: 채팅방 내부 (메시지 리스트, 입력창, 헤더)
- `list/`: 채팅 목록
- `widgets/`: 전역 채팅 위젯 (토글 버튼, 작은 창)

### Case C: `auth` (인증)

- `forms/`: 로그인 폼, 회원가입 폼
- `guards/`: `AuthGuard`, `GuestGuard`

---

## 4. 뷰 레이어와의 관계 (Views vs Features)

`src/views/`와 `src/features/`는 역할이 다릅니다.

| 레이어      | 역할                                                                |
| :---------- | :------------------------------------------------------------------ |
| `app/`      | 라우팅, 메타데이터, 데이터 prefetch                                 |
| `views/`    | **페이지 단위 조립** — 어떤 feature 컴포넌트를 어떤 순서로 배치할지 |
| `features/` | 도메인 단위 UI 조각과 상태                                          |
| `shared/`   | 도메인에 속하지 않는 공용 컴포넌트·훅·유틸                          |

### 규칙

- 페이지 하나당 `views/[name]-view/` 하나를 둡니다.
- **view는 여러 feature를 조합할 수 있지만, feature는 view를 import하지 않습니다.**
- feature 간 직접 import는 최소화하고, 공유가 필요하면 `shared/`로 올립니다.
- 데이터 페칭 훅은 feature 안에 두지 않고 `@bookjeok/react-query`를 사용합니다.

```
app/[locale]/(default)/insights/page.tsx
        │
        ▼
views/insights-view/          ← 조립
        │
        ├── features/insights/components/charts/*
        └── shared/components/*
```

---

## 5. 다국어 지원 (I18n Architecture)

`next-intl` 라이브러리를 기반으로 다국어를 지원합니다.

### 5.1 Directory Structure

- **`src/app/[locale]/`**: Next.js App Router의 Dynamic Route를 활용하여 모든 페이지를 `[locale]` 하위로 이동시켰습니다.
- **`src/shared/config/i18n/`**: 라우팅 설정(`routing.ts`) 및 요청 핸들러(`request.ts`)가 위치합니다.
- **`src/shared/i18n/messages/`**: `ko.json`, `en.json` 번역 파일이 위치합니다.

### 5.2 Usage Pattern

- **Component (Server/Client)**:

  ```tsx
  import { useTranslations } from "next-intl";

  const MyComponent = () => {
    const t = useTranslations("my-namespace");
    return <h1>{t("title")}</h1>;
  };
  ```

- **Translation Keys**: 번역 키는 기능(feature) 단위로 그룹화하여 `messages/*.json`에 정의합니다.

---

## 6. 날짜·시간 다루기 (Dates and Times)

시간 값은 **두 종류**이고, 섞으면 하루가 밀립니다. 2026-09-13에 라운지 날짜가
하루 어긋나고 오전에는 미래로 표시되던 사고가 여기서 나왔습니다.

### 6.1 두 종류를 먼저 구분하세요

| 종류                          | 예시                            | 성격                                       |
| ----------------------------- | ------------------------------- | ------------------------------------------ |
| **순간** (instant)            | `createdAt`, `updatedAt`        | 타임라인 위의 한 점. 오프셋(`Z`)이 붙어 옴 |
| **달력 날짜** (calendar date) | `date`, `latestDate`, `pubdate` | `YYYY-MM-DD`. **시각도 타임존도 없음**     |

### 6.2 규칙

- **달력 날짜는 `new Date()`에 직접 넣지 마세요.** `@/shared/utils/format-date`의
  `parseCalendarDate`를 쓰세요. `new Date("2026-01-01")`은 명세상 **UTC 자정**이라,
  UTC보다 뒤진 타임존에서는 **2025-12-31**이 됩니다. 표시·정렬·연도 필터·월별
  그룹이 전부 하루씩 어긋납니다.
- **달력 날짜에 경과 시간을 묻지 마세요.** `formatDistanceToNow`로 세면 "어제"가
  보는 시각에 따라 23~47시간이 되고 반올림돼 "2일 전"이 됩니다. `formatRelativeTime`이
  달력 날짜를 알아서 `differenceInCalendarDays`로 셉니다(오늘 / 어제 / N일 전).
- **순간은 그대로 두세요.** 오프셋이 붙은 ISO 문자열은 `new Date()`가 정확합니다.
  `parseCalendarDate`도 이런 값은 손대지 않고 통과시킵니다.
- `@bookjeok/core`의 `parseSafeISO`는 **순간 전용**입니다. 달력 날짜에 쓰면 UTC
  자정으로 해석됩니다.

### 6.3 서버 쪽 대응

서버는 `date` 컬럼을 애초에 `Date` 객체로 만들지 않습니다. SQL에서
`TO_CHAR(..., 'YYYY-MM-DD')`로 문자열을 굳혀 내보냅니다. 순간을 달력 날짜로
바꿀 때는 `AT TIME ZONE 'Asia/Seoul'`처럼 타임존을 이름으로 적습니다. 자세한
내용은 `apps/server/src/features/reading-log/README.md`를 보세요.
