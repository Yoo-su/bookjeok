"use client";

import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePathname } from "@/shared/config/i18n/routing";

import { CAMEO_SCENES, type CameoScene, canCameoOn } from "../../../constants";
import {
  cameoDelay,
  type CameoSession,
  rollCameo,
} from "../../../lib/schedule";
import { useCatCameoStore } from "../../../stores/use-cat-cameo-store";
import type { CameoSceneProps } from "../../scenes/types";

/** 장면 그림은 나올 때만 불러온다 */
const SCENES: Record<CameoScene, React.ComponentType<CameoSceneProps>> = {
  walk: dynamic(
    () => import("../../scenes/header-walk").then((m) => m.HeaderWalk),
    { ssr: false },
  ),
  peek: dynamic(
    () => import("../../scenes/bottom-peek").then((m) => m.BottomPeek),
    { ssr: false },
  ),
};

const SESSION_KEY = "cat-cameo-session";

function readSession(): CameoSession {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as CameoSession;
  } catch {
    // 시크릿 창 등에서 막히면 이번 탭은 처음인 셈 친다
  }
  return { shown: 0, lastAt: 0 };
}

function writeSession(s: CameoSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    // 기록하지 못해도 하루 한도는 localStorage가 지킨다
  }
}

/** 장면별로 그려 넣을 자리. 산책은 상단바 알약이 있고 충분히 넓을 때만 */
function hostOf(scene: CameoScene): HTMLElement | null {
  if (scene === "peek") return window.innerHeight >= 420 ? document.body : null;
  const pill = document.querySelector<HTMLElement>("[data-site-header] > div");
  return pill && pill.clientWidth >= 260 ? pill : null;
}

/** 쓰는 중이거나 다른 창이 떠 있으면 끼어들지 않는다 */
function isBusy() {
  if (document.visibilityState !== "visible") return true;
  if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
    return true;
  const el = document.activeElement as HTMLElement | null;
  return (
    !!el &&
    (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
  );
}

/** 주소에 ?cat=walk 또는 ?cat=peek를 붙이면 한도와 확률 없이 바로 나온다(확인용) */
function forcedScene(): CameoScene | null {
  const v = new URLSearchParams(window.location.search).get("cat");
  return CAMEO_SCENES.includes(v as CameoScene) ? (v as CameoScene) : null;
}

/**
 * 북적 어디서든 가끔 나타나는 검정고양이. 특정 기능과 상관없이 화면 틀을 넘나든다.
 * 페이지에 잠시 머물면 주사위를 굴리고, 세션·하루 한도 안에서만 나온다
 */
export function CatCameoHost() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [play, setPlay] = useState<{
    scene: CameoScene;
    host: HTMLElement;
    key: number;
  } | null>(null);
  const playing = useRef(false);
  useEffect(() => {
    playing.current = play !== null;
  }, [play]);

  useEffect(() => {
    if (reduce || !canCameoOn(pathname)) return;
    const start = (scene: CameoScene, record: boolean) => {
      if (playing.current || isBusy()) return;
      const host = hostOf(scene);
      if (!host) return;
      if (record) {
        const now = Date.now();
        useCatCameoStore.getState().markShown(scene, now);
        const s = readSession();
        writeSession({ shown: s.shown + 1, lastAt: now });
      }
      playing.current = true;
      setPlay({ scene, host, key: Date.now() });
    };
    const forced = forcedScene();
    if (forced) {
      const id = window.setTimeout(() => start(forced, false), 900);
      return () => window.clearTimeout(id);
    }
    let id = 0;
    // 머무는 동안 계속 기회를 준다. 한도·간격은 rollCameo가 지킨다
    const tick = (retry: boolean) => {
      id = window.setTimeout(() => {
        if (!playing.current && !isBusy()) {
          const scene = rollCameo({
            now: Date.now(),
            ledger: useCatCameoStore.getState(),
            session: readSession(),
            available: CAMEO_SCENES.filter((s) => hostOf(s)),
            rand: Math.random,
            retry,
          });
          if (scene) start(scene, true);
        }
        tick(true);
      }, cameoDelay(Math.random, retry));
    };
    tick(false);
    return () => window.clearTimeout(id);
  }, [pathname, reduce]);

  const onDone = useCallback(() => setPlay(null), []);

  const Scene = play ? SCENES[play.scene] : null;
  if (!Scene || !play) return null;
  return (
    <Scene key={play.key} host={play.host} rand={Math.random} onDone={onDone} />
  );
}
