"use client";

import { logout } from "@bookjeok/api-client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/shadcn/popover";
import { Separator } from "@/shared/components/shadcn/separator";
import { Link, usePathname } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { getProfileImageUrl } from "@/shared/utils/profile-image";
import { hardRedirect, markSessionToast } from "@/shared/utils/session";

export default function UserPopover() {
  const tAuth = useTranslations("header.auth");
  const tNav = useTranslations("header.nav");
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // 서버 로그아웃 실패 시에도 클라이언트 상태는 안전하게 정리
      console.warn("Server logout notification failed:", e);
    } finally {
      clearAuth();
      // 하드 내비게이션으로 브라우저 힙을 폐기한다.
      // SPA 이동(router.push)은 이전 사용자의 쿼리 캐시 · Router Cache · 소켓을
      // 그대로 남겨, 같은 브라우저에서 다음 사용자가 로그인할 때 노출된다.
      markSessionToast(tAuth("logout_success"));
      hardRedirect(PATHS.HOME);
    }
  };

  if (!user) return null;

  // 3. 로그인 상태일 때
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          hoverScale={1}
          tapScale={1}
          className="relative w-10 h-10 rounded-full p-0"
        >
          <Avatar className="w-10 h-10" data-nosnippet>
            <AvatarImage
              src={getProfileImageUrl(user.profileImageUrl)}
              alt={user.nickname}
            />
            <AvatarFallback>
              {user.nickname.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-0 overflow-hidden"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {user.nickname}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user.email || tAuth("no_email")}
          </p>
        </div>
        <Separator />
        <div className="p-1">
          <Button
            variant="ghost"
            hoverScale={1}
            tapScale={1}
            className="justify-start w-full h-auto px-3 py-2"
            asChild
          >
            <Link href={PATHS.MY_PAGE}>{tAuth("my_page")}</Link>
          </Button>

          <Button
            variant="ghost"
            hoverScale={1}
            tapScale={1}
            className="justify-start w-full h-auto px-3 py-2"
            asChild
          >
            <Link href={PATHS.MY_PAGE_WISHLIST}>{tAuth("wishlist")}</Link>
          </Button>
          <Button
            variant="ghost"
            hoverScale={1}
            tapScale={1}
            className="justify-start w-full h-auto px-3 py-2"
            asChild
          >
            <Link href={PATHS.READING_LOG}>{tNav("reading_log")}</Link>
          </Button>
          <Button
            variant="ghost"
            hoverScale={1}
            tapScale={1}
            className="justify-start w-full h-auto px-3 py-2"
            onClick={handleLogout}
          >
            {tAuth("logout")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
