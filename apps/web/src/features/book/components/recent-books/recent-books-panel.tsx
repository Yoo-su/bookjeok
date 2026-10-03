"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { DockPanel } from "@/shared/components/ui/dock-panel";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useRecentBookStore } from "../../stores/use-recent-book-store";

interface RecentBooksPanelProps {
  open: boolean;
  onClose: () => void;
}

/** 최근 본 책 패널. 여는 버튼은 하단 dock이 가짐 */
export const RecentBooksPanel = ({ open, onClose }: RecentBooksPanelProps) => {
  const t = useTranslations("book.recent_drawer");
  const recentBooks = useRecentBookStore((state) => state.recentBooks);

  return (
    <DockPanel
      open={open}
      onClose={onClose}
      label={t("title")}
      dismissOnOutsideClick
      desktopClassName="w-[min(32rem,calc(100vw-2rem))]"
      desktopMaxHeight="37.5rem"
      mobileClassName=""
      mobileMaxHeight="85dvh"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <h2 className="shrink-0 px-5 pb-2 pt-1 text-base font-bold text-stone-900 group-data-[layout=card]/dock-panel:pt-4">
          {t("title")}
        </h2>
        <div className="grid min-h-0 grid-cols-3 gap-x-3 gap-y-5 overflow-y-auto px-5 pb-5 pt-2 sm:grid-cols-4">
          {recentBooks.map((book) => (
            <Link
              href={PATHS.BOOK_DETAIL(book.isbn)}
              prefetch={false}
              key={book.isbn}
              onClick={onClose}
              className="group flex flex-col items-center space-y-2 text-center"
            >
              <div className="aspect-3/4 w-full overflow-hidden rounded-lg shadow-md transition-all group-hover:-translate-y-1 group-hover:shadow-xl">
                <Image
                  src={book.image}
                  alt={book.title}
                  width={150}
                  height={200}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="w-full truncate text-xs font-medium text-stone-700 group-hover:text-black">
                {book.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </DockPanel>
  );
};
