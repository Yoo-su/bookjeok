import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/** 「북적이는」에 형광펜을 한 번 긋는다. 서버 HTML만으로 그려지게 CSS로 움직인다 */
const Highlight = (chunks: ReactNode) => (
  <span className="relative isolate whitespace-nowrap">
    <svg
      className="home-heading-mark"
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M 3 6 C 26 5 52 6.4 97 3.4 L 99.5 14.6 C 66 15.2 40 16.4 0.5 17.6 Z" />
    </svg>
    {chunks}
  </span>
);

/** 홈 첫 머리글. 사이트 h1이다. */
export const HomeHeading = () => {
  const t = useTranslations("home.heading");

  return (
    <div className="flex flex-col items-center px-4 pt-10 text-center md:pt-20">
      <h1 className="break-keep font-[family-name:var(--font-gaegu)] text-[clamp(30px,8.4vw,48px)] leading-[1.22] tracking-[-0.01em] [word-spacing:-0.14em] text-stone-800">
        {/* 이름은 상단바 로고가 보여 주므로 화면에서 감추고 검색엔진에만 남긴다 */}
        <span className="sr-only">{t("title")} — </span>
        {t.rich("tagline", {
          mark: Highlight,
          br: () => <br className="md:hidden" />,
        })}
      </h1>
    </div>
  );
};
