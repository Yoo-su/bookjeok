"use client";

import { useSendKongMutation, useSentKongsQuery } from "@bookjeok/react-query";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
import { Link, usePathname } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useKongFlail } from "../hooks/use-kong-flail";
import { KongAboutDialog } from "../kong-about-dialog";
import { KongFigure } from "../kong-figure";
import { FlailingKong } from "../kong-figure/flailing-kong";

const BUTTON_SIZE = 56;
const SEAT_SIZE = 44;
/** 누르면 납작해졌다가 튀어 오르기까지 */
const SQUASH_MS = 150;
const FLIGHT_S = 0.72;

interface Flight {
  dx: number;
  dy: number;
  left: number;
  top: number;
}

interface KongVisitorRowProps {
  logId: string;
  /** 기록 주인 */
  handle: string;
  nickname: string;
  bookTitle: string;
  /** 보낸 콩이 앉을 표지. 다이얼로그 안 요소라 처음엔 null일 수 있다 */
  seatHost: HTMLElement | null;
}

/**
 * 남의 독서 기록에 콩을 보내는 줄. 비로그인은 콩이 바둥거리며 로그인을 권하고,
 * 처음 보내면 콩이 표지 위로 날아가 앉고, 이미 보냈으면 표지 위 콩이 바둥거린다
 */
export function KongVisitorRow({
  logId,
  handle,
  nickname,
  bookTitle,
  seatHost,
}: KongVisitorRowProps) {
  const t = useTranslations("kong.send");
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const { data, isPending } = useSentKongsQuery(handle, { enabled: !!user });
  const { mutate } = useSendKongMutation(handle, {
    onError: () => toast.error(t("error")),
  });
  const sent = !!data?.logIds.includes(logId);

  const buttonFlail = useKongFlail();
  const seatFlail = useKongFlail();
  const [squashing, setSquashing] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [landing, setLanding] = useState(0);
  const [bubble, setBubble] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const buttonKongRef = useRef<HTMLSpanElement>(null);
  const seatRef = useRef<HTMLButtonElement>(null);
  const squashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(squashTimer.current), []);

  const land = useCallback(() => {
    setFlight(null);
    setLanding((n) => n + 1);
  }, []);

  // 날아가는 중에 탭을 옮기면 프레임이 멈춰 끝나지 않는다. 시간이 지나면 앉힌다
  useEffect(() => {
    if (!flight) return;
    const timer = setTimeout(land, FLIGHT_S * 1000 + 400);
    return () => clearTimeout(timer);
  }, [flight, land]);

  const handleSend = () => {
    if (!user) {
      buttonFlail.flail();
      setBubble(true);
      return;
    }
    if (sent || squashing || flight) return;

    mutate(logId);
    if (reduced) {
      setLanding((n) => n + 1);
      return;
    }
    setSquashing(true);
    squashTimer.current = setTimeout(() => {
      setSquashing(false);
      const from = buttonKongRef.current?.getBoundingClientRect();
      const to = seatRef.current?.getBoundingClientRect();
      if (!from || !to) {
        land();
        return;
      }
      // 크기가 달라 가운데끼리 맞춘다
      setFlight({
        left: from.left,
        top: from.top,
        dx: to.left + to.width / 2 - (from.left + from.width / 2),
        dy: to.top + to.height / 2 - (from.top + from.height / 2),
      });
    }, SQUASH_MS);
  };

  const seated = sent && !squashing && !flight;
  const seat =
    sent && seatHost
      ? createPortal(
          <motion.button
            ref={seatRef}
            key={landing}
            type="button"
            onClick={seatFlail.poke}
            aria-label={t("seat_label")}
            title={t("seat_label")}
            initial={landing ? { scaleX: 1.35, scaleY: 0.6 } : false}
            animate={{ scaleX: 1, scaleY: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 12 }}
            style={{
              visibility: seated ? "visible" : "hidden",
              transformOrigin: "50% 100%",
            }}
            className="absolute -right-4 -top-6 z-[1] cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-stone-700"
          >
            <FlailingKong size={SEAT_SIZE} flail={seatFlail} />
          </motion.button>,
          seatHost,
        )
      : null;

  const flyer =
    flight && typeof document !== "undefined"
      ? createPortal(
          <>
            <motion.span
              aria-hidden="true"
              className="pointer-events-none fixed z-[60] font-[family-name:var(--font-gaegu)] text-[30px] font-bold text-stone-900"
              style={{ left: flight.left - 6, top: flight.top - 20 }}
              initial={{ opacity: 0, scale: 0.6, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.6, 1.1, 1],
                y: [0, -14, -30],
              }}
              transition={{ duration: 0.9, times: [0, 0.3, 1] }}
            >
              {t("pong")}
            </motion.span>
            <motion.span
              aria-hidden="true"
              className="pointer-events-none fixed z-[60]"
              style={{ left: flight.left, top: flight.top }}
              initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
              animate={{
                x: arc(flight.dx, flight.dy).x,
                y: arc(flight.dx, flight.dy).y,
                rotate: -540,
                scale: SEAT_SIZE / BUTTON_SIZE,
              }}
              transition={{ duration: FLIGHT_S, ease: [0.35, 0.1, 0.4, 1] }}
              onAnimationComplete={land}
            >
              <KongFigure size={BUTTON_SIZE} face="squeeze" />
            </motion.span>
          </>,
          document.body,
        )
      : null;

  // 로그인했는데 보낸 목록을 받는 중이면 버튼이 잠깐 보였다 사라지지 않게 자리만 잡는다
  if (user && isPending) {
    return <div className="min-h-[76px]" aria-hidden="true" />;
  }

  return (
    <>
      {seat}
      {flyer}
      <div className="relative flex min-h-[76px] items-center justify-between gap-3">
        {seated ? (
          <p className="font-[family-name:var(--font-gaegu)] text-[19px] leading-tight text-stone-700">
            {t("sent")}
            <span className="mt-0.5 block font-sans text-xs text-stone-400">
              {t("sent_note")}
            </span>
          </p>
        ) : (
          <>
            <p className="font-[family-name:var(--font-gaegu)] text-[19px] leading-tight text-stone-700">
              {t("prompt_1")}
              <br />
              {t("prompt_2")}
              <span className="mt-0.5 block font-sans text-xs text-stone-400">
                {t("note")}{" "}
                <button
                  type="button"
                  onClick={() => setAboutOpen(true)}
                  className="-my-2 inline-block cursor-pointer py-2 text-stone-500 underline decoration-dotted underline-offset-2 hover:text-stone-800"
                >
                  {t("what")}
                </button>
              </span>
            </p>
            <button
              type="button"
              onClick={handleSend}
              disabled={!!user && (sent || squashing || !!flight)}
              aria-label={t("aria", { name: nickname, title: bookTitle })}
              className="group flex shrink-0 cursor-pointer flex-col items-center rounded-2xl px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-stone-700 disabled:cursor-default"
            >
              <motion.span
                ref={buttonKongRef}
                className="block transition-transform duration-150 pointer-fine:group-hover:-rotate-6"
                animate={
                  squashing
                    ? { scaleX: 1.25, scaleY: 0.7 }
                    : { scaleX: 1, scaleY: 1 }
                }
                transition={{ duration: SQUASH_MS / 1000 }}
                style={{
                  transformOrigin: "50% 100%",
                  visibility: flight ? "hidden" : "visible",
                }}
              >
                {squashing ? (
                  <KongFigure size={BUTTON_SIZE} face="squeeze" />
                ) : (
                  <FlailingKong size={BUTTON_SIZE} flail={buttonFlail} boil />
                )}
              </motion.span>
              <span className="-mt-0.5 font-[family-name:var(--font-gaegu)] text-[15px] text-stone-500">
                {t("button")}
              </span>
            </button>
          </>
        )}

        {bubble && !user && (
          <motion.div
            role="status"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: "85% 100%" }}
            className="absolute bottom-[calc(100%-6px)] right-0 z-[2] flex items-center gap-2 whitespace-nowrap rounded-2xl border-[1.5px] border-stone-900 bg-white py-2 pl-3 pr-2 text-[13px] text-stone-700 shadow-[3px_3px_0_#1c1917] after:absolute after:-bottom-[7px] after:right-8 after:h-3 after:w-3 after:rotate-45 after:border-b-[1.5px] after:border-r-[1.5px] after:border-stone-900 after:bg-white"
          >
            {t("login_bubble")}
            <Link
              href={PATHS.LOGIN}
              onClick={() => saveReturnUrl(pathname)}
              className="inline-flex h-8 items-center rounded-full bg-stone-900 px-3 text-xs font-semibold text-white hover:bg-stone-700"
            >
              {t("login")}
            </Link>
          </motion.div>
        )}
      </div>
      <KongAboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}

/** 포물선 경로. 시작과 끝을 잇고 가운데를 위로 띄운다 */
function arc(dx: number, dy: number, steps = 16, lift = 140) {
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    x.push(dx * s);
    y.push(dy * s - 4 * lift * s * (1 - s));
  }
  return { x, y };
}
