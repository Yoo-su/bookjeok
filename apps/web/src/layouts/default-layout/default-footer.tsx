import { useTranslations } from "next-intl";

import { Logo } from "@/layouts/common/logo";
import { Separator } from "@/shared/components/shadcn/separator";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

/** 어항 물결 장식 SVG */
const WaveDecoration = () => (
  <div className="absolute -top-px left-0 right-0 -translate-y-full overflow-hidden leading-0">
    <svg
      viewBox="0 0 1200 80"
      preserveAspectRatio="none"
      className="w-full h-10 md:h-14"
      aria-hidden="true"
    >
      {/* 뒤쪽 물결 (연한 stone) */}
      <path
        d="M0,50 C150,20 350,70 500,40 C650,10 750,60 900,35 C1050,10 1150,50 1200,30 L1200,80 L0,80 Z"
        fill="rgba(214, 211, 209, 0.15)"
      />
      {/* 중간 물결 */}
      <path
        d="M0,55 C200,30 300,65 500,45 C700,25 800,55 1000,40 C1100,32 1150,48 1200,38 L1200,80 L0,80 Z"
        fill="rgba(168, 162, 158, 0.08)"
      />
      {/* 앞쪽 물결 (가장 진한) */}
      <path
        d="M0,60 C100,50 250,68 400,55 C550,42 700,62 850,50 C1000,38 1100,58 1200,48 L1200,80 L0,80 Z"
        fill="rgba(245, 245, 244, 0.6)"
      />
    </svg>
  </div>
);

export const DefaultFooter = () => {
  const t = useTranslations("footer");
  const tNav = useTranslations("header.nav");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full mt-8">
      {/* 어항 물결 장식 */}
      <WaveDecoration />

      {/* 글래스모피즘 배경 */}
      <div
        className="relative backdrop-blur-xl border-t border-white/40"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(245,245,244,0.5) 40%, rgba(231,229,228,0.45) 100%)",
        }}
      >
        {/* 상단 유리 반사 하이라이트 */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.8) 70%, transparent)",
          }}
        />
        {/* 내부 유리 반사 효과 */}
        <div className="absolute inset-0 bg-linear-to-b from-white/30 via-transparent to-transparent pointer-events-none" />

        <div className="relative mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
          <div className="flex flex-col gap-12 md:flex-row md:justify-between">
            {/* 좌측 섹션: 브랜드 & 설명 */}
            <div className="space-y-4 md:max-w-xs">
              <Logo size="sm" />
              <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-line">
                {t("description")}
              </p>
            </div>

            {/* 우측 섹션: 링크 모음 */}
            <div className="grid grid-cols-2 gap-6 sm:gap-0">
              {/* Service Links */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-stone-900">
                  {t("service")}
                </h3>
                <ul className="space-y-1 text-sm text-stone-500">
                  <li>
                    <Link
                      href={PATHS.BOOK_SEARCH}
                      className="inline-block py-1.5 hover:text-stone-800 transition-colors"
                    >
                      {tNav("menu_search")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={PATHS.LOUNGE}
                      className="inline-block py-1.5 hover:text-stone-800 transition-colors"
                    >
                      {tNav("menu_lounge")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={PATHS.READING_HEIGHT}
                      className="inline-block py-1.5 hover:text-stone-800 transition-colors"
                    >
                      {tNav("menu_reading_height")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={PATHS.BOOK_MARKET}
                      className="inline-block py-1.5 hover:text-stone-800 transition-colors"
                    >
                      {tNav("menu_market")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={PATHS.REVIEWS}
                      className="inline-block py-1.5 hover:text-stone-800 transition-colors"
                    >
                      {tNav("menu_reviews")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={PATHS.INSIGHTS}
                      className="inline-block py-1.5 hover:text-stone-800 transition-colors"
                    >
                      {tNav("menu_insights")}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* 연락처 & 소셜 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-stone-900">
                  {t("contact")}
                </h3>
                <ul className="space-y-1 text-sm text-stone-500">
                  <li>rhan0871@naver.com</li>
                  <li>Seoul, Republic of Korea</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-stone-300/30" />

          <div className="flex flex-col items-center justify-between gap-4 text-xs text-stone-400 sm:flex-row">
            <p className="text-stone-500 text-sm">
              &copy; {currentYear} bookjeok. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href={PATHS.TERMS}
                className="inline-block py-1.5 hover:text-stone-600 transition-colors"
              >
                {t("terms")}
              </Link>
              <Link
                href={PATHS.PRIVACY}
                className="inline-block py-1.5 hover:text-stone-600 transition-colors"
              >
                {t("privacy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
