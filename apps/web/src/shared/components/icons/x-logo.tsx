import { cn } from "@/shared/utils/cn";

import type { IconProps } from "./iconsax/_base";

/**
 * X(구 트위터) 브랜드 로고.
 * iconsax에 브랜드 아이콘이 없어 공식 로고 형태를 직접 둔다.
 */
export const XLogo = ({ className, size = 24, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("shrink-0", className)}
    aria-hidden="true"
    {...props}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);
