"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/store";
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

export default function UserPopover() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    location.reload();
  };

  if (!user) {
    return (
      <Link href="/login">
        <Button className="bg-white cursor-pointer hover:bg-white text-gray-600 border-[0.5px] rounded-full border-gray-100 p-2">
          <LogIn />
          로그인
        </Button>
      </Link>
    );
  }

  // 3. 로그인 상태일 때
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative w-10 h-10 transition-transform duration-200 rounded-full hover:scale-105"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.profileImageUrl || ""} alt={user.nickname} />
            <AvatarFallback>
              {user.nickname.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-0"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {user.nickname}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user.email || "이메일 정보 없음"}
          </p>
        </div>
        <Separator />
        <div className="p-1">
          <Button
            variant="ghost"
            className="justify-start w-full h-auto px-3 py-2"
            asChild
          >
            <Link href="/my-page">마이페이지</Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full h-auto px-3 py-2"
            asChild
          >
            <Link href="/my-page/sales">판매글목록</Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full h-auto px-3 py-2"
            asChild
          >
            <Link href="/my-page/wishlist">위시리스트</Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full h-auto px-3 py-2"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
