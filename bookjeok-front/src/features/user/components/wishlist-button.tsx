"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/store";
import { BookInfo } from "@/features/book/types";
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from "@/features/user/mutations";
import { useWishlistStatusQuery } from "@/features/user/queries";
import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils";

interface WishlistButtonProps {
  type: "BOOK" | "SALE";
  id: string | number;
  className?: string;
  bookData?: BookInfo;
}

export const WishlistButton = ({
  type,
  id,
  className,
  bookData,
}: WishlistButtonProps) => {
  const user = useAuthStore((state) => state.user);
  const { data: statusData, isLoading } = useWishlistStatusQuery(
    type,
    id,
    !!user
  );
  const [isWishlisted, setIsWishlisted] = useState(false);

  const addToWishlistMutation = useAddToWishlistMutation();
  const removeFromWishlistMutation = useRemoveFromWishlistMutation();

  useEffect(() => {
    if (statusData) {
      setIsWishlisted(statusData.isWishlisted);
    }
  }, [statusData]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 비로그인 시 버튼이 disabled이므로 여기로 오지 않지만, 방어 코드 유지
    if (!user) return;

    if (isWishlisted) {
      setIsWishlisted(false);
      removeFromWishlistMutation.mutate(
        { type, id },
        {
          onError: () => setIsWishlisted(true), // Rollback
        }
      );
    } else {
      setIsWishlisted(true);
      addToWishlistMutation.mutate(
        { type, id, bookData },
        {
          onError: () => setIsWishlisted(false), // 롤백
        }
      );
    }
  };

  // 로딩 중이거나 비로그인 상태면 disabled
  if (isLoading || !user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("rounded-full", className)}
        disabled
      >
        <Heart className="w-5 h-5 text-gray-300" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("rounded-full hover:bg-transparent", className)}
      onClick={handleToggle}
    >
      <Heart
        className={cn(
          "w-6 h-6 transition-colors duration-200",
          isWishlisted
            ? "fill-red-500 text-red-500"
            : "text-gray-400 hover:text-red-500"
        )}
      />
    </Button>
  );
};
