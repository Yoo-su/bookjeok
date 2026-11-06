/** 고양이가 나오는 장면. walk는 상단바 안을 걸어 지나가고, peek는 화면 아래 모서리에서 고개를 내민다 */
export type CameoScene = "walk" | "peek";

export const CAMEO_SCENES: CameoScene[] = ["walk", "peek"];

/** 몇 분 둘러보면 한 번은 만나게. 한 번에 정하고 여기서만 고친다 */
export const CAMEO_RULES = {
  /** 페이지에 들어와 이만큼 머문 뒤에 첫 주사위를 굴린다(ms) */
  delayMin: 4_000,
  delayMax: 10_000,
  /** 첫 주사위에서 나올 확률 */
  chance: 0.45,
  /** 같은 페이지에 머무는 동안 이 간격(ms)마다 다시 굴린다 */
  retryMin: 35_000,
  retryMax: 60_000,
  retryChance: 0.3,
  /** 세션(탭)당 최대 횟수와 다음 등장까지 최소 간격(ms) */
  perSession: 3,
  minGap: 90_000,
  /** 하루 최대 횟수 */
  perDay: 8,
} as const;

/** 쓰거나 결제하는 중에는 끼어들지 않는다. 경로는 로케일을 뺀 값 */
const QUIET_PREFIXES = [
  "/login",
  "/signup",
  "/verify-email",
  "/callback",
  "/order",
  "/admin",
  "/book/reviews/write",
  "/book/sales/register",
];

export function canCameoOn(pathname: string) {
  if (
    QUIET_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  )
    return false;
  return !pathname.endsWith("/edit");
}
