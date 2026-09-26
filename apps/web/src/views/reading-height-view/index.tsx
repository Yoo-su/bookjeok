import { useTranslations } from "next-intl";

import {
  StackDemo,
  StackStartLink,
} from "@/features/reading-log/components/stack-view/stack-demo";

export const READING_HEIGHT_STEPS = ["record", "thickness", "compare"] as const;
export const READING_HEIGHT_FEATURES = [
  "authors",
  "share",
  "toast",
  "profile",
] as const;
export const READING_HEIGHT_FAQ = [
  "thickness",
  "privacy",
  "authors",
  "years",
  "price",
] as const;

/** 독서 키재기 공개 소개. 글은 서버에서 그려 검색엔진이 읽고, 무대만 브라우저에서 움직인다 */
export function ReadingHeightView() {
  const t = useTranslations("reading_height_page");

  return (
    <article className="mx-auto grid max-w-3xl gap-12 py-6 sm:py-10">
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
        <StackDemo />
        <p className="text-[13px] text-stone-500">{t("demo_hint")}</p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <StackStartLink>{t("cta")}</StackStartLink>
          <span className="text-[13px] text-stone-500">{t("cta_note")}</span>
        </div>
      </section>

      <section className="grid gap-5">
        <h2 className="font-serif text-2xl font-semibold text-stone-900">
          {t("steps_title")}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {READING_HEIGHT_STEPS.map((key, i) => (
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
                {t(`steps.${key}.body`)}
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
          {READING_HEIGHT_FEATURES.map((key) => (
            <li
              key={key}
              className="grid content-start gap-1.5 rounded-2xl bg-stone-50 p-5"
            >
              <h3 className="text-[15px] font-semibold text-stone-900">
                {t(`features.${key}.title`)}
              </h3>
              <p className="text-[14px] leading-relaxed text-stone-500">
                {t(`features.${key}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-5">
        <h2 className="font-serif text-2xl font-semibold text-stone-900">
          {t("faq_title")}
        </h2>
        <div className="divide-y divide-stone-200 border-y border-stone-200">
          {READING_HEIGHT_FAQ.map((key) => (
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
                {t(`faq.${key}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="grid justify-items-center gap-3 rounded-2xl bg-stone-900 px-6 py-10 text-center">
        <p className="font-serif text-2xl font-semibold text-white">
          {t("lead")}
        </p>
        <StackStartLink>{t("cta")}</StackStartLink>
      </section>
    </article>
  );
}
