export const NAVIGATION_START_EVENT = "bookjeok:navigation-start";

/** 앵커가 없는 카드·캔버스 등에서 router.push 직전에 호출한다. */
export const signalNavigationStart = () => {
  window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
};
