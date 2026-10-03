/**
 * lucide-react → iconsax(outline) 매핑 테이블.
 *
 * name    : 생성될 컴포넌트 이름 (기존 lucide 이름을 유지해 호출부 변경을 최소화한다)
 * icon    : iconsax 아이콘 이름
 * bold    : true면 variant="bold" 분기를 함께 생성 (좋아요/재생 등 채움 상태가 필요한 아이콘)
 * alias   : 같은 그림을 쓰는 추가 export 이름 (shadcn 내부에서 쓰는 *Icon 계열)
 * derive  : iconsax 아이콘에서 일부 path만 뽑아 확대 (테두리 없는 체크·X)
 * raw     : iconsax에 대응이 없어 직접 그린 아이콘
 * note    : 1:1 대응이 아닌 경우 근거
 */
export const MAPPING = [
  // ── 상태 / 알림 ──────────────────────────────────────────────
  { name: "AlertCircle", icon: "warning-2" },
  { name: "AlertTriangle", icon: "danger", alias: ["TriangleAlertIcon"] },
  { name: "Info", icon: "info-circle", alias: ["InfoIcon"] },
  { name: "CheckCircle2", icon: "tick-circle", alias: ["CircleCheckIcon"] },
  { name: "XCircle", icon: "close-circle", alias: ["OctagonXIcon"] },
  { name: "ShieldAlert", icon: "shield-cross" },
  { name: "Bell", icon: "notification" },

  // ── 화살표 / 방향 ────────────────────────────────────────────
  { name: "ArrowUp", icon: "arrow-up-01" },
  { name: "ArrowDown", icon: "arrow-down-01" },
  { name: "ArrowLeft", icon: "arrow-left-01" },
  { name: "ArrowRight", icon: "arrow-right-01" },
  { name: "ChevronUp", icon: "arrow-up-02", alias: ["ChevronUpIcon"] },
  { name: "ChevronDown", icon: "arrow-down-02", alias: ["ChevronDownIcon"] },
  { name: "ChevronLeft", icon: "arrow-left-02" },
  { name: "ChevronRight", icon: "arrow-right-02", alias: ["ChevronRightIcon"] },
  {
    name: "ArrowUpRight",
    icon: "export-arrow-01",
    note: "iconsax free에 대각선 화살표가 없어 '외부로 나가는 화살표'로 대체",
  },
  { name: "ExternalLink", icon: "export-circle-01" },

  // ── 기본 조작 ────────────────────────────────────────────────
  { name: "Plus", icon: "add" },
  { name: "Minus", icon: "minus" },
  {
    name: "Check",
    derive: { from: "tick-square", paths: [1], scale: 1.3 },
    alias: ["CheckIcon"],
    note: "tick-square에서 체크 표시만 추출 (테두리 없는 체크가 free 세트에 없음)",
  },
  {
    name: "X",
    derive: { from: "close-circle", paths: [1, 2], scale: 1.6 },
    alias: ["XIcon"],
    note: "close-circle에서 X만 추출",
  },
  { name: "Search", icon: "search-normal" },
  {
    name: "Menu",
    icon: "textalign-justifycenter",
    note: "iconsax의 'menu'는 2x2 점 격자라 햄버거 형태인 textalign-justifycenter를 사용",
  },
  {
    name: "MoreVertical",
    icon: "3-dots-more",
    note: "iconsax free에 세로 점 3개가 없어 가로 버전 사용",
  },
  { name: "Trash2", icon: "trash" },
  { name: "Edit", icon: "edit" },
  { name: "Pencil", icon: "edit-2", alias: ["PenLine"] },
  { name: "Eye", icon: "eye" },
  { name: "Lock", icon: "lock" },
  { name: "LogIn", icon: "login-01" },
  { name: "LogOut", icon: "logout-01" },
  { name: "Share2", icon: "share" },
  { name: "Send", icon: "send-2" },
  {
    name: "CircleIcon",
    icon: "record",
    bold: true,
    note: "라디오 버튼 점 — bold로 채움",
  },

  // ── 새로고침 / 반복 ──────────────────────────────────────────
  { name: "RefreshCw", icon: "refresh-right" },
  { name: "RefreshCcw", icon: "refresh-left" },
  { name: "RotateCcw", icon: "rotate-left" },
  {
    name: "Repeat",
    icon: "repeat-arrow",
    note: "'repeat'은 outline 스타일이 없어 repeat-arrow 사용",
  },
  { name: "Repeat1", icon: "repeate-one" },
  { name: "History", icon: "timer" },

  // ── 콘텐츠 / 도메인 ──────────────────────────────────────────
  { name: "BookOpen", icon: "book-open" },
  { name: "Home", icon: "home-2" },
  { name: "User", icon: "user" },
  { name: "Heart", icon: "heart", bold: true },
  { name: "Star", icon: "star", bold: true },
  { name: "ThumbsUp", icon: "like", bold: true },
  { name: "ThumbsDown", icon: "dislike", bold: true },
  { name: "MapPin", icon: "location", bold: true },
  { name: "Navigation", icon: "discover" },
  { name: "Calendar", icon: "calendar" },
  { name: "CalendarDays", icon: "calendar-date" },
  { name: "Ruler", icon: "ruler" },
  { name: "Clock", icon: "clock", alias: ["ClockIcon"] },
  { name: "Camera", icon: "camera" },
  { name: "ImageIcon", icon: "image" },
  { name: "ImagePlus", icon: "gallery-add" },
  { name: "Tag", icon: "tag" },
  { name: "Truck", icon: "truck" },
  { name: "PackageCheck", icon: "box-tick" },
  { name: "ShoppingBag", icon: "shopping-bag", alias: ["ShoppingBagIcon"] },
  { name: "Wallet", icon: "wallet" },
  { name: "DollarSign", icon: "dollar-circle" },
  { name: "BarChart3", icon: "chart-2" },
  { name: "TrendingUp", icon: "trend-up" },
  {
    name: "Handshake",
    icon: "arrow-swap-01",
    note: "iconsax free에 악수 아이콘이 없음 — 직거래(교환) 맥락에 맞는 교환 화살표로 대체",
  },
  { name: "Sparkles", icon: "magic-star" },
  { name: "Lightbulb", icon: "lamp-on" },
  { name: "Languages", icon: "translate" },
  { name: "Palette", icon: "color-swatch" },
  { name: "StickyNote", icon: "stickynote" },
  { name: "Quote", icon: "quote-up", alias: ["QuoteUpIcon"] },
  { name: "Disc3", icon: "cd" },

  // ── 연락 / 메시지 ────────────────────────────────────────────
  { name: "Mail", icon: "sms" },
  { name: "Phone", icon: "call" },
  { name: "MessageCircle", icon: "message-circle" },
  { name: "MessageSquare", icon: "message-square" },
  { name: "MessageSquareText", icon: "message-text" },
  { name: "MessageSquareX", icon: "message-remove" },
  {
    name: "MessageSquareDashed",
    icon: "message-bubble",
    note: "점선 말풍선이 없어 일반 말풍선으로 대체",
  },
  { name: "MessagesSquare", icon: "messages-2" },

  // ── 미디어 ───────────────────────────────────────────────────
  { name: "Play", icon: "play", bold: true },
  { name: "Pause", icon: "pause", bold: true },
  { name: "SkipForward", icon: "next", bold: true },
  { name: "SkipBack", icon: "previous", bold: true },
  { name: "Volume2", icon: "volume-high" },
  { name: "VolumeX", icon: "volume-slash" },

  // ── 에디터 툴바 ──────────────────────────────────────────────
  { name: "Bold", icon: "text-bold" },
  { name: "Italic", icon: "text-italic" },
  { name: "Underline", icon: "text-underline" },
  { name: "Code", icon: "code" },
  { name: "Highlighter", icon: "brush" },
  { name: "LinkIcon", icon: "link", alias: ["Link"] },
  { name: "Link2", icon: "link-2" },
  { name: "List", icon: "task" },
  { name: "ListOrdered", icon: "firstline" },
  { name: "AlignLeft", icon: "textalign-left" },
  { name: "AlignCenter", icon: "textalign-center" },
  { name: "AlignRight", icon: "textalign-right" },

  // ── 기존 public/icons + custom-icons.tsx에서 흡수 ────────────
  // (직접 받아 쓰던 SVG들. 스타일이 bold/linear/outline로 섞여 있던 것을 outline으로 통일)
  { name: "Book", icon: "book", alias: ["BookIcon"] },
  { name: "Box", icon: "box", alias: ["BoxIcon"] },
  { name: "CardPos", icon: "card-pos", alias: ["CardPosIcon"] },
  { name: "CopySuccess", icon: "copy-success", alias: ["CopySuccessIcon"] },
  { name: "DocumentCopy", icon: "document-copy", alias: ["DocumentCopyIcon"] },
  {
    name: "QuoteUpCircle",
    icon: "quote-up-circle",
    alias: ["QuoteUpCircleIcon"],
  },
  { name: "TruckFast", icon: "truck-fast", alias: ["TruckFastIcon"] },
  {
    name: "ShieldSecurity",
    icon: "shield-security",
    alias: ["ShieldSecurityIcon"],
  },
];

/** iconsax free 세트에 대응이 없어 iconsax 그리드(24px)에 맞춰 직접 그린 아이콘. */
export const CUSTOM = [
  {
    name: "Loader2",
    alias: ["Loader2Icon"],
    note: "스피너는 아이콘 팩에 없음 — 270° 호로 직접 그림 (animate-spin 전제)",
    body: `<path d="M12 3.25a8.75 8.75 0 1 1-8.75 8.75" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />`,
  },
  {
    name: "Strikethrough",
    note: "iconsax에 취소선이 없음 — text-underline의 글자꼴에 가운데 선을 그어 구성",
    body: `<path d="M12 17.75c-4.27 0-7.75-3.48-7.75-7.75V3a.75.75 0 0 1 1.5 0v7A6.26 6.26 0 0 0 12 16.25 6.26 6.26 0 0 0 18.25 10V3a.75.75 0 0 1 1.5 0v7c0 4.27-3.48 7.75-7.75 7.75Z" />
      <path d="M21 12.75H3a.75.75 0 0 1 0-1.5h18a.75.75 0 0 1 0 1.5Z" />`,
  },
  ...[1, 2, 3].map((n) => ({
    name: `Heading${n}`,
    note: "iconsax에 제목 단계 아이콘이 없음 — H 자형(면) + 숫자(선)로 직접 그림",
    body: `<path d="M4 4.25a.75.75 0 0 1 .75.75v6.25h6.5V5a.75.75 0 0 1 1.5 0v14a.75.75 0 0 1-1.5 0v-6.25h-6.5V19a.75.75 0 0 1-1.5 0V5A.75.75 0 0 1 4 4.25Z" />
      ${
        {
          1: `<path d="M16.4 13.5 18.4 12.1V19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />`,
          2: `<path d="M15.9 13.4c0-1.2 1.1-1.9 2.3-1.9s2.3.7 2.3 1.9c0 1.9-4.6 3.5-4.6 5.6h4.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />`,
          3: `<path d="M16.1 12.2a3 3 0 0 1 2-.7c1.2 0 2.2.6 2.2 1.7s-.9 1.7-2.1 1.7c1.3 0 2.3.7 2.3 1.9s-1.1 2-2.4 2a3 3 0 0 1-2.2-.9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />`,
        }[n]
      }`,
  })),
];
