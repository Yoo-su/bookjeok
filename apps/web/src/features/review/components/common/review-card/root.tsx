"use client";

import { Review } from "@bookjeok/core";
import React, { ReactNode } from "react";

import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { ReviewCardContext } from "./context";

interface ReviewCardRootProps {
  review: Review;
  children?: ReactNode;
  className?: string;
  href?: string;
  asLink?: boolean;
  priority?: boolean;
}

/**
 * ReviewCard 합성 컴포넌트의 최상위 루트 컨테이너입니다.
 * 하위 요소에 Review 데이터를 공급하며, 전체 카드 레이아웃 스타일을 가지고 있습니다.
 */
export const Root = ({
  review,
  children,
  className,
  href,
  asLink = true,
  priority = false,
}: ReviewCardRootProps) => {
  const linkHref = href || PATHS.REVIEW_DETAIL(review.id);

  const content = (
    <article
      className={cn(
        "flex h-[180px] bg-white overflow-hidden border border-stone-100 hover:shadow-md hover:border-stone-200 transition-all duration-300",
        className,
      )}
    >
      {children}
    </article>
  );

  return (
    <ReviewCardContext.Provider value={{ review, priority }}>
      {asLink ? (
        <Link
          href={linkHref}
          prefetch={false}
          passHref
          className="group block h-full relative"
        >
          {content}
        </Link>
      ) : (
        <div className="group block h-full relative">{content}</div>
      )}
    </ReviewCardContext.Provider>
  );
};
