"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
import { Loader2, RefreshCcw } from "@/shared/components/icons/iconsax";
import { Link, usePathname } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface AIResponse {
  summary: string;
  keyPoints: string[];
  targetAudience: string;
  keywords: string[];
}

interface BookSummaryProps {
  summary?: AIResponse;
  isLoading: boolean;
  isError: boolean;
  isRequested: boolean;
  onRequestSummary: () => void;
}

export const AISummary = ({
  summary,
  isLoading,
  isError,
  isRequested,
  onRequestSummary,
}: BookSummaryProps) => {
  const t = useTranslations("book.detail.ai_summary");
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && !!user;
  const pathname = usePathname();

  if (!isRequested) {
    return (
      <section className="py-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
            {t("title")}
          </h3>
          <p className="text-xl md:text-2xl font-serif text-gray-900 max-w-2xl leading-relaxed">
            {t("prompt_title")}
          </p>
          <p className="text-sm text-gray-500 max-w-md pb-4">
            {t("prompt_desc")}
          </p>

          {!mounted ? (
            <div className="w-44 h-11 bg-stone-100 rounded-full animate-pulse border border-stone-200/60" />
          ) : isLoggedIn ? (
            <button
              onClick={onRequestSummary}
              className="group relative px-6 py-3 text-sm font-medium text-gray-900 transition-all duration-300 ease-out border border-gray-200 rounded-full hover:border-gray-900 hover:bg-gray-900 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              <span className="relative">{t("button_view")}</span>
            </button>
          ) : (
            <Link
              href={PATHS.LOGIN}
              onClick={() => saveReturnUrl(pathname)}
              className="group relative px-6 py-3 text-sm font-medium text-gray-900 transition-all duration-300 ease-out border border-gray-200 rounded-full hover:border-gray-900 hover:bg-gray-900 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              <span className="relative">{t("button_login")}</span>
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">
            {t("loading_desc")}...
          </p>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-12">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-gray-500">{t("error_desc")}</p>
          <button
            onClick={onRequestSummary}
            className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-900 uppercase hover:underline"
          >
            <RefreshCcw className="w-3 h-3" />
            {t("retry")}
          </button>
        </div>
      </section>
    );
  }

  if (!summary) return null;

  return (
    <section className="py-12 md:py-16 animate-in fade-in duration-700">
      <div className="grid gap-12 lg:grid-cols-[1fr,300px] lg:gap-20">
        {/* Main Content: Summary */}
        <div className="space-y-8">
          <header>
            <h2 className="text-xs font-bold tracking-widest text-emerald-600 uppercase mb-4">
              {t("title")}
            </h2>
            <h3 className="text-2xl md:text-3xl font-serif text-gray-900 leading-tight">
              {t("summary_label")}
            </h3>
          </header>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg leading-relaxed text-gray-600 font-light">
              {summary.summary}
            </p>
          </div>

          <div className="pt-8">
            <h4 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wide">
              {t("key_points_label")}
            </h4>
            <ul className="grid gap-4 sm:grid-cols-2">
              {summary.keyPoints?.map((point, index) => (
                <li key={index} className="flex gap-4 items-baseline">
                  <span className="font-serif text-emerald-500 italic text-lg">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="text-gray-700 leading-relaxed text-sm">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar: Meta Info */}
        <div className="lg:border-l lg:border-gray-100 lg:pl-12 space-y-10 h-fit">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {t("recommendation_label")}
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {summary.targetAudience}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {t("keywords_label")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {summary.keywords?.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-sm bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
