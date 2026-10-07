import { cn } from "@/shared/utils/cn";

import type { IconProps } from "./iconsax/_base";

/**
 * 카카오톡 공유 아이콘.
 * 카카오디벨로퍼스 디자인 리소스(카카오톡 공유 · small)의 모양과 색을 그대로 쓴다.
 */
export const KakaoTalkLogo = ({
  className,
  size = 24,
  ...props
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("shrink-0", className)}
    aria-hidden="true"
    {...props}
  >
    <rect width="34" height="34" rx="3" fill="#FAE100" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17 6C23.6273 6 29 10.2383 29 15.4659C29 20.6938 23.6273 24.9315 17 24.9315C16.2635 24.9315 15.5423 24.8785 14.8425 24.7785L9.97748 28.0574C9.91445 28.1071 9.83936 28.1311 9.76416 28.1311C9.67581 28.1311 9.58771 28.0973 9.52082 28.0307C9.42802 27.938 9.39632 27.8023 9.43838 27.6772L10.5694 23.4586C7.22148 21.7792 5 18.8269 5 15.4659C5 10.2383 10.3727 6 17 6Z"
      fill="#3C1E1E"
    />
  </svg>
);
