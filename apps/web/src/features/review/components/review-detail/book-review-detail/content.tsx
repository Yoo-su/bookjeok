"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { ChevronDown } from "@/shared/components/icons/iconsax";
import { ScrollProgress } from "@/shared/components/magicui/scroll-progress";
import {
  READING_TOOLBAR_GAP,
  StickyReadingSurface,
} from "@/shared/components/ui/sticky-reading-surface";
import { useSiteHeaderHeight } from "@/shared/hooks/use-site-header-height";
import { cn } from "@/shared/utils/cn";
import { prepareReviewContent } from "@/shared/utils/sanitize-review-content";

import { useReviewReading } from "./use-review-reading";

export function ReviewDetailContent({
  content,
  preview = false,
}: {
  content: string;
  preview?: boolean;
}) {
  const t = useTranslations("common.editor");
  const { html, headings } = useMemo(
    () => prepareReviewContent(content, preview),
    [content, preview],
  );
  const markup = useMemo(() => ({ __html: html }), [html]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const headerHeight = useSiteHeaderHeight();
  const [wide, setWide] = useState(false);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const listId = useId();
  const hasToc = headings.length > 1;
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1536px)");
    const update = () => setWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const offset =
    headerHeight + (hasToc && !wide ? READING_TOOLBAR_GAP + 64 : 20);
  const { activeId, progress, navigate } = useReviewReading(
    bodyRef,
    headings,
    offset,
    !preview,
  );
  const minLevel = Math.min(...headings.map((heading) => heading.level));
  useEffect(() => {
    const nav = desktopNavRef.current;
    const active = nav?.querySelector('[aria-current="location"]');
    if (!nav || !active || !wide) return;
    const bounds = nav.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    const delta =
      item.top < bounds.top
        ? item.top - bounds.top
        : item.bottom > bounds.bottom
          ? item.bottom - bounds.bottom
          : 0;
    if (delta)
      nav.scrollTo({
        top: nav.scrollTop + delta,
        behavior: reduced ? "instant" : "smooth",
      });
  }, [activeId, wide, reduced]);

  const list = (desktop: boolean) => (
    <nav
      ref={desktop ? desktopNavRef : undefined}
      aria-label={t("toc")}
      className="max-h-[min(55dvh,32rem)] overflow-y-auto overscroll-contain py-2"
    >
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          aria-current={activeId === heading.id ? "location" : undefined}
          onClick={(event) => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            setOpen(false);
            navigate(heading.id);
          }}
          className={cn(
            "relative block border-l border-stone-200 py-2 pr-2 text-sm leading-5 break-words transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700",
            activeId === heading.id
              ? "font-medium text-stone-950"
              : "text-stone-500 hover:text-stone-900",
          )}
          style={{
            paddingLeft: 12 + Math.min(heading.level - minLevel, 2) * 12,
          }}
        >
          {activeId === heading.id && (
            <motion.span
              layoutId={`${listId}-${desktop ? "desktop" : "mobile"}`}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className="absolute -left-px top-2 bottom-2 w-0.5 bg-stone-800"
            />
          )}
          {heading.text}
        </a>
      ))}
    </nav>
  );

  return (
    <div className="relative min-w-0">
      {hasToc && preview && (
        <nav
          aria-label={t("toc")}
          className="mb-8 border-y border-stone-200 py-4"
        >
          <p className="mb-2 text-sm font-medium">{t("toc")}</p>
          {headings.map((heading) => (
            <button
              key={heading.id}
              type="button"
              className="block py-1 text-left text-sm text-stone-600 hover:underline"
              style={{
                paddingLeft: Math.min(heading.level - minLevel, 2) * 12,
              }}
              onClick={() =>
                bodyRef.current
                  ?.querySelector(`#${heading.id}`)
                  ?.scrollIntoView({
                    block: "start",
                    behavior: reduced ? "instant" : "smooth",
                  })
              }
            >
              {heading.text}
            </button>
          ))}
        </nav>
      )}
      {!preview && <ScrollProgress progress={progress} className="z-[60]" />}
      {hasToc && !preview && (
        <>
          <StickyReadingSurface
            className="z-30 mb-8 bg-white/95 backdrop-blur 2xl:hidden"
            top={headerHeight + READING_TOOLBAR_GAP}
          >
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => setOpen(!open)}
              className="flex min-h-12 w-full items-center gap-3 border-y border-stone-200 px-2 text-left text-sm focus-visible:outline-2"
            >
              <span className="shrink-0 font-medium">{t("toc")}</span>
              <span className="truncate text-stone-500">
                {headings.find((heading) => heading.id === activeId)?.text ??
                  t("toc_hint")}
              </span>
              <ChevronDown
                className={cn(
                  "ml-auto size-4 shrink-0 transition-transform motion-reduce:transition-none",
                  open && "rotate-180",
                )}
              />
            </button>
            {open && (
              <div
                id={listId}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setOpen(false);
                    toggleRef.current?.focus();
                  }
                }}
                className="absolute inset-x-0 top-full border-b border-stone-200 bg-white px-3 shadow-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1"
              >
                {list(false)}
              </div>
            )}
          </StickyReadingSurface>
          <aside className="absolute bottom-0 left-[calc(100%+24px)] top-0 hidden w-52 2xl:block">
            <div className="sticky" style={{ top: headerHeight + 20 }}>
              <p className="mb-3 text-xs font-medium text-stone-500">
                {t("toc")}
              </p>
              {list(true)}
            </div>
          </aside>
        </>
      )}
      <div
        ref={bodyRef}
        className="prose prose-stone prose-lg md:prose-xl max-w-none break-words prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-sm prose-blockquote:border-l-4 prose-blockquote:border-stone-200 prose-blockquote:bg-stone-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg [&_pre]:max-w-full [&_pre]:overflow-x-auto"
        dangerouslySetInnerHTML={markup}
      />
    </div>
  );
}
