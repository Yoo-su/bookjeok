"use client";

import { useWishlistStatusQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from "@/features/user/mutations";
import { AnimatedHeart } from "@/shared/components/icons/animated";
import { Heart } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils";

interface WishlistButtonProps {
  type: "BOOK" | "SALE";
  id: string | number;
  className?: string;
  initialIsWishlisted?: boolean;
}

export const WishlistButton = ({
  type,
  id,
  className,
  initialIsWishlisted,
}: WishlistButtonProps) => {
  const t = useTranslations("common.aria");
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const currentUser = mounted ? user : null;

  // initialIsWishlisted가 주어지면 쿼리를 실행하지 않음 (이미 상태를 알고 있음)
  const shouldFetch = !!currentUser && initialIsWishlisted === undefined;

  const { data: statusData, isLoading } = useWishlistStatusQuery(type, id, {
    enabled: shouldFetch,
  });

  const [isWishlisted, setIsWishlisted] = useState(
    initialIsWishlisted ?? false,
  );

  const addToWishlistMutation = useAddToWishlistMutation();
  const removeFromWishlistMutation = useRemoveFromWishlistMutation();

  useEffect(() => {
    if (statusData !== undefined) {
      setIsWishlisted(statusData);
    }
  }, [statusData]);

  // initialIsWishlisted가 변경되면 상태 업데이트 (단, 사용자가 인터랙션 한 후에는 무시될 수 있음)
  useEffect(() => {
    if (initialIsWishlisted !== undefined) {
      setIsWishlisted(initialIsWishlisted);
    }
  }, [initialIsWishlisted]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 비로그인 시 버튼이 disabled이므로 여기로 오지 않지만, 방어 코드 유지
    if (!currentUser) return;

    if (isWishlisted) {
      setIsWishlisted(false);
      removeFromWishlistMutation.mutate(
        { type, id },
        {
          onError: () => setIsWishlisted(true), // Rollback
        },
      );
    } else {
      setIsWishlisted(true);
      addToWishlistMutation.mutate(
        { type, id },
        {
          onError: () => setIsWishlisted(false), // 롤백
        },
      );
    }
  };

  // 로딩 중이거나 비로그인 상태면 disabled (단, 초기값이 있으면 로딩 무시)
  const isButtonLoading = isLoading && initialIsWishlisted === undefined;

  if (isButtonLoading || !currentUser) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("rounded-full", className)}
        disabled
        aria-label={t("add_wishlist")}
      >
        <Heart className="w-5 h-5 text-gray-300" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("rounded-full hover:bg-transparent", className)}
      onClick={handleToggle}
      aria-label={isWishlisted ? t("remove_wishlist") : t("add_wishlist")}
      aria-pressed={isWishlisted}
    >
      <AnimatedHeart
        size={24}
        animate={isWishlisted}
        animateOnHover
        className={cn(
          "transition-colors duration-200",
          isWishlisted
            ? "fill-red-500 text-red-500"
            : "text-gray-400 hover:text-red-500",
        )}
        aria-hidden="true"
      />
    </Button>
  );
};
