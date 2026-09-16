import { Notification } from "@bookjeok/core";
import { useLocale, useTranslations } from "next-intl";

import { Trash2 } from "@/shared/components/icons/iconsax";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { Link } from "@/shared/config/i18n/routing";
import { cn } from "@/shared/utils";
import { formatRelativeTime } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { useDeleteNotification, useMarkAsRead } from "../../mutations";
import { getNotificationLink, getNotificationMessageParams } from "../../utils";

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

export const NotificationItem = ({
  notification,
  onClose,
}: NotificationItemProps) => {
  const t = useTranslations("notification");
  const locale = useLocale();

  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const link = getNotificationLink(notification);
  const { key, params } = getNotificationMessageParams(notification, {
    actor: t("fallback_actor"),
    cancelReason: t("fallback_cancel_reason"),
  });
  const message = t(key, params);

  const handleLinkClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onClose?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-4 p-4 transition-all duration-200 border-b border-border/40 last:border-0 relative", // gap-2 -> gap-4, p-3 -> p-4 변경 사항
        "hover:bg-sky-50/50 dark:hover:bg-sky-900/10",
        !notification.isRead
          ? "bg-sky-50/30 dark:bg-sky-900/5"
          : "bg-transparent",
      )}
    >
      <Link
        href={link}
        onClick={handleLinkClick}
        className="flex-1 flex items-start gap-3.5 min-w-0" // Link가 콘텐츠를 감쌈
      >
        <Avatar className="h-10 w-10 mt-0.5 border border-border/50 shadow-sm shrink-0">
          <AvatarImage
            src={getProfileImageUrl(notification.actor?.profileImageUrl)}
            alt={notification.actor?.nickname}
            className="object-cover"
          />
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
            {notification.actor?.nickname?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold leading-none text-foreground">
              {notification.actor?.nickname}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground/80 shrink-0 font-medium tracking-tight">
                {formatRelativeTime(notification.createdAt, locale)}
              </span>
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-orange-500 shadow-sm ring-2 ring-background" />
              )}
            </div>
          </div>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2 break-keep cursor-pointer">
                  {message}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-[280px] text-xs leading-relaxed break-keep bg-zinc-900/95 text-zinc-50 border-none shadow-xl [&_svg]:hidden px-3 py-2 rounded-md backdrop-blur-sm"
                sideOffset={5}
              >
                <p>{message}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Link>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 -mr-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        onClick={handleDelete}
        aria-label={t("delete")}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
};
