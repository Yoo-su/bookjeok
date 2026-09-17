import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
import { HeaderMusicButton } from "@/features/music";
import { Menu } from "@/shared/components/icons/iconsax";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/shadcn/sheet";
import { Link, usePathname } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { LanguageSwitcher } from "../common/language-switcher";
import { Logo } from "../common/logo";

interface NavItem {
  href: string;
  label: string;
  index: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * 모바일 네비게이션 Sheet 컴포넌트
 */
export const MobileNavSheet = () => {
  const t = useTranslations("header.nav");
  const tSheet = useTranslations("sheet.sections");
  const tMusic = useTranslations("music");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentUser = mounted ? user : null;

  const isActive = (path: string) => pathname?.startsWith(path);

  // 네비게이션 섹션 정의 (에디토리얼 챕터 인덱스 포함)
  const navSections: NavSection[] = [
    {
      title: tSheet("book"),
      items: [
        {
          href: PATHS.BOOK_SEARCH,
          label: t("book_search"),
          index: "01",
        },
        {
          href: PATHS.READING_LOG,
          label: t("reading_log"),
          index: "02",
        },
        {
          href: PATHS.LOUNGE,
          label: t("lounge"),
          index: "03",
        },
      ],
    },
    {
      title: tSheet("market"),
      items: [
        {
          href: PATHS.BOOK_MARKET,
          label: t("market_home"),
          index: "04.1",
        },
        {
          href: PATHS.BOOK_SALES_REGISTER,
          label: t("write_sales"),
          index: "04.2",
        },
        {
          href: PATHS.MY_PAGE_SALES,
          label: t("my_sales"),
          index: "04.3",
        },
      ],
    },
    {
      title: tSheet("review"),
      items: [
        {
          href: PATHS.REVIEWS,
          label: t("review_feed"),
          index: "05.1",
        },
        {
          href: PATHS.REVIEW_WRITE,
          label: t("write_review"),
          index: "05.2",
        },
        {
          href: PATHS.MY_REVIEWS,
          label: t("my_reviews"),
          index: "05.3",
        },
      ],
    },
    {
      title: tSheet("stats"),
      items: [
        {
          href: PATHS.INSIGHTS,
          label: t("insights"),
          index: "06",
        },
      ],
    },
  ];

  const handleLinkClick = (href: string) => {
    if (!currentUser) {
      saveReturnUrl(href);
    }
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="lg:hidden p-2 -mr-2 text-stone-600 hover:text-stone-900 transition-colors"
          aria-label={t("menu_open")}
        >
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] p-0 border-r border-stone-100 bg-white font-[family-name:var(--font-gowun-batang)]"
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-stone-50 px-6 py-5">
          <SheetTitle className="flex items-center text-left" asChild>
            <div onClick={() => setOpen(false)}>
              <Logo />
            </div>
          </SheetTitle>
          <LanguageSwitcher className="mr-8" />
        </SheetHeader>

        <nav className="flex flex-col gap-6 p-6 overflow-y-auto h-[calc(100vh-80px)] custom-scrollbar">
          {/*
            배경음악 진입점. 폰 헤더에서는 알약 폭이 모자라 버튼을 숨기므로
            여기가 유일한 진입점이 된다 (재생 중에는 FloatingMusicPill도 뜬다).
          */}
          <div className="flex items-center justify-between rounded-md bg-stone-50/80 px-3 py-2.5">
            <span className="font-mono text-[11px] font-bold tracking-widest text-stone-400 uppercase">
              {tMusic("title")}
            </span>
            <HeaderMusicButton />
          </div>

          {navSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 font-mono">
                {section.title}
              </h3>
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => handleLinkClick(item.href)}
                      className={cn(
                        "flex items-center justify-between py-2 px-3 text-sm transition-all duration-200 rounded-md",
                        active
                          ? "bg-stone-100/80 font-bold text-stone-900 border-l-2 border-stone-900 pl-2.5"
                          : "text-stone-600 font-medium hover:bg-stone-50 hover:text-stone-900",
                      )}
                    >
                      <span>{item.label}</span>
                      <span
                        className={cn(
                          "font-mono text-[10.5px] tabular-nums tracking-wider select-none",
                          active
                            ? "text-stone-900 font-semibold"
                            : "text-stone-400",
                        )}
                      >
                        {item.index}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
