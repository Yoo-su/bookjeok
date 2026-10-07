import { useTranslations } from "next-intl";

/** 홈 첫 머리글. 사이트 h1이다. */
export const HomeHeading = () => {
  const t = useTranslations("home.heading");

  return (
    <div className="flex flex-col items-center px-4 pt-8 text-center md:pt-20">
      <h1 className="flex flex-col items-center">
        <span className="font-[family-name:var(--font-gowun-batang)] text-5xl tracking-tight text-stone-900 md:text-6xl">
          {t("title")}
        </span>
        <span className="mt-3 font-[family-name:var(--font-gaegu)] text-2xl text-stone-600">
          {t("tagline")}
        </span>
      </h1>
    </div>
  );
};
