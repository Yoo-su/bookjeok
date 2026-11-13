import type { Locale } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { splitLocalizedPath } from "@/shared/utils/browser-navigation";

const STORAGE_KEY = "auth-return-url";
const SOCIAL_LOCALE_KEY = "auth-social-locale";
const RETURN_URL_TTL = 30 * 60 * 1000;
const TRANSIENT_ROUTES: ReadonlySet<string> = new Set([
  PATHS.LOGIN,
  PATHS.SIGNUP,
  PATHS.CALLBACK,
  PATHS.VERIFY_EMAIL,
  PATHS.ORDER_PAYMENT_SUCCESS,
  PATHS.ORDER_PAYMENT_FAIL,
]);

function parseReturnUrl(href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) return null;

  const { pathname, locale } = splitLocalizedPath(url.pathname);
  const route = decodeURIComponent(pathname).replace(/\/+$/, "");
  if (route.startsWith("//") || TRANSIENT_ROUTES.has(route)) return null;
  return { href: pathname + url.search + url.hash, locale };
}

export function saveReturnUrl(href: string) {
  try {
    const target = parseReturnUrl(href);
    if (!target) return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        href,
        locale:
          target.locale ?? splitLocalizedPath(window.location.pathname).locale,
        expiresAt: Date.now() + RETURN_URL_TTL,
      }),
    );
  } catch {
    // 저장소에 접근할 수 없으면 로그인 후 기본 목적지로 이동한다.
  }
}

export function saveCurrentReturnUrl() {
  const { pathname, search, hash } = window.location;
  saveReturnUrl(pathname + search + hash);
}

export function consumeReturnUrl() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (!stored) return null;
    // 배포 전에 열린 탭에는 기존 문자열 값이 남아 있을 수 있다.
    if (stored.startsWith("/")) return parseReturnUrl(stored);
    const { href, locale, expiresAt } = JSON.parse(stored);
    if (typeof href !== "string" || !(expiresAt > Date.now())) return null;
    const target = parseReturnUrl(href);
    if (!target) return null;
    return {
      href: target.href,
      locale:
        target.locale ??
        (locale === "ko" || locale === "en" ? locale : undefined),
    };
  } catch {
    return null;
  }
}

export function saveSocialLoginLocale(locale: Locale) {
  try {
    sessionStorage.setItem(SOCIAL_LOCALE_KEY, locale);
  } catch {
    // 콜백의 기본 언어를 사용한다.
  }
}

export function consumeSocialLoginLocale(): Locale | undefined {
  try {
    const locale = sessionStorage.getItem(SOCIAL_LOCALE_KEY);
    sessionStorage.removeItem(SOCIAL_LOCALE_KEY);
    return locale === "en" || locale === "ko" ? locale : undefined;
  } catch {
    return undefined;
  }
}

export function clearAuthNavigation() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SOCIAL_LOCALE_KEY);
  } catch {
    // 저장소에 접근할 수 없는 환경
  }
}
