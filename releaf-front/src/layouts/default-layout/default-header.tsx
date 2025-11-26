"use client";

import { Search, Store } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/components/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";

import { Logo } from "../common/logo";
import UserPopover from "./user-popover";

export const DefaultHeader = () => {
  return (
    <header className="sticky top-0 left-0 z-50 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center justify-between max-w-3xl w-full px-4 py-3 mx-auto">
        {/* 좌측: 로고와 메뉴 */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Logo />
          </Link>
          {/* 향후 다른 메뉴 버튼들이 추가될 네비게이션 영역 */}
          <TooltipProvider>
            <nav className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="rounded-full cursor-pointer text-gray-600 hover:text-gray-900"
                    aria-label="중고마켓 페이지로 이동"
                  >
                    <Link href="/book/market">
                      <Store className="w-5 h-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>중고마켓</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="rounded-full cursor-pointer text-gray-600 hover:text-gray-900"
                    aria-label="도서 검색 페이지로 이동"
                  >
                    <Link href="/book/search">
                      <Search className="w-5 h-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>도서 검색</p>
                </TooltipContent>
              </Tooltip>
            </nav>
          </TooltipProvider>
        </div>

        {/* 우측: 사용자 정보 */}
        <div className="flex items-center">
          <UserPopover />
        </div>
      </div>
    </header>
  );
};
