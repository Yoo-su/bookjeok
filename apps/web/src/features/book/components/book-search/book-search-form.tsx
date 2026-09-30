"use client";

import { useInView } from "react-intersection-observer";

import { useSiteHeaderHeight } from "@/shared/hooks/use-site-header-height";

import { BookSearchInput } from "./book-search-input";
import { PopularKeywords } from "./popular-keywords";
import styles from "./search-hero.module.css";
import { StickyBookSearchBar } from "./sticky-book-search-bar";

export const BookSearchForm = () => {
  const headerHeight = useSiteHeaderHeight();
  const { ref, inView, entry } = useInView({
    initialInView: true,
    threshold: 0,
    rootMargin: `-${Math.ceil(headerHeight)}px 0px 0px 0px`,
  });
  const isStickyVisible =
    !inView && !!entry && entry.boundingClientRect.top < headerHeight;

  return (
    <>
      <StickyBookSearchBar isVisible={isStickyVisible} top={headerHeight} />
      <div className={styles.form}>
        <div ref={ref}>
          <BookSearchInput variant="hero" />
        </div>
        <PopularKeywords variant="hero" />
      </div>
    </>
  );
};
