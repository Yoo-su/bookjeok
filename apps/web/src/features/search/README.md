# search — 상단바 통합 검색

헤더에서 언제든 도서·리뷰·중고 판매글을 한 번에 찾는다. 미리보기는 서버 `GET /search/preview`([서버 문서](../../../../server/src/features/search/README.md))를 `@bookjeok/react-query`의 `useSearchPreviewQuery`로 부른다. 계약은 `@bookjeok/core`의 `SearchPreview`. **아직 배포 전**이다(서버·웹 함께 배포해야 함).

## 진입점

- **데스크톱(lg 이상)**: 메뉴 「05 검색」 또는 `/` 키. 가운데 메뉴가 위로 빠지고 그 자리에서 검색창이 양옆으로 펼쳐진다(알약 헤더 안). 결과는 알약 아래 패널.
- **모바일·태블릿**: 헤더 돋보기 → 전체 화면. iOS 키보드가 열리도록 여는 쪽이 `flushSync`로 그린 뒤 같은 탭 이벤트 안에서 포커스한다(`focusGlobalSearchInput`).
- 데스크톱/모바일은 **여는 순간** `matchMedia`로 정한다. `useMediaQuery`는 첫 렌더에 `false`라 일찍 누르면 모바일 화면이 열렸다 바뀐다.

## 동작

| 입력       | 보여 주는 것                                                                         |
| ---------- | ------------------------------------------------------------------------------------ |
| 없음       | 최근 검색어(localStorage `recent-searches`, 8개) · 인기 검색어 6개                   |
| 1글자      | 안내만. 미리보기를 부르지 않음                                                       |
| 2글자 이상 | 200ms 뒤 `GET /search/preview?q=` → 도서 4 · 리뷰 3 · 중고 3. 0건 영역은 그리지 않음 |

- Enter: 고른 줄로 이동, 고른 줄이 없으면 도서 검색(`/book/search?q=`). 빈 입력이면 도서 검색 첫 화면(`/book/search`).
- 헤더 「05」가 검색창으로 바뀌어 도서 검색 페이지로 가는 메뉴가 없다. 그래서 입력 전 패널 맨 아래에 「도서 검색 페이지로」를 둔다. 모바일 메뉴 시트의 「05 도서 검색」은 그대로다.
- ↑↓로 고르기(`aria-activedescendant`), Esc는 닫고 여는 버튼으로 포커스 반환. 바깥을 누르면 포커스를 빼앗지 않고 닫는다.
- 최근·인기 검색어를 누르면 이동하지 않고 검색어만 채운다.
- 맞는 글자에 형광펜 자국(`highlighter-mark`, 애니메이션 끔). 도서에는 리뷰·중고 수를 붙인다.
- 응답이 입력보다 늦으면 직전 결과를 흐리게 남긴다(`keepPreviousData`).

## 남은 일

1. 리뷰 목록이 `?search=`를 URL에서 읽게 한다(`PATHS.REVIEWS_BY_SEARCH`가 아직 안 먹힘).
2. `/book/search`에서는 헤더 검색 대신 히어로 입력창에 포커스(검색창이 세 벌이 되지 않게).
3. 모바일 전체 화면에서 안드로이드 뒤로가기로 닫기.

## 스토리

- `Features/Search/SearchPreviewPanel` — 상태별 패널(입력 전·결과·판매글만·한 글자·0건·로딩·오류·느린 응답)
- `Layouts/DefaultHeader` — `GlobalSearch`(1280), `GlobalSearchTightDesktop`(1024), `GlobalSearchMobile`(375), `GlobalSearchNarrowHeader`(320)

가짜 응답은 `lib/sample-search-preview.ts`의 `installSearchPreviewMock`. 도서는 운영 서지(공개 정보), 리뷰·판매글·닉네임은 지어낸 것이다.
헤더 스토리의 play는 `fireEvent.change`로 값을 넣는다. user-event 입력이 이 입력창의 `onChange`에 반영되지 않았고(원인 미확인) 실제 키보드 입력은 정상이었다.
