"use client";

import { useUserProfileQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { saveCurrentReturnUrl } from "@/features/auth/utils/return-url";
import { BookOpen, LogIn, PenLine } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export function LoungeEmptyState() {
  const t = useTranslations("lounge.feed.empty");
  const { data: user } = useUserProfileQuery();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="py-24 flex flex-col items-center text-center max-w-md mx-auto">
      {/* 아이콘 */}
      <div className="w-20 h-20 rounded-full bg-stone-50 flex items-center justify-center mb-8">
        <BookOpen size={36} className="text-stone-300" />
      </div>

      {/* 텍스트 */}
      <h3 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 tracking-tight mb-3">
        {t("title")}
      </h3>
      <p className="text-sm text-stone-500 font-light leading-relaxed mb-10 max-w-sm">
        {t("desc")}
      </p>

      {/* CTA 버튼 */}
      {!mounted ? (
        <div className="w-36 h-12 bg-stone-100 rounded-full animate-pulse border border-stone-200/60" />
      ) : user ? (
        <Link href={PATHS.READING_LOG}>
          <Button className="bg-stone-900 text-white hover:bg-stone-800 h-12 px-8 rounded-full font-medium text-sm transition-all duration-300 hover:shadow-lg">
            <PenLine className="mr-2" size={18} />
            {t("cta_record")}
          </Button>
        </Link>
      ) : (
        <Link href={PATHS.LOGIN} onNavigate={saveCurrentReturnUrl}>
          <Button className="bg-stone-900 text-white hover:bg-stone-800 h-12 px-8 rounded-full font-medium text-sm transition-all duration-300 hover:shadow-lg">
            <LogIn className="mr-2" size={18} />
            {t("cta_login")}
          </Button>
        </Link>
      )}
    </div>
  );
}
