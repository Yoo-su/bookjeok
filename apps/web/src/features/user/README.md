# Frontend Feature: User (프로필 · 통계 · 위시리스트)

내 프로필 관리, 사용자 통계 대시보드, 위시리스트, 회원 탈퇴를 담당합니다.

## 1. 폴더 구조

```
user/
├── mutations/
├── __tests__/wishlist.test.tsx
└── components/
    ├── profile/
    │   ├── user-profile/             # 공개 프로필 (/users/[handle])
    │   ├── profile-edit-modal/       # 닉네임·핸들·소개·프로필 이미지 수정
    │   ├── withdrawal-modal/         # 회원 탈퇴
    │   └── profile-page-json-ld/     # ProfilePage 구조화 데이터
    ├── dashboard/
    │   └── user-stats-dashboard/ (+ skeleton)
    └── wishlist/
        ├── wishlist-button/          # 도서·판매글에 붙는 담기 토글
        ├── wishlist-list/ (+ skeleton)
        └── wishlist-item/
```

## 2. 핵심 로직

### 프로필 수정

- **닉네임 중복 확인** — `GET /user/check-nickname`으로 저장 전에 검증합니다.
- **핸들(`handle`)** — 공개 프로필 URL(`/users/[handle]`)의 식별자입니다. 폐지된 공유 덱 링크(`/share/deck/[handle]`)는 이 프로필로 리다이렉트하고, 그 사용자의 독서 키재기를 보게 됩니다. **가입 시 자동 생성되며 수정 수단이 없습니다** (`UpdateUserDto`에 필드가 없습니다). 바꿀 수 있게 만든다면 기존 링크가 깨지는 것과 별개로, 이전 핸들 경로의 ISR 캐시도 함께 비워야 합니다([캐싱 문서](../../../docs/CACHING.md#재검증-범위-규칙)).
- **공개 프로필은 1시간 ISR입니다.** 닉네임이 `generateMetadata` 타이틀에도 들어가므로, 저장 후 `revalidateUserProfile`로 서버 캐시까지 비웁니다. 쿼리 무효화만으로는 다른 방문자·크롤러에게 닿지 않습니다.
- **프로필 이미지** — 클라이언트 압축 후 Vercel Blob 업로드. 표시용 URL 정규화는 `shared/utils/profile-image`가 담당합니다.

### 위시리스트

`wishlist-button`은 도서(`BOOK`)와 판매글(`SALE`) 양쪽에서 재사용됩니다. 초기 상태는 `GET /user/wishlist/check`로 채우고, 토글은 옵티미스틱 업데이트 후 서버 응답으로 정합성을 맞춥니다. 비로그인 상태에서는 로그인으로 유도합니다.

### 회원 탈퇴

`withdrawal-modal` → `DELETE /user/me`. 서버는 `user.withdrawn` 이벤트를 발행하고 9개 리스너가 각 도메인 데이터를 정리합니다([shared 문서](../../../../server/src/shared/README.md#회원-탈퇴-캐스케이드)). 되돌릴 수 없으므로 모달에서 명시적으로 재확인합니다.

> 진행 중인 결제 거래나 판매자로서 예약 중인 판매글이 있으면 서버가 탈퇴를 차단합니다. 구매자로 예약된 판매글은 탈퇴와 함께 판매중으로 풀립니다.

탈퇴는 소프트 삭제(`deletedAt`)라 `getPublicProfileByHandle`이 곧바로 404를 던지지만, **ISR에는 직전 200 HTML이 남습니다.** 그래서 홈으로 떠나기 전에 `revalidateUserProfile`을 먼저 기다립니다 — `window.location` 이동은 진행 중인 서버 액션을 끊습니다.

### 통계 대시보드

`GET /user/stats` 기준 완독 수, 리뷰 수, 리액션 등을 표시합니다. 서비스 전체 통계는 [`insights`](../insights/README.md) 기능입니다.

### 신뢰 지표

공개 프로필의 독서 기록은 **캐릭터 없는 독서 키재기**입니다(2026-09-25, 이전에는 PC 캘린더·모바일 리스트). 주인의 키는 그 사람 기기에만 있으므로 쌓은 책만 세우고, 공유·키 입력은 없습니다. 독서 기록이 공개이고 기록이 있을 때만 보이며, 첫 연도는 가장 최근 기록의 연도입니다. 코드는 [`reading-log`](../reading-log/README.md)의 `public-reading-stack`이고 `next/dynamic`으로 불러옵니다. 독서 키재기는 브라우저에서만 그리므로 프로필 HTML에는 읽은 책 제목이 들어가지 않습니다.

공개 프로필에는 [`order`](../order/README.md) 기능의 `seller-stats-card` / `seller-trust-badge`가 함께 노출되어 "거래 완료 N건 · 긍정 후기 N%"를 보여줍니다.

## 3. 관련

- 서버: [`features/user`](../../../../server/src/features/user/README.md), [`features/wishlist`](../../../../server/src/features/wishlist/README.md)
- 뷰: `my-page-view`, `user-profile-view`, `wishlist-view`
- 인증 상태(`useAuthStore`)와 로그인 플로우는 [`auth`](../auth/README.md)에 있습니다.
