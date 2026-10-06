# 북적 브랜드 자산

2026-10-06부터 기본 심벌은 **A 자유로운 펜선 (`pen-v1`)**이다. B 종이 오리기는 대안으로 보존하며 서비스에서는 사용하지 않는다. 글자 로고는 기존 `BookjeokTextLogo`의 고운바탕·영문 글리프를 그대로 쓴다.

## 원본과 보존

- `pen-v1/source.png`: 사용자가 선택한 A의 원본 투명 PNG(1254×1254). 내장 image_gen으로 만든 시안.
- `pen-v1/symbol.svg`: A의 알파 윤곽과 초록 잎 끝을 경로로 변환한 배포 원본. 래스터를 내장하지 않는 실제 SVG. 먹색 `#20201c`, 초록 `#5c6848`은 승인 이미지의 대표색이다.
- `pen-v1/conversion.json`: 원본/벡터의 알파 윤곽 교집합÷합집합 실측(약 99.27%). 미세한 픽셀 질감은 평면색으로 정리한다.
- `archive/paper-cut/source.png`: B 종이 오리기 원본. 나중에 다시 검토할 자료이며 A의 대체 자산으로 자동 사용하지 않는다.
- `archive/brush/`: 전환 직전 붓 로고 원본·조합·아이콘. 재생성 시 기존 보관본을 덮어쓰지 않는다.
- `generation-prompts.json`: A·B의 생성 프롬프트. 첨부 작품은 스타일 참고로만 사용했으며 작품 파일은 저장소에 포함하지 않는다.

## 배포 파일

실제 사용 경로는 `apps/web/src/shared/constants/brand.ts`의 `BRAND_ASSETS`에 모은다. `apps/web/public/brand/pen-v1/`에는 다음 파일이 있다.

| 파일 | 용도 |
| --- | --- |
| `symbol.svg`, `symbol.png`, `symbol-{256,1024,2048}.png` | 투명 심벌 SVG / 256·512·1024·2048px PNG. 헤더·로딩·오류 화면·시스템 알림·JSON-LD |
| `symbol-light.svg` | 짙은 배경용 밝은 심벌. 현재 흰색 상단바에는 사용하지 않음 |
| `lockup-ko.svg`, `lockup-en.svg` | 기존 글자와 결합한 한·영 전체 로고 |
| `favicon.svg`, `favicon.ico` | 밝고 어두운 브라우저 테마 대응 SVG, 16/32/48px ICO |
| `icon-192.png`, `icon-512.png` | 흰 배경 앱 아이콘 |
| `apple-touch-icon.png` | 흰 배경 180px Apple 아이콘 |
| `icon-maskable-512.png` | 원형·둥근 모서리로 잘라도 심벌이 남는 안전 영역의 앱 아이콘 |
| `social-profile.png`, `social-profile.jpg` | 흰 배경 1080px Instagram·Threads 업로드용. 원형 크롭 안전 여백 |
| `share.png` | 기본 공유 이미지 1200×630 |

`public/og/pen-v1/`에는 한국어·영어 홈/마켓/리뷰/라운지/독서 키재기 카드 10장이 있다. 독서 키재기는 기존 장면 그림을 유지한다. 모든 카드의 글자 로고도 실제 헤더의 글리프로 맞춘다.

## 기존 파일 정리 정책

`public/logo-square-sketch.*`, `logo-og-sketch.png`, `logo-full-*.svg`, `icon-*.png`, `favicon.ico`, `images/logos/logo-full-*.svg`와 기존 `og/*.png` 주소는 **새 A의 호환 사본**이다. public에 옛 붓 그림이나 B를 남기지 않는다. `logo-text-*`는 심벌이 없는 글자 변형이며 삭제하지 않는다. 실제 코드·metadata·카카오 공유·manifest는 버전 경로만 사용한다. 이전 주소를 지우면 예전 링크·저장된 설치 정보가 404가 되므로 주소는 유지한다.

## 재생성

루트에서 순서대로 실행한다. 디자인을 바꿀 때에는 새 버전 폴더를 만들고 `BRAND_ASSETS`와 두 생성 스크립트의 버전을 함께 바꾼다. 이미 배포된 버전 파일을 다른 디자인으로 덮어쓰지 않는다.

```sh
node apps/web/scripts/generate-brand-assets.mjs
node apps/web/scripts/generate-share-images.mjs
node apps/web/scripts/check-brand-assets.mjs
```

처음 래스터 윤곽을 다시 변환해야 할 때만 `node apps/web/scripts/prepare-brand-source.mjs`를 쓴다. 평소에는 SVG 원본에서 파생 파일을 생성한다. 기본 자산 생성은 플랫폼 글꼴에 의존하지 않는다. 공유 카드의 설명 문구는 기존 생성기의 시스템 글꼴을 사용하므로 한글 지원 환경에서 재생성하고 이미지를 직접 확인한다.

## 배포와 SNS

새 버전의 favicon·manifest 아이콘·OG 이미지 URL은 이전 브라우저/공유 이미지 캐시와 구분된다. 기존에 설치된 홈 화면 아이콘과 이미 발행된 SNS 링크의 썸네일은 플랫폼의 갱신 시점에 따라 남을 수 있다. 배포 후 새 페이지 metadata, 이미지 응답, manifest를 다시 확인한다. 배포 전에 운영 화면이 변경되었다고 보고하지 않는다.

Instagram·Threads `bookjeok_books`의 프로필 교체는 사용자 직접 수행으로 확정했다. `public/brand/pen-v1/social-profile.png`를 두 계정에 올리고 원형 미리보기에서 책과 잎을 확인한다. 계정 프로필은 이 저장소 변경만으로 바뀌지 않는다.

## 전환 검증 (2026-10-06)

자산 검사에서 참조 URL 20개, PNG·공유 카드 규격, ICO 16/32/48px 프레임, 이전 주소와 새 파일의 일치, 원형 크롭 안전 영역, B 보존을 확인했다. 변경 코드 ESLint와 관련 테스트 42개(3개 파일)가 통과했다. 실제 Storybook의 A 상단바와 자산 화면도 확인하고 `output/logo-matisse/production-*.jpg`에 캡처했다. 확인 후 Storybook 서버는 종료했다.

웹 전체 타입 검사는 이 작업에서 수정하지 않은 테스트 5개 파일의 기존 오류 6건으로 실패했다(`sitemap`, `feedback-inbox`, `reading-log/mutations`, `reading-height-view`, `reading-log-intro-view`). 전체 빌드·운영 배포 완료를 의미하지 않는다.
