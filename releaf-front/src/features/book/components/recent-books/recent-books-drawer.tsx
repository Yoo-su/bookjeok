"use client";

import { History } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/shadcn/sheet";
import { PATHS } from "@/shared/constants/paths";

import { useRecentBookStore } from "../../stores/use-recent-book-store";

export const RecentBooksDrawer = () => {
  const pathname = usePathname();
  const recentBooks = useRecentBookStore((state) => state.recentBooks);

  const shouldShow =
    pathname === PATHS.HOME || pathname === PATHS.BOOK_SEARCH;

  if (recentBooks.length === 0 || !shouldShow) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95">
          <History className="h-4 w-4" />
          <span>최근 본 책 ({recentBooks.length})</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto rounded-t-2xl">
        <SheetHeader className="text-center">
          <SheetTitle className="text-xl font-bold">최근 본 책</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-x-4 gap-y-6 p-4">
          {recentBooks.map((book) => (
            <Link
              href={`/book/${book.isbn}/detail`}
              key={book.isbn}
              className="group flex flex-col items-center text-center space-y-2"
            >
              <div className="w-full aspect-[3/4] overflow-hidden rounded-lg shadow-md transition-all group-hover:shadow-xl group-hover:-translate-y-1">
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
