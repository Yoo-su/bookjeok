"use client";

import { useLocale, useTranslations } from "next-intl";

import { Check, Languages } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import { usePathname, useRouter } from "@/shared/config/i18n/routing";
import { cn } from "@/shared/utils/cn";

export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const t = useTranslations("header");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: "ko" | "en") => {
    if (newLocale === locale) return;
    const { search, hash } = window.location;
    router.replace(pathname + search + hash, {
      locale: newLocale,
      scroll: false,
    });
  };

  const languages = [
    { code: "ko", label: "한국어" },
    { code: "en", label: "English" },
  ] as const;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-9 h-9 rounded-full text-stone-500 hover:text-stone-900",
            className,
          )}
          aria-label={t("language_switcher")}
        >
          <Languages className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn("text-sm", locale === lang.code && "font-medium")}
              >
                {lang.label}
              </span>
            </div>
            {locale === lang.code && (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
