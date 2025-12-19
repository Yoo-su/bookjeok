"use client";

import { Check, Link2, MessageCircle, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/shadcn/popover";
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
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  const shareUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  // 카카오 SDK 초기화
  useEffect(() => {
    const initKakao = () => {
      const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

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

    // 카카오 SDK 스크립트 로드
    if (typeof window !== "undefined") {
      if (window.Kakao) {
        initKakao();
      } else {
        // 이미 스크립트가 로드 중인지 확인
        const existingScript = document.querySelector(
          'script[src*="kakao_js_sdk"]'
        );
        if (existingScript) {
          existingScript.addEventListener("load", initKakao);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
        script.crossOrigin = "anonymous";
        script.async = true;
        script.onload = initKakao;
        document.head.appendChild(script);
      }
    }
  }, []);

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("링크가 복사되었습니다");
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch {
      toast.error("복사에 실패했습니다");
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
      toast.error(
        "카카오 공유를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description: description || "북적에서 확인해보세요!",
        imageUrl: imageUrl || "https://bookjeok.vercel.app/og-image.png",
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: "자세히 보기",
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full",
            showLabel ? "h-8 px-3 gap-1.5" : "h-8 w-8 p-0",
            className
          )}
        >
          <Share2 className="w-4 h-4" />
          {showLabel && <span className="text-xs">공유하기</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="flex gap-1">
          {/* 카카오톡 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-full hover:bg-yellow-100"
            onClick={handleKakaoShare}
            title="카카오톡으로 공유"
          >
            <MessageCircle className="w-4 h-4 text-yellow-600" />
          </Button>

          {/* 트위터(X) */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-full hover:bg-black hover:text-white"
            onClick={handleTwitterShare}
            title="X(트위터)에 공유"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* 링크 복사 */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 w-9 p-0 rounded-full",
              copied ? "bg-emerald-100 text-emerald-600" : "hover:bg-stone-100"
            )}
            onClick={handleCopyLink}
            title="링크 복사"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
