"use client";

import { User as UserIcon } from "lucide-react";
import Link from "next/link";

import { useAuthStore } from "@/features/auth/store";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

interface UserInfo {
  id: number;
  nickname: string;
  profileImageUrl?: string | null;
}

interface UserAvatarMenuProps {
  user: UserInfo;
  /** 닉네임 표시 여부 */
  showNickname?: boolean;
  /** 추가 라벨 (예: "판매자") */
  label?: string;
  /** 아바타 크기 */
  size?: "sm" | "md" | "lg";
  /** 메뉴 표시 방향 */
  menuSide?: "top" | "right" | "bottom" | "left";
  /** 메뉴 정렬 */
  menuAlign?: "start" | "center" | "end";
  /** 추가 스타일 */
  className?: string;
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-9 h-9",
  lg: "w-10 h-10",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

/**
 * 사용자 아바타 메뉴 컴포넌트
 * - 로그인 상태: 클릭 시 드롭다운 메뉴 표시 → 프로필 보기
 * - 비로그인 상태: 메뉴 비활성화 (일반 아바타로 표시)
 */
export function UserAvatarMenu({
  user,
  showNickname = true,
  label,
  size = "md",
  menuSide = "bottom",
  menuAlign = "start",
  className,
}: UserAvatarMenuProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isLoggedIn = !!currentUser;

  const avatarContent = (
    <div
      className={cn(
        "flex items-center gap-2",
        isLoggedIn && "cursor-pointer",
        className
      )}
    >
      <Avatar className={cn(sizeClasses[size], "border border-stone-200")}>
        <AvatarImage
          src={user.profileImageUrl || undefined}
          alt={user.nickname}
        />
        <AvatarFallback className="bg-stone-100 text-stone-500 text-xs font-medium">
          {user.nickname.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      {(showNickname || label) && (
        <div className="flex flex-col">
          {showNickname && (
            <span
              className={cn(
                "font-medium text-stone-900",
                textSizeClasses[size]
              )}
            >
              {user.nickname}
            </span>
          )}
          {label && <span className="text-xs text-stone-500">{label}</span>}
        </div>
      )}
    </div>
  );

  // 비로그인 상태: 메뉴 없이 아바타만 표시
  if (!isLoggedIn) {
    return avatarContent;
  }

  // 로그인 상태: 드롭다운 메뉴
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center focus:outline-none rounded-lg p-1 -m-1"
          aria-label={`${user.nickname} 프로필 메뉴`}
        >
          {avatarContent}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={menuAlign} side={menuSide} className="w-40">
        <DropdownMenuItem asChild>
          <Link
            href={PATHS.USER_PROFILE(user.id)}
            className="flex items-center gap-2"
          >
            <UserIcon className="w-4 h-4" />
            <span>프로필 보기</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
