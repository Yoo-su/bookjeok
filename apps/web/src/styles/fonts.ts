import { Gaegu, Gowun_Batang, Nanum_Gothic } from "next/font/google";

export const nanum_gothic = Nanum_Gothic({
  weight: ["400", "700", "800"],
  variable: "--font-nanum-gothic",
  display: "swap",
  preload: false,
});

export const gowun_batang = Gowun_Batang({
  weight: ["400", "700"],
  variable: "--font-gowun-batang",
  display: "swap",
  preload: false,
});

/** 독서기록 「독서 키재기」의 손글씨 주석과 말풍선 */
export const gaegu = Gaegu({
  weight: ["400", "700"],
  variable: "--font-gaegu",
  display: "swap",
  preload: false,
});

/**
 * 본문 Pretendard(pretendard.css)에서 거의 모든 페이지가 쓰는 조각. CSS를 다 읽은 뒤에야 받기 시작하지 않게
 * 레이아웃에서 미리 받는다. 91은 영문·숫자·기호, 90·89는 가장 자주 쓰는 한글(그 아래 조각은 글이 적은 페이지에서 안 쓰여 뺐다). 버전 폴더를 바꾸면 함께 바꾼다
 */
export const PRETENDARD_PRELOAD_URLS = [91, 90, 89].map(
  (n) => `/fonts/pretendard/1.3.9/PretendardVariable.subset.${n}.woff2`,
);
