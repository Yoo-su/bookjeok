"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import { type ReviewHeading } from "@/shared/utils/sanitize-review-content";

export function useReviewReading(
  bodyRef: RefObject<HTMLDivElement | null>,
  headings: ReviewHeading[],
  offset: number,
  enabled: boolean,
) {
  const [activeId, setActiveId] = useState("");
  const [progress, setProgress] = useState(0);
  const pending = useRef<{ id: string; until: number } | null>(null);
  useEffect(() => {
    const body = bodyRef.current;
    if (!enabled || !body) return;
    let frame = 0;
    const getElements = () =>
      headings.flatMap(({ id }) => {
        const element = body.querySelector<HTMLElement>(`#${id}`);
        return element ? [element] : [];
      });
    const update = () => {
      frame = 0;
      const elements = getElements();
      const rect = body.getBoundingClientRect();
      const available = window.innerHeight - offset;
      setProgress(
        Math.max(
          0,
          Math.min(
            1,
            (offset - rect.top) / Math.max(1, rect.height - available),
          ),
        ),
      );
      if (pending.current) {
        const target = elements.find(
          (element) => element.id === pending.current?.id,
        );
        if (
          performance.now() < pending.current.until &&
          target &&
          Math.abs(target.getBoundingClientRect().top - offset) > 3
        )
          return;
        pending.current = null;
      }
      let next = "";
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= offset + 4)
          next = element.id;
      }
      if (rect.top <= offset && rect.bottom <= window.innerHeight + 2)
        next = elements.at(-1)?.id ?? "";
      setActiveId(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const cancel = () => {
      pending.current = null;
      schedule();
    };
    const onKey = (event: KeyboardEvent) => {
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        cancel();
    };
    const followHash = () => {
      pending.current = null;
      const target = getElements().find(
        (element) => element.id === window.location.hash.slice(1),
      );
      if (target)
        window.scrollTo({
          top: window.scrollY + target.getBoundingClientRect().top - offset,
          behavior: "instant",
        });
      schedule();
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("scrollend", cancel);
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", followHash);
    window.addEventListener("popstate", followHash);
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", onKey);
    followHash();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("scrollend", cancel);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", followHash);
      window.removeEventListener("popstate", followHash);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", onKey);
    };
  }, [bodyRef, headings, offset, enabled]);
  const navigate = (id: string) => {
    const target = bodyRef.current?.querySelector<HTMLElement>(`#${id}`);
    if (!target) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    pending.current = { id, until: performance.now() + 1600 };
    setActiveId(id);
    if (window.location.hash !== `#${id}`)
      window.history.pushState(window.history.state, "", `#${id}`);
    target.focus({ preventScroll: true });
    window.scrollTo({
      top: window.scrollY + target.getBoundingClientRect().top - offset,
      behavior: reduced ? "instant" : "smooth",
    });
  };
  return { activeId, progress, navigate };
}
