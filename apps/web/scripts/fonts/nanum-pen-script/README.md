# OG 제목용 나눔손글씨 펜

- 출처: [Google Fonts / Nanum Pen Script](https://github.com/google/fonts/tree/main/ofl/nanumpenscript)
- 파일: `NanumPenScript-Regular.ttf` (내부 family 이름 `Nanum Pen`)
- 라이선스: [SIL Open Font License 1.1](OFL.txt)
- 용도: 한글 홈·마켓·리뷰·라운지·독서 키재기 OG 카드의 메인 문구만 적용합니다. 실제 서비스 로고, 설명 문구, 영어 카드는 유지합니다.

글꼴은 이미지 제작용이며 웹 폰트로 배포하거나 페이지에서 다운로드하지 않습니다. 제목은 `scripts/share-titles/`에 SVG 윤곽선으로 저장하므로 PNG 재생성에 손글씨 폰트 설치가 필요하지 않습니다.

제목 문구를 수정할 때는 `generate-share-images.mjs`와 `generate-share-titles.cjs`의 문구를 함께 수정하고, opentype.js 1.3.4로 SVG를 다시 만듭니다. `apps/web`에서 실행합니다:

```sh
node scripts/generate-share-titles.cjs /path/to/opentype.js
node scripts/generate-share-images.mjs
```

opentype.js는 제목 변경 시에만 사용하는 도구이며 앱의 런타임 의존성이 아닙니다. PNG 재생성만 할 때는 두 번째 명령만 실행합니다.
