import { useTranslations } from "next-intl";

import { PriceDisplay } from "@/shared/components/ui/price-display";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface BookInfoProps {
  title: string;
  author: string;
  publisher: string;
  price: number;
}

// 도서 상세 정보
export const BookInfo = ({
  title,
  author,
  publisher,
  price,
}: BookInfoProps) => {
  const t = useTranslations("book.detail");
  return (
    <div className="flex flex-col gap-4">
      {/* 카테고리 - 미니멀 텍스트 */}
      <span className="text-xs text-stone-400 uppercase tracking-widest">
        {t("domestic_book")}
      </span>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 leading-tight">
          {title}
        </h1>
        <p className="flex flex-wrap items-center gap-2 mt-3 text-sm text-stone-500">
          <Link
            href={{ pathname: PATHS.BOOK_SEARCH, query: { q: author } }}
            className="border-b border-stone-200 pb-0.5 hover:border-stone-500 hover:text-stone-700 transition-colors"
          >
            {author}
          </Link>
          <span>{t("author_suffix")}</span>
          <span className="text-stone-300">·</span>
          <Link
            href={{ pathname: PATHS.BOOK_SEARCH, query: { q: publisher } }}
            className="border-b border-stone-200 pb-0.5 hover:border-stone-500 hover:text-stone-700 transition-colors"
          >
            {publisher}
          </Link>
        </p>
      </div>

      <div className="mt-1">
        <PriceDisplay value={price} size="xl" />
      </div>
    </div>
  );
};
