"use client";

import { useEffect, useState } from "react";

export function useSiteHeaderHeight() {
  const [height, setHeight] = useState(80);
  useEffect(() => {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;
    const measure = () => setHeight(header.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return height;
}
