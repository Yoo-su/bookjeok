import { MAX_MEMO_LENGTH } from "@bookjeok/core";
import { useTranslations } from "next-intl";

import { ReadingLogDemo } from "@/features/reading-log/components/calendar-view/reading-log-demo";
import { ReadingLogStartLink } from "@/features/reading-log/components/common/reading-log-start-link";
import { ArrowRight } from "@/shared/components/icons/iconsax";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils";

export const READING_LOG_STEPS = ["find", "note", "review"] as const;
export const READING_LOG_FEATURES = [
  "stack",
  "list",
  "season",
  "toast",
  "lounge",
] as const;
export const READING_LOG_FAQ = [
  "public",
  "past",
  "reread",
  "memo",
  "price",
] as const;
/** 문구의 {max} 자리 */
export const READING_LOG_COPY_VALUES = { max: MAX_MEMO_LENGTH };

/** 독서 기록 공개 소개. 글은 서버에서 그려 검색엔진이 읽고, 예시 달력만 브라우저에서 움직인다 */
export function ReadingLogIntroView() {
  const t = useTranslations("reading_log_page");

  return (
    <article className="grid gap-12 py-6 sm:py-10">
      <header className="grid gap-3">
        <p className="flex items-center gap-2.5 text-[10.5px] font-bold uppercase tracking-[0.3em] text-stone-500 before:h-px before:w-6 before:bg-current">
          {t("kicker")}
        </p>
        <h1 className="font-serif text-[clamp(34px,7vw,52px)] font-semibold leading-[1.1] tracking-tight text-stone-900">
          {t("title")}
        </h1>
        <p className="max-w-[46ch] text-[17px] leading-relaxed text-stone-600">
          {t("lead")}
        </p>
      </header>

      <section className="grid gap-3">
        <ReadingLogDemo />
        <p className="text-[13px] text-stone-500">{t("demo_hint")}</p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <ReadingLogStartLink view="calendar">{t("cta")}</ReadingLogStartLink>
          <span className="text-[13px] text-stone-500">{t("cta_note")}</span>
        </div>
      </section>

      <section className="grid gap-5">
        <h2 className="font-serif text-2xl font-semibold text-stone-900">
          {t("steps_title")}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {READING_LOG_STEPS.map((key, i) => (
            <li
              key={key}
              className="grid content-start gap-1.5 rounded-2xl border border-stone-200 bg-white p-5"
            >
              <span className="text-[12px] font-bold text-emerald-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[15px] font-semibold text-stone-900">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="text-[14px] leading-relaxed text-stone-500">
                {t(`steps.${key}.body`, READING_LOG_COPY_VALUES)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-5">
        <h2 className="font-serif text-2xl font-semibold text-stone-900">
          {t("features_title")}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {READING_LOG_FEATURES.map((key) => (
            <li
              key={key}
              // 다섯 개라 따로 소개 페이지가 있는 독서 키재기를 한 줄 전체로 둔다
              className={cn(
                "grid content-start gap-1.5 rounded-2xl bg-stone-50 p-5",
                key === "stack" && "sm:col-span-2",
              )}
            >
              <h3 className="text-[15px] font-semibold text-stone-900">
                {t(`features.${key}.title`)}
              </h3>
              <p className="text-[14px] leading-relaxed text-stone-500">
                {t(`features.${key}.body`)}
              </p>
              {key === "stack" && (
                <Link
                  href={PATHS.READING_HEIGHT}
                  className="inline-flex items-center gap-1 justify-self-start py-1.5 text-[14px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  {t("features.stack.link")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-5">
        <h2 className="font-serif text-2xl font-semibold text-stone-900">
          {t("faq_title")}
        </h2>
        <div className="divide-y divide-stone-200 border-y border-stone-200">
          {READING_LOG_FAQ.map((key) => (
            <details key={key} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-stone-900">
                {t(`faq.${key}.q`)}
                <span
                  aria-hidden="true"
                  className="text-stone-400 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pt-2 text-[14px] leading-relaxed text-stone-600">
                {t(`faq.${key}.a`, READING_LOG_COPY_VALUES)}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="grid justify-items-center gap-3 rounded-2xl bg-stone-900 px-6 py-10 text-center">
        <p className="font-serif text-2xl font-semibold text-white">
          {t("lead")}
        </p>
        <ReadingLogStartLink view="calendar">{t("cta")}</ReadingLogStartLink>
      </section>
    </article>
  );
}
