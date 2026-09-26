import { type Cmds, type Pt, samplePath, wobble } from "./sketch";
import type { PathItem, SceneColors } from "./types";

export interface PenOptions {
  w?: number;
  a?: number;
  op?: number;
  light?: boolean;
  closed?: boolean;
}

/** 캐릭터를 그리는 연필. 300×1000 단위 좌표를 받아 장면 px로 옮겨 그린다 */
export interface Pencil {
  items: PathItem[];
  C: SceneColors;
  /** 진한 선 한 번, 흐린 선 한 번 겹쳐 연필 느낌을 낸다 */
  pen: (cmds: Cmds, o?: PenOptions) => void;
  fill: (cmds: Cmds, color?: string) => void;
  /** 흔들림 적은 가는 선 묶음. 해칭·주름에 쓴다 */
  hatch: (cmds: Cmds, o?: { w?: number; op?: number; color?: string }) => void;
  /** split일 때만 머리 선을 `head`에 따로 모은다. 인사할 때 고개만 움직이려는 것 */
  head: PathItem[];
  headOn: () => void;
  headOff: () => void;
}

export function createPencil(o: {
  T: (x: number, y: number) => Pt;
  C: SceneColors;
  u: number;
  seed: number;
  split?: boolean;
}): Pencil {
  const { T, C, u, seed } = o;
  const items: PathItem[] = [];
  const head: PathItem[] = [];
  let target = items;
  let n = 0;
  const W = (cmds: Cmds, s: number, amp: number, closed: boolean) =>
    wobble(samplePath(cmds, T), s, amp, closed);
  return {
    items,
    head,
    C,
    headOn() {
      if (o.split) target = head;
    },
    headOff() {
      target = items;
    },
    pen(cmds, p = {}) {
      const s = seed + (n += 3);
      const sw = (p.w ?? 1.9) * u;
      const amp = (p.a ?? 0.9) * u;
      target.push({
        k: "p",
        d: W(cmds, s, amp, !!p.closed),
        stroke: C.ink,
        sw,
        cap: "round",
        join: "round",
        op: p.op ?? 0.92,
      });
      if (p.light !== false) {
        target.push({
          k: "p",
          d: W(cmds, s + 1, amp * 1.7, !!p.closed),
          stroke: C.ink,
          sw: sw * 0.5,
          cap: "round",
          join: "round",
          op: 0.38,
        });
      }
    },
    fill(cmds, color = C.paper) {
      target.push({
        k: "p",
        d: W(cmds, seed + (n += 3), 0.35 * u, true),
        fill: color,
      });
    },
    hatch(cmds, p = {}) {
      target.push({
        k: "p",
        d: W(cmds, seed + (n += 3), 0.3 * u, false),
        stroke: p.color ?? C.ink,
        sw: (p.w ?? 0.9) * u,
        cap: "round",
        op: p.op ?? 0.4,
      });
    },
  };
}

/** 베지어 네 개로 그린 타원 */
export const ell = (cx: number, cy: number, rx: number, ry: number): Cmds => [
  "M",
  cx - rx,
  cy,
  "C",
  cx - rx,
  cy - ry * 0.55,
  cx - rx * 0.55,
  cy - ry,
  cx,
  cy - ry,
  "C",
  cx + rx * 0.55,
  cy - ry,
  cx + rx,
  cy - ry * 0.55,
  cx + rx,
  cy,
  "C",
  cx + rx,
  cy + ry * 0.55,
  cx + rx * 0.55,
  cy + ry,
  cx,
  cy + ry,
  "C",
  cx - rx * 0.55,
  cy + ry,
  cx - rx,
  cy + ry * 0.55,
  cx - rx,
  cy,
];
