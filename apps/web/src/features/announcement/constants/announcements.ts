/**
 * 접속 시 한 번 소개할 새 기능. 기간이 지나면 새로 온 사용자에게 "새 기능"으로 띄우지 않는다.
 * 시각은 KST 자정 기준이다.
 */
export const ANNOUNCEMENTS = [
  {
    id: "reading-stack",
    from: "2026-09-26T00:00:00+09:00",
    until: "2026-10-26T00:00:00+09:00",
  },
] as const;

export type AnnouncementId = (typeof ANNOUNCEMENTS)[number]["id"];

/** 지금 띄울 공지. 기간 안이고 아직 보지 않은 것 중 첫 번째 */
export function pickAnnouncement(now: number, seen: readonly string[]) {
  return ANNOUNCEMENTS.find(
    (a) =>
      !seen.includes(a.id) &&
      now >= Date.parse(a.from) &&
      now < Date.parse(a.until),
  );
}

/**
 * 공지를 띄울 수 있는 경로. 비로그인은 홈에서만 띄워 검색으로 들어온 첫 화면을 가리지 않는다.
 * 남의 공개 독서 키재기(/users/*)는 이미 쌓은 책을 보고 있으므로 뺀다.
 */
export function canAnnounceOn(pathname: string, loggedIn: boolean) {
  if (pathname.startsWith("/users/")) return false;
  return loggedIn || pathname === "/";
}
