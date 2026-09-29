# Frontend Feature: Feedback (문의·제보)

사용자가 운영자에게 책 요청·버그 제보·기능 제안·기타 문의를 보내는 창, 보낸 문의와 답변을 보는 「나의 문의」, 운영자가 답변을 다는 문의 관리 화면입니다. 서버는 [`features/feedback`](../../../../server/src/features/feedback/README.md)입니다.

## 폴더 구조

```
feedback/
├── stores/use-feedback-dialog-store.ts  # 열림 상태·미리 채울 값(preset)·session
├── hooks/use-open-feedback.ts           # 비로그인이면 로그인으로, 로그인이면 창 열기
├── constants.ts                         # 종류·상태 목록과 번역 키
├── components/
│   ├── feedback-dialog/                 # 문의 창. DefaultLayout에 하나만 붙어 있음 (+ stories)
│   ├── feedback-button/                 # 어디든 둘 수 있는 여는 버튼
│   ├── feedback-status-badge/           # 접수됨·확인 중·반영 완료·반영 안 함
│   ├── my-feedback-list/                # 나의 문의 (views/my-feedback-view, /my-page/feedback)
│   ├── admin-feedback-list/             # 운영자 목록·필터 (views/admin-feedback-view, /admin/feedback)
│   └── admin-feedback-edit-dialog/      # 운영자 처리 창 (상태·답변·메모)
└── __tests__/
```

## 여는 곳

| 위치                               | 미리 채우는 값                   |
| ---------------------------------- | -------------------------------- |
| 푸터 「문의」 칸 「문의·제보하기」 | 없음 (책 요청 탭)                |
| 프로필 메뉴 「문의·제보하기」      | 없음                             |
| 도서 검색 결과 0건 「책 요청하기」 | 종류 = 책 요청, 책 제목 = 검색어 |

새 곳에 붙일 때는 `<FeedbackButton preset={...}>`를 쓰거나, 이미 로그인이 보장된 곳이면 `useFeedbackDialogStore`의 `open(preset)`을 부릅니다.

## 동작

- **비로그인**: 창을 열지 않고 현재 경로(쿼리 포함)를 `saveReturnUrl`로 저장한 뒤 로그인 화면으로 보냅니다. 돌아와서 다시 눌러야 열립니다.
- **종류별 입력**: 책 요청은 제목(필수)·저자·출판사 + 내용(선택), 나머지는 내용(필수). 필수 칸이 비면 「보내기」가 꺼집니다. 서버도 같은 규칙으로 한 번 더 검사합니다.
- **보던 페이지**: 보낼 때 `pathname + search`를 함께 보냅니다. 운영자 메일에 링크로 들어갑니다.
- **새로 열 때마다 비움**: 스토어의 `session`을 폼의 `key`로 써서, 닫았다 다시 열면 쓰던 내용이 남지 않습니다.
- **실패**: 창을 닫지 않고 토스트만 띄웁니다. 쓴 내용을 잃지 않게 하기 위해서입니다. 하루 한도(`FEEDBACK_003`)를 넘긴 경우만 한도를 알리는 문구를 따로 띄웁니다.

## 나의 문의 (`/my-page/feedback`)

마이페이지 메뉴 「나의 문의」로 들어옵니다. 최신순으로 종류·상태·책 정보·내용을 보이고, 운영자 답변이 있으면 「북적의 답변」 칸에, 없으면 "아직 답변 전"을 보입니다. 답변 알림(`FEEDBACK_REPLIED`)을 누르면 이 페이지로 옵니다. 문의를 보내면 이 목록 캐시를 무효화합니다.

## 운영자 문의 관리 (`/admin/feedback`)

- **권한은 서버가 막습니다**(서버 `AdminGuard`). 화면은 웹 `AdminGuard`로 감싸 비로그인은 로그인으로, ADMIN이 아니면 홈으로 보냅니다. `UserProvider`가 `/admin`을 보호 경로로 두어 프로필(`role` 포함)을 새로 받은 뒤에 판단하므로, DB에서 ADMIN으로 바꾼 뒤 새로고침만 하면 됩니다.
- 기본 필터는 「접수됨」입니다. 처리할 것부터 보이게 하기 위해서입니다. 상태·종류 칩으로 거릅니다.
- 카드마다 작성자(프로필 링크), 보던 페이지(새 탭), 기기, 메모, 답변을 보이고 「처리하기」로 처리 창을 엽니다.
- 처리 창은 상태·답변·메모를 한 번에 저장합니다. 답변을 새로 쓰거나 고치면 "저장하면 작성자에게 답변 알림이 가요"를 보입니다. 작성자가 탈퇴했으면 그렇다고 알립니다.
- 프로필 메뉴에 ADMIN에게만 「문의 관리」가 보입니다. `robots.ts`가 `/*/admin`을 막고 페이지는 `noindex`입니다.

### 왜 `apps/admin`이 아니라 웹에 두었나 (2026-09-29)

- `apps/admin`은 배포·도메인·로그인 흐름이 없는 초기 세팅 상태입니다. 문의 처리 하나를 위해 이를 깔 비용이 맞지 않습니다.
- 서버 API·`AdminGuard`·core 타입·react-query 훅은 앱과 무관합니다. 웹에만 있는 것은 `admin-feedback-list`·`admin-feedback-edit-dialog`와 페이지 하나입니다.
- **옮길 시점**: 콘텐츠 관리·ISR 캐시 강제 초기화·악성 콘텐츠 차단 등으로 `apps/admin`을 본격화할 때 함께 옮깁니다. 서버는 그대로 두고 두 컴포넌트를 옮긴 뒤, 웹의 `/admin/feedback` 페이지·웹 `AdminGuard`·프로필 메뉴 링크를 지웁니다.
