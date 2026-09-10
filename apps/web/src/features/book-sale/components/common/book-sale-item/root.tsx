"use client";

import { UsedBookSale } from "@bookjeok/core";
import React, { ReactNode } from "react";

import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { BookSaleContext } from "./context";

interface BookSaleRootProps {
  sale: UsedBookSale;
  children: ReactNode;
  className?: string;
  href?: string;
  rank?: number;
  priority?: boolean;
}

// 중고책 판매 카드 루트
export const Root = ({
  sale,
  children,
  className,
  href,
  rank,
  priority = false,
}: BookSaleRootProps) => {
  const linkHref = href || PATHS.BOOK_SALES_DETAIL(String(sale.id));

  return (
    <BookSaleContext.Provider value={{ sale, rank, priority }}>
      <Link
        href={linkHref}
        prefetch={false}
        passHref
        className={cn("block h-full w-full group", className)}
      >
        <article className="h-full w-full bg-white border border-neutral-200 flex flex-col justify-between overflow-hidden transition-all duration-300 group-hover:border-neutral-400 group-hover:shadow-md">
          {children}
        </article>
      </Link>
    </BookSaleContext.Provider>
  );
};
