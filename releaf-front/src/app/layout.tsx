import "@/styles/globals.css";
import "swiper/css";
import "swiper/css/scrollbar";
import "swiper/css/autoplay";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Nanum_Gothic } from "next/font/google";
import localFont from "next/font/local";

import { ChatProvider } from "@/shared/providers/chat-provider";
import { QueryProvider } from "@/shared/providers/query-provider";
import { SocketProvider } from "@/shared/providers/socket-provider";
import UserProvider from "@/shared/providers/user-provider";

// SEO를 위한 기본 메타데이터 객체
export const metadata: Metadata = {
  title: {
    template: "%s | ReLeaf", // 페이지별 제목이 %s 위치에 들어갑니다.
    default: "ReLeaf - 책과 지식의 선순환", // 기본 제목
  },
  description:
    "공연, 전시 정보부터 중고 서적 거래까지. ReLeaf에서 당신의 문화적 경험과 지식의 선순환을 만들어보세요.",
  keywords: [
    "중고서적",
    "공연",
    "전시",
    "문화예술",
    "책거래",
    "채팅",
    "ReLeaf",
  ],
  openGraph: {
    title: "ReLeaf - 책과 지식의 선순환",
    description:
      "다양한 문화 예술 정보를 탐색하고, 중고 서적을 거래하며 지식의 가치를 발견하는 공간입니다.",
    url: "http://releaf-hub.vercel.app", // 실제 서비스 URL (예시)
    siteName: "ReLeaf",
    images: [
      {
        url: "/imgs/og-image.png", // TODO: Update when image is ready
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReLeaf - 책과 지식의 선순환",
    description:
      "공연, 전시, 중고 서적 거래를 한 곳에서. 당신의 문화 생활을 업그레이드하세요.",
    images: ["/imgs/og-image.png"], // 트위터 카드 이미지 경로
  },
  icons: {
    icon: "/logo.svg",
  },
};

const nanum_gothic = Nanum_Gothic({
  weight: ["400", "700", "800"],
  variable: "--font-nanum-gothic",
  display: "swap",
  preload: false,
});

const pretendard = localFont({
  src: "../../public/fonts/pretendard/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  preload: false,
});

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${nanum_gothic.variable}`}
    >
      <body style={{ fontFamily: "var(--font-pretendard)" }}>
        <QueryProvider>
          <UserProvider>
            <SocketProvider namespace="/chat">
              <ChatProvider>{children}</ChatProvider>
            </SocketProvider>
          </UserProvider>

          <Analytics />
          <SpeedInsights />
        </QueryProvider>
      </body>
    </html>
  );
}
