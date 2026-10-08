import fontSubsets from "./font-subsets.json";

/**
 * Google 한글 글꼴은 google-fonts.css에서 직접 서빙한다(next/font/google과 같은 조각·대체 글꼴 보정).
 * 쓰는 쪽이 next/font 객체처럼 `variable`·`className`·`style.fontFamily`를 그대로 쓰게 같은 모양으로 둔다
 */
const localFont = (slug: string, family: string, subset = false) => ({
  variable: `font-${slug}-vars`,
  className: `font-${slug}`,
  style: {
    fontFamily: `${subset ? `"${family} Subset", ` : ""}"${family}", "${family} Fallback"`,
  },
});

export const nanum_gothic = localFont("nanum-gothic", "Nanum Gothic");

export const gowun_batang = localFont("gowun-batang", "Gowun Batang", true);

/** 독서기록 「독서 키재기」의 손글씨 주석과 말풍선 */
export const gaegu = localFont("gaegu", "Gaegu", true);

/** 첫 화면 고정 문구만 담은 글꼴(scripts/fonts/subset.mjs가 만든다). 상단 메뉴용(400만, 700은 현재 메뉴 번호에만 써서 필요할 때 받음)은 레이아웃, 홈 머리글용은 홈에서 미리 받는다 */
export const HEADER_FONT_PRELOAD_URLS = fontSubsets.filter((u) =>
  u.includes("/gowun-batang-400-"),
);
export const HOME_HEADING_FONT_PRELOAD_URLS = fontSubsets.filter((u) =>
  u.includes("/gaegu-"),
);

/**
 * 본문 Pretendard(pretendard.css)에서 거의 모든 페이지가 쓰는 조각. CSS를 다 읽은 뒤에야 받기 시작하지 않게
 * 레이아웃에서 미리 받는다. 91은 영문·숫자·기호, 90·89는 가장 자주 쓰는 한글(그 아래 조각은 글이 적은 페이지에서 안 쓰여 뺐다). 버전 폴더를 바꾸면 함께 바꾼다
 */
export const PRETENDARD_PRELOAD_URLS = [91, 90, 89].map(
  (n) => `/fonts/pretendard/1.3.9/PretendardVariable.subset.${n}.woff2`,
);
