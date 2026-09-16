"use client";

import Script from "next/script";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AnimatedCopyCheck } from "@/shared/components/icons/animated";
import { MessageCircle, Share2, X } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/shadcn/popover";
import { config } from "@/shared/config/env";
import { cn } from "@/shared/utils";

// 카카오 SDK 타입 선언
declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: KakaoShareOptions) => void;
      };
    };
  }
}

interface KakaoShareOptions {
  objectType: "feed";
  content: {
    title: string;
    description?: string;
    imageUrl?: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons?: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
}

/**
 * 공유 카드에 쓸 기본 이미지.
 *
 * 카카오 SDK는 브라우저에서 직접 URL을 수집하므로 `metadataBase`가 붙는
 * 메타태그와 달리 상대 경로를 해석하지 못한다. 절대 URL로 둔다.
 */
const FALLBACK_SHARE_IMAGE_URL = "https://bookjeok.com/logo-og-sketch.png";

interface ShareButtonProps {
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  className?: string;
  showLabel?: boolean;
}

/**
 * 공유 버튼 컴포넌트
 * - 카카오톡 공유
 * - 트위터(X) 공유
 * - 링크 복사
 */
export const ShareButton = ({
  title,
  description,
  imageUrl,
  url,
  className,
  showLabel = false,
}: ShareButtonProps) => {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  const shareUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  const initKakao = () => {
    const appKey = config.NEXT_PUBLIC_KAKAO_APP_KEY;

    if (!appKey) {
      return;
    }

    if (window.Kakao && !window.Kakao.isInitialized()) {
      try {
        window.Kakao.init(appKey);
        setKakaoReady(true);
      } catch {
        // 초기화 실패 시 조용히 실패
      }
    } else if (window.Kakao?.isInitialized()) {
      setKakaoReady(true);
    }
  };

  // 카카오 SDK 초기화
  useEffect(() => {
    if (typeof window !== "undefined" && window.Kakao) {
      initKakao();
    }
  }, []);

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t("toast.copied"));
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch {
      toast.error(t("toast.copy_failed"));
    }
  };

  // 트위터(X) 공유
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
    setIsOpen(false);
  };

  // 카카오톡 공유
  const handleKakaoShare = () => {
    if (!window.Kakao || !kakaoReady) {
      toast.error(t("toast.kakao_loading"));
      return;
    }

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description: description || t("actions.view_more"),
        imageUrl: imageUrl || FALLBACK_SHARE_IMAGE_URL,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: t("actions.view_more"),
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });
    setIsOpen(false);
  };

  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={initKakao}
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full",
              showLabel ? "h-8 px-3 gap-1.5" : "h-8 w-8 p-0",
              className,
            )}
            aria-label={showLabel ? undefined : t("aria.share")}
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
            {showLabel && <span className="text-xs">{t("actions.share")}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="center">
          <div className="flex gap-1">
            {/* 카카오톡 */}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full hover:bg-yellow-100"
              onClick={handleKakaoShare}
              title={t("aria.share_kakao")}
              aria-label={t("aria.share_kakao")}
            >
              <MessageCircle
                className="w-4 h-4 text-yellow-600"
                aria-hidden="true"
              />
            </Button>

            {/* 트위터(X) */}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full hover:bg-black hover:text-white"
              onClick={handleTwitterShare}
              title={t("aria.share_x")}
              aria-label={t("aria.share_x")}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>

            {/* 링크 복사 */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 rounded-full transition-colors",
                copied
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "hover:bg-stone-100",
              )}
              onClick={handleCopyLink}
              title={t("aria.copy_link")}
              aria-label={
                copied ? t("aria.copy_link_done") : t("aria.copy_link")
              }
            >
              <AnimatedCopyCheck copied={copied} size={16} />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};
