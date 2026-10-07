"use client";

import type { ReceivedKongLog } from "@bookjeok/core";
import {
  useReadingLogSettingsQuery,
  useReceivedKongsQuery,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/shared/utils/cn";

import { useKongFlail } from "../hooks/use-kong-flail";
import { KongAboutDialog } from "../kong-about-dialog";
import { FlailingKong } from "../kong-figure/flailing-kong";
import type { KongFace } from "../lib/kong-art";

/** 줄에 그리는 콩 수. 넘으면 숫자만 늘어난다. 좁은 화면은 셋까지 */
const MAX_DRAWN = 5;
const MAX_DRAWN_NARROW = 3;

/**
 * 보낸 사람 이름. 셋을 넘으면 「외 N명」.
 * 서버는 보낸 사람을 앞의 몇 명만 주므로 N은 count로 센다
 */
export function useSenderNames() {
  const t = useTranslations("kong.owner");
  return ({ senders, count }: Pick<ReceivedKongLog, "senders" | "count">) => {
    const names = senders
      .slice(0, 3)
      .map((s) => s.nickname)
      .join(" · ");
    return count > 3 ? t("senders_more", { names, count: count - 3 }) : names;
  };
}

/** 누르면 바둥거리는 작은 콩 한 알 */
export function PokeableKong({
  size,
  seed,
  restFace,
  className,
}: {
  size: number;
  seed?: number;
  restFace?: KongFace;
  className?: string;
}) {
  const flail = useKongFlail();
  // 포인터로만 누르는 장식. 정보는 옆 글자가 전한다
  return (
    <span
      onClick={flail.poke}
      className={cn("cursor-pointer", className)}
      aria-hidden="true"
    >
      <FlailingKong size={size} flail={flail} seed={seed} restFace={restFace} />
    </span>
  );
}

/**
 * 내 기록에서 보는 콩 줄. 보내기 대신 받은 콩과 보낸 사람을 보여 준다.
 * 아직 없으면 자는 콩과 함께, 비공개라 받을 수 없는지까지 알려 준다
 */
export function KongOwnerRow({ logId }: { logId: string }) {
  const t = useTranslations("kong.owner");
  const senderNames = useSenderNames();
  const { data, isPending } = useReceivedKongsQuery();
  const { data: settings } = useReadingLogSettingsQuery();
  const [aboutOpen, setAboutOpen] = useState(false);

  if (isPending) return <div className="min-h-[60px]" aria-hidden="true" />;

  const log = data?.logs.find((l) => l.logId === logId);
  const isPublic = settings?.isReadingLogPublic ?? true;

  return (
    <>
      <div className="flex min-h-[60px] items-center gap-3">
        {log ? (
          <>
            <div className="flex shrink-0 items-end">
              {Array.from(
                { length: Math.min(log.count, MAX_DRAWN) },
                (_, i) => (
                  <PokeableKong
                    key={i}
                    size={34}
                    seed={600 + i * 37}
                    className={cn(
                      i && "-ml-2",
                      i >= MAX_DRAWN_NARROW && "max-sm:hidden",
                    )}
                  />
                ),
              )}
            </div>
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-gaegu)] text-[19px] leading-tight text-stone-800">
                {t("received", { count: log.count })}
              </p>
              <p className="line-clamp-1 text-xs text-stone-500">
                {senderNames(log)}
              </p>
            </div>
          </>
        ) : (
          <>
            <PokeableKong
              size={34}
              restFace="sleep"
              className="shrink-0 opacity-80"
            />
            <p className="font-[family-name:var(--font-gaegu)] text-[18px] leading-tight text-stone-500">
              {isPublic ? t("none") : t("private")}
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                className="-my-2 ml-2 inline-block cursor-pointer py-2 font-sans text-xs text-stone-400 underline decoration-dotted underline-offset-2 hover:text-stone-700"
              >
                {t("what")}
              </button>
            </p>
          </>
        )}
      </div>
      <KongAboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}
