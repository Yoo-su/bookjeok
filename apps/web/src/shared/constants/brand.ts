/** A 자유로운 펜선. 자산을 교체할 때 버전 경로도 바꿔 브라우저·공유 캐시를 갱신한다. */
const BRAND_BASE = "/brand/pen-v1";

export const BRAND_ASSETS = {
  symbol: `${BRAND_BASE}/symbol.svg`,
  symbolLight: `${BRAND_BASE}/symbol-light.svg`,
  symbolPng: `${BRAND_BASE}/symbol.png`,
  favicon: `${BRAND_BASE}/favicon.ico`,
  faviconSvg: `${BRAND_BASE}/favicon.svg`,
  icon192: `${BRAND_BASE}/icon-192.png`,
  icon512: `${BRAND_BASE}/icon-512.png`,
  maskableIcon: `${BRAND_BASE}/icon-maskable-512.png`,
  appleIcon: `${BRAND_BASE}/apple-touch-icon.png`,
  share: `${BRAND_BASE}/share.png`,
  shareCard: (locale: string, page: string) =>
    `/og/pen-v1/${locale === "en" ? "en" : "ko"}-${page}.png`,
} as const;
