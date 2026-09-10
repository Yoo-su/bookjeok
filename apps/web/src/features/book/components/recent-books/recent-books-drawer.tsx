"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { History } from "@/shared/components/icons/iconsax";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/shadcn/sheet";
import { Link, usePathname } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useRecentBookStore } from "../../stores/use-recent-book-store";

export const RecentBooksDrawer = () => {
  const t = useTranslations("book.recent_drawer");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const recentBooks = useRecentBookStore((state) => state.recentBooks);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldShow = pathname === PATHS.HOME;

  if (!mounted || recentBooks.length === 0 || !shouldShow) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-white/90 backdrop-blur-md px-6 py-3 text-sm font-medium text-gray-900 shadow-lg shadow-gray-200/50 border border-gray-200/50 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-gray-200/80 hover:-translate-y-0.5 active:scale-95">
          <History className="h-4 w-4 text-gray-500" />
          <span className="tracking-in-tight">{t("title")}</span>
          <div className="w-px h-3 bg-gray-300 mx-0.5" />
          <span className="text-xs font-semibold text-gray-600 tabular-nums">
            {recentBooks.length}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto rounded-t-2xl">
        <SheetHeader className="text-center">
          <SheetTitle className="text-xl font-bold">{t("title")}</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-x-4 gap-y-6 p-4">
          {recentBooks.map((book) => (
            <Link
              href={PATHS.BOOK_DETAIL(book.isbn)}
              prefetch={false}
              key={book.isbn}
              className="group flex flex-col items-center text-center space-y-2"
            >
              <div className="w-full aspect-3/4 overflow-hidden rounded-lg shadow-md transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                <Image
                  src={book.image}
                  alt={book.title}
                  width={150}
                  height={200}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="w-full truncate text-xs font-medium text-gray-700 group-hover:text-black">
                {book.title}
              </p>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
