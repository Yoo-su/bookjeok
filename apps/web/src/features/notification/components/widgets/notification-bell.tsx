import { useUnreadCountQuery } from "@bookjeok/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { Bell } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils";

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = ({ className }: NotificationBellProps) => {
  const t = useTranslations("notification");
  const { data: count = 0 } = useUnreadCountQuery();
  const showBadge = count > 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative rounded-full", className)}
    >
      <Bell className="h-5 w-5" />
      <AnimatePresence>
        {showBadge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-background"
          />
        )}
      </AnimatePresence>
      <span className="sr-only">
        {t("sr_label", { count: count > 99 ? "99+" : count })}
      </span>
    </Button>
  );
};
