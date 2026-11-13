import type { Locale } from "@/shared/config/i18n/routing";

export function splitLocalizedPath(pathname: string) {
  const prefix = pathname.match(/^\/(ko|en)(?=\/|$)/);
  return {
    locale: prefix?.[1] as Locale | undefined,
    pathname: prefix ? pathname.slice(prefix[0].length) || "/" : pathname,
  };
}

export function localizedPath(href: string, locale: Locale) {
  return "/" + locale + (href === "/" ? "" : href);
}

/** 이전 방문 기록을 확인할 수 있을 때만 브라우저 뒤로가기를 사용한다. */
export function previousAppUrl(steps = 1): URL | null {
  const { navigation } = window as Window & {
    navigation?: {
      currentEntry: { index: number } | null;
      entries(): ReadonlyArray<{ url: string | null }>;
    };
  };
  const index = navigation?.currentEntry?.index ?? -1;
  const href =
    index >= steps ? navigation?.entries()[index - steps]?.url : null;
  if (!href) return null;

  const previous = new URL(href);
  return previous.origin === window.location.origin ? previous : null;
}

export function returnToApp(
  router: { back(): void; replace(href: string): void },
  fallback: string,
  allowedPreviousPaths: readonly string[],
) {
  const previous = previousAppUrl();
  const current = splitLocalizedPath(window.location.pathname);
  const target = previous && splitLocalizedPath(previous.pathname);
  if (
    target &&
    target.locale === current.locale &&
    allowedPreviousPaths.includes(target.pathname)
  ) {
    router.back();
    return;
  }
  router.replace(fallback);
}
