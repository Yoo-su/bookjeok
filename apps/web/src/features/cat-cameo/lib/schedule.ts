import { CAMEO_RULES, type CameoScene } from "../constants";

/** 기기에 남기는 기록. 날이 바뀌면 오늘 횟수를 새로 센다 */
export interface CameoLedger {
  day: string;
  shownToday: number;
  lastScene: CameoScene | null;
}

/** 탭이 살아 있는 동안의 기록 */
export interface CameoSession {
  shown: number;
  lastAt: number;
}

/** 로컬 날짜. 자정을 넘기면 하루 횟수가 풀린다 */
export function dayKey(now: number) {
  const d = new Date(now);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 페이지에 들어와 주사위를 굴리기까지 기다릴 시간(ms) */
export function cameoDelay(rand: () => number) {
  const { delayMin, delayMax } = CAMEO_RULES;
  return delayMin + rand() * (delayMax - delayMin);
}

/**
 * 지금 고양이를 내보낼지, 내보내면 어느 장면인지. 한도에 걸리거나 주사위가 빗나가면 null.
 * 바로 전 장면은 다른 장면이 가능할 때 피한다
 */
export function rollCameo(o: {
  now: number;
  ledger: CameoLedger;
  session: CameoSession;
  available: CameoScene[];
  rand: () => number;
}): CameoScene | null {
  const { now, ledger, session, available, rand } = o;
  if (!available.length) return null;
  const today = ledger.day === dayKey(now) ? ledger.shownToday : 0;
  if (today >= CAMEO_RULES.perDay) return null;
  if (session.shown >= CAMEO_RULES.perSession) return null;
  if (session.shown > 0 && now - session.lastAt < CAMEO_RULES.minGap)
    return null;
  if (rand() >= CAMEO_RULES.chance) return null;
  const fresh = available.filter((s) => s !== ledger.lastScene);
  const pool = fresh.length ? fresh : available;
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
}
