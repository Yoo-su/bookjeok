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
          {/* 폰 헤더에는 음악 버튼이 없어 여기가 진입점 */}
          <div className="mr-8 flex items-center gap-0.5">
            <HeaderMusicButton />
            <LanguageSwitcher />
          </div>
        </SheetHeader>

        <nav className="flex flex-col gap-6 p-6 overflow-y-auto h-[calc(100dvh-80px)] custom-scrollbar">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {/*
                섹션 레이블은 한글이다. font-mono 스택에는 한글 글리프가 없어
                기기마다 다른 폰트로 대체되고, uppercase는 무효, Latin 소형
                대문자용인 tracking-widest는 한글을 성기게 벌려 놓는다.
                등록된 한글 폰트(나눔고딕)로 고정한다.
              */}
              <h3 className="font-[family-name:var(--font-nanum-gothic)] text-xs font-bold tracking-[0.04em] text-stone-500">
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
                        "flex items-center justify-between py-2 px-3 text-sm transition-colors duration-200 rounded-md",
                        active
                          ? "font-bold text-stone-900"
                          : "text-stone-600 font-medium hover:bg-stone-50 hover:text-stone-900",
                      )}
                    >
                      {/* 활성 표시는 행 배경이 아니라 글자에 그은 형광펜 자국이다.
                          자국이 글자보다 살짝 넓어야 손으로 그은 것처럼 보인다. */}
                      <span
                        className={cn(active && "highlighter-mark -mx-1 px-1")}
                      >
                        {item.label}
                      </span>
                      {/*
                        챕터 인덱스는 값이 바뀌지도, 사람이 받아적지도 않는
                        정적 레이블이다. mono가 할 일이 없고 "코드" 톤만
                        끌고 오므로 드로어의 명조체를 그대로 물려받는다.
                      */}
                      <span
                        className={cn(
                          "text-[11px] tabular-nums select-none",
                          active
                            ? "text-stone-900 font-bold"
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
