"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useSiteHeaderHeight } from "@/shared/hooks/use-site-header-height";

import { useBookSearchUiStore } from "../../stores/use-book-search-ui-store";
import { BookSearchInput } from "./book-search-input";
import { PopularKeywords } from "./popular-keywords";
import styles from "./search-hero.module.css";

export const BookSearchForm = () => {
  const headerHeight = useSiteHeaderHeight();
  const setHeroSearchHidden = useBookSearchUiStore(
    (state) => state.setHeroSearchHidden,
  );
  const { ref, inView, entry } = useInView({
    initialInView: true,
    threshold: 0,
    rootMargin: `-${Math.ceil(headerHeight)}px 0px 0px 0px`,
  });
  const isHidden =
    !inView && !!entry && entry.boundingClientRect.top < headerHeight;

  useEffect(() => {
    setHeroSearchHidden(isHidden);
  }, [isHidden, setHeroSearchHidden]);

  // 페이지 이탈 시 초기화
  useEffect(() => () => setHeroSearchHidden(false), [setHeroSearchHidden]);

  return (
    <div className={styles.form}>
      <div ref={ref}>
        <BookSearchInput variant="hero" />
      </div>
      <PopularKeywords variant="hero" />
    </div>
  );
};
