# Feedback Module (`features/feedback`)

사용자가 운영자에게 보내는 문의·제보 창구입니다. 책 요청, 버그 제보, 기능 제안·개선, 기타 문의를 받습니다.
**공개 목록은 없습니다.** 작성자는 마이페이지 「나의 문의」에서 자기 문의와 답변을 보고, 운영자는 웹의
`/admin/feedback`(ADMIN만)에서 상태를 바꾸고 답변을 답니다. 답변이 달리면 작성자에게 북적 알림이 갑니다.

```
사용자 ─ POST /feedback ─▶ feedbacks ─ feedback.created ─▶ 운영자 메일
운영자 ─ PATCH /admin/feedback/:id ─▶ feedbacks ─ feedback.replied ─▶ 알림(FEEDBACK_REPLIED) ─▶ 작성자
작성자 ─ GET /feedback/my ─▶ 상태·답변 확인
```

## 1. 주요 파일

- **`controllers/feedback.controller.ts`**: `POST /feedback`, `GET /feedback/my`
- **`controllers/admin-feedback.controller.ts`**: `GET /admin/feedback`, `PATCH /admin/feedback/:id` (JWT + `AdminGuard`)
- **`listeners/feedback-reply-notify.listener.ts`**: `feedback.replied` → 작성자에게 `FEEDBACK_REPLIED` 알림 (행위자 없음)
- **`services/feedback.service.ts`**: 접수(종류별 필수 항목·하루 한도), 목록, 운영자 처리, `feedback.created`·`feedback.replied` 발행
- **`listeners/feedback-notify.listener.ts`**: `feedback.created` → 운영자 메일 (`MailService.send(feedbackNoticeMail, feedback)`)
- **`listeners/feedback-cleanup.listener.ts`**: `user.withdrawn` → 작성자 연결만 끊음 (문의는 남김)
- **`mail/feedback-notice.mail.ts`**: 운영자 수신 정책·입력 타입·제목·본문 정의(공통 서비스는 도메인 엔티티를 참조하지 않음)
- **`entities/feedback.entity.ts`**: `feedbacks` 테이블

## 2. API

| HTTP Method | 경로                  | 설명                                 | 인증      |
| :---------- | :-------------------- | :----------------------------------- | :-------- |
| `POST`      | `/feedback`           | 문의·제보 접수                       | 로그인    |
| `GET`       | `/feedback/my`        | 내 문의 목록 (id 커서, 20건)         | 로그인    |
| `GET`       | `/admin/feedback`     | 전체 문의 (`status`·`type`·`cursor`) | **ADMIN** |
| `PATCH`     | `/admin/feedback/:id` | 상태·답변·메모 변경                  | **ADMIN** |

- **응답은 엔티티가 아니라 core의 `MyFeedback`·`AdminFeedback`입니다.** 작성자에게는 운영자 메모·기기 정보·보던 페이지를 보내지 않고, 운영자 목록에도 작성자 이메일은 넣지 않습니다(닉네임·핸들만).
- **운영자 처리**: `reply`를 새로 쓰거나 바꾸면 `repliedAt`을 찍고 `feedback.replied`를 발행합니다. 같은 답변을 다시 저장하거나 상태·메모만 바꾸면 알림이 가지 않습니다. 빈 문자열은 지우기입니다. 작성자가 탈퇴했으면 알림을 보내지 않습니다.

- 로그인 사용자만 쓸 수 있습니다. 스팸을 막고, 나중에 처리 결과를 알림으로 돌려주기 위해서입니다. 이메일 인증은 요구하지 않습니다.
- 요청 제한: IP당 1분 5회 (`@Throttle`), **사용자당 최근 24시간 10건** (`FEEDBACK_DAILY_LIMIT`, core). 넘으면 429 `FEEDBACK_DAILY_LIMIT_EXCEEDED`. 문의마다 운영자 메일이 나가므로, 한 계정이 폭주시켜 Resend 발송 한도를 소진하면 회원가입 인증 메일까지 막히는 것을 막기 위해서입니다. 세고 저장하는 사이의 동시 요청은 막지 않습니다(폭주 방지가 목적).
- `pagePath`는 `/`로 시작하는 경로만 받습니다. 운영자 메일에서 `CLIENT_DOMAIN` 뒤에 붙여 링크로 쓰므로, `@evil.com` 같은 값이 들어오면 링크가 다른 호스트를 가리키게 됩니다.
- 요청 본문은 `CreateFeedbackParams`(core)입니다. **책 요청은 `bookTitle` 필수·`content` 선택**, 나머지 종류는 `content` 필수입니다. 이 검사는 DTO가 아니라 서비스가 합니다(`FEEDBACK_BOOK_TITLE_REQUIRED`·`FEEDBACK_CONTENT_REQUIRED`). `IsOptional`이 `ValidateIf`를 무력화해 DTO로는 "종류에 따라 필수"를 표현할 수 없기 때문입니다.
- 책 요청이 아니면 책 정보 칸은 버립니다. User-Agent는 요청 헤더에서 서버가 붙이고 300자로 자릅니다.

## 3. 엔티티 `Feedback` (`feedbacks`)

| 컬럼        | 타입          | 설명                                                              |
| :---------- | :------------ | :---------------------------------------------------------------- |
| `id`        | `serial`      | PK (`PK_feedbacks_id`)                                            |
| `userId`    | `int`         | 작성자. 탈퇴하면 null (`FK_feedbacks_userId`, SET NULL)           |
| `type`      | `varchar(20)` | `FeedbackType` — BOOK_REQUEST · BUG · SUGGESTION · OTHER          |
| `content`   | `text`        | 본문. 책 요청은 빈 문자열일 수 있음                               |
| `details`   | `jsonb`       | `bookTitle`·`bookAuthor`·`bookPublisher`·`pagePath`·`userAgent`   |
| `status`    | `varchar(20)` | `FeedbackStatus` — RECEIVED(기본) · IN_PROGRESS · DONE · WONT_FIX |
| `reply`     | `text`        | 작성자에게 보이는 운영자 답변                                     |
| `repliedAt` | `timestamptz` | 답변을 마지막으로 쓴 시각                                         |
| `adminNote` | `text`        | 운영자만 보는 메모                                                |
| `createdAt` | `timestamptz` |                                                                   |
| `updatedAt` | `timestamptz` |                                                                   |

운영 DDL은 [manual-ddl-log.md](../../../../../docs/manual-ddl-log.md) 13절입니다. 알림 enum 값 추가와 운영자 계정 지정도 거기 있습니다. **SQL로 `reply`를 직접 바꾸지 마세요.** 서버를 거치지 않으면 작성자에게 알림이 가지 않습니다.

## 4. 운영자 알림 메일

- 받는 주소는 환경 변수 **`FEEDBACK_NOTIFY_EMAIL`** 입니다. 비어 있으면 메일을 보내지 않고 경고 로그만 남깁니다. 문의는 DB에 그대로 저장됩니다.
- 제목: `[북적 문의] {종류} · {책 제목 또는 본문 앞 40자}`. 본문에 접수 번호, 작성자(닉네임·id·이메일), 책 정보, 보던 페이지 URL, 기기, 내용이 들어갑니다.
- **사용자 입력은 전부 HTML 이스케이프합니다.** 운영자 메일함에 사용자가 쓴 HTML이 그대로 렌더링되지 않게 하기 위해서입니다.
- 전달 결과는 `sent`·`logged`·`skipped`·`failed`로 구분합니다. 수신 주소 미설정은 `skipped`, 공급자 실패는 `failed`이며 공통 모듈에서 기록합니다.
- 메일은 `feedback.created` 이벤트를 `async: true`로 받아 보내므로, 메일이 실패해도 접수 응답에는 영향이 없습니다.

## 5. 운영자 조회

```sql
SELECT f.id, f.type, f.status, f.details->>'bookTitle' AS book, left(f.content, 80) AS content,
       u.nickname, f."createdAt"
  FROM feedbacks f LEFT JOIN users u ON u.id = f."userId"
 WHERE f.status = 'RECEIVED'
 ORDER BY f."createdAt" DESC;
```

## 도메인 이벤트 계약

[`events/feedback.events.ts`](events/feedback.events.ts)가 `FeedbackEvents.created`·`replied`와
payload를 소유합니다(서비스 파일에서 타입을 정의하지 않음). 접수 저장 후 `feedbackId`를,
답변 저장 후 답변이 변경됐고 작성자가 남아 있으면 `feedbackId`·`userId`·`type`·선택 `bookTitle`을
발행합니다. 발행은 `emitDomainEvent`, 메일·답변 알림 구독은 같은 계약의 `@OnDomainEvent`를 씁니다.
두 리스너의 `async: true`·오류 처리·수신 조건은 그대로입니다.

탈퇴 정리 구독은 [user 소유 계약](../user/events/user-withdrawn.event.ts)을 사용합니다.
