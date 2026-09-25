export const READING_LOG_COLORS = {
  // 따뜻한 서재 테마 -> 가을 테마(Autumn)로 통합 예정
  cozy: {
    dark: "#78350f", // amber-900 (텍스트, 강한 강조)
    medium: "#d97706", // amber-600 (포인트, 활성 상태)
    light: "#f59e0b", // amber-500 (보조)
    soft: "#fef3c7", // amber-100 (연한 배경)
    bg: "#fffbeb", // amber-50 (배경)
    text: "#57534e", // stone-600 (본문)
  },
  // 포인트 (Deep Rose)
  point: {
    dark: "#be123c", // rose-700
    medium: "#f43f5e", // rose-500
    light: "#fda4af", // rose-300
  },
  gray: {
    border: "#e7e5e4", // stone-200
    text: "#44403c", // stone-700
    subText: "#a8a29e", // stone-400
    bg: "#fafaf9", // stone-50
  },
} as const;

export const SEASONAL_THEMES = {
  spring: {
    name: "spring",
    label: "Spring Dandelion",
    primary: "text-stone-900",
    bg: "bg-stone-50",
    border: "border-stone-200",
    accent: "text-stone-400",
    ring: "ring-stone-200/50",
    gradient: "from-stone-50 via-white to-stone-50",
    hoverBg: "hover:bg-stone-50/50",
    activeText: "text-stone-900",
    todayBg: "bg-stone-900",
    todayText: "text-white",
  },
  summer: {
    name: "summer",
    label: "Fresh Summer",
    primary: "text-stone-900",
    bg: "bg-stone-50",
    border: "border-stone-200",
    accent: "text-stone-400",
    ring: "ring-stone-200/50",
    gradient: "from-stone-50 via-white to-stone-50",
    hoverBg: "hover:bg-stone-50/50",
    activeText: "text-stone-900",
    todayBg: "bg-stone-900",
    todayText: "text-white",
  },
  autumn: {
    name: "autumn",
    label: "Deep Autumn",
    primary: "text-stone-900",
    bg: "bg-stone-50",
    border: "border-stone-200",
    accent: "text-stone-400",
    ring: "ring-stone-200/50",
    gradient: "from-stone-50 via-white to-stone-50",
    hoverBg: "hover:bg-stone-50/50",
    activeText: "text-stone-900",
    todayBg: "bg-stone-900",
    todayText: "text-white",
  },
  winter: {
    name: "winter",
    label: "Snowy Winter",
    primary: "text-stone-900",
    bg: "bg-stone-50",
    border: "border-stone-200",
    accent: "text-stone-400",
    ring: "ring-stone-200/50",
    gradient: "from-stone-50 via-white to-stone-50",
    hoverBg: "hover:bg-stone-50/50",
    activeText: "text-stone-900",
    todayBg: "bg-stone-900",
    todayText: "text-white",
  },
} as const;

export type SeasonalTheme =
  (typeof SEASONAL_THEMES)[keyof typeof SEASONAL_THEMES];

/** 연도 선택과 책탑 연도 이동의 하한 */
export const READING_LOG_MIN_YEAR = 2020;
