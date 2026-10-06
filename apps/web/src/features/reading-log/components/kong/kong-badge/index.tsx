import { useTranslations } from "next-intl";

import { cn } from "@/shared/utils/cn";

import { KongFigure } from "../kong-figure";

/** 달력 칸에 붙는 받은 콩 표시. 두 알 이상이면 수를 함께 */
export function KongBadge({
  count,
  size = 16,
  className,
}: {
  count: number;
  size?: number;
  className?: string;
}) {
  const t = useTranslations("kong.badge");
  if (count <= 0) return null;
  return (
    <span
      role="img"
      aria-label={t("aria", { count })}
      title={t("aria", { count })}
      className={cn(
        "inline-flex items-center gap-px font-[family-name:var(--font-gaegu)] text-[13px] font-bold leading-none tabular-nums text-stone-800",
        className,
      )}
    >
      <KongFigure size={size} />
      {count > 1 && count}
    </span>
  );
}
