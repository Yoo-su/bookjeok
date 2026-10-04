"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 사이트 헤더 높이(px). 헤더 아래로 붙이거나 헤더 아래까지만 키울 때 씀
 * - 화면을 옮기면 헤더가 새로 그려지므로 그때마다 지금 헤더를 다시 찾음.
 *   떨어져 나간 옛 헤더는 높이 0을 알려 오는데, 받으면 헤더 뒤로 파고듦(루트에 사는 dock 패널)
 */
export function useSiteHeaderHeight() {
  const pathname = usePathname();
  const [height, setHeight] = useState(80);
  useEffect(() => {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;
    const measure = () => {
      if (header.isConnected) setHeight(header.getBoundingClientRect().height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, [pathname]);
  return height;
}
