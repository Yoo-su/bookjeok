import "@/styles/globals.css";
import "@/styles/swiper.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Nanum_Gothic } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";

import { Toaster } from "@/shared/components/shadcn/sonner";
import { ChatProvider } from "@/shared/providers/chat-provider";
import { QueryProvider } from "@/shared/providers/query-provider";
import { SocketProvider } from "@/shared/providers/socket-provider";
import UserProvider from "@/shared/providers/user-provider";

// SEO를 위한 기본 메타데이터 객체
export const metadata: Metadata = {
  metadataBase: new URL("https://bookjeok.com"),
  title: {
    template: "%s | bookjeok", // 페이지별 제목이 %s 위치에 들어갑니다.
    default: "bookjeok - 중고책 거래와 리뷰를 한곳에", // 기본 제목
  },
  applicationName: "bookjeok",
  appleWebApp: {
    title: "bookjeok",
  },
  description:
    "bookjeok(북적)에서 중고 서적을 거래하고 솔직한 리뷰를 나눠보세요.",
  keywords: [
    "bookjeok",
    "북적",
    "중고책",
    "중고서적",
    "책거래",
    "중고책 거래",
    "독서",
    "서평",
    "북리뷰",
    "독서모임",
    "공연",
    "전시",
    "문화예술",
    "지식공유",
    "커뮤니티",
  ],
  openGraph: {
    title: "bookjeok - 책과 지식의 선순환",
    description:
      "다양한 문화 예술 정보를 탐색하고, 중고 서적을 거래하며 지식의 가치를 발견하는 공간입니다.",
    url: "https://bookjeok.com",
    siteName: "bookjeok",
    images: [
      {
        url: "/imgs/bookjeok.png",
        width: 1200,
        height: 630,
        alt: "bookjeok - 책과 지식의 선순환",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "bookjeok - 책과 지식의 선순환",
    description:
      "공연, 전시, 중고 서적 거래를 한 곳에서. 당신의 문화 생활을 업그레이드하세요.",
    images: ["/imgs/bookjeok.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: {
      url: "/logo.svg",
      type: "image/svg+xml",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "04FIlPfM3tjBU80tzoVObOuhIYffXxg0AzUK8ZuL41s",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "bookjeok",
      alternateName: ["북적", "bookjeok"],
      url: "https://bookjeok.com",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://bookjeok.com/book/search?keyword={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SiteNavigationElement",
      name: "중고마켓",
      url: "https://bookjeok.com/book/market",
    },
    {
      "@type": "SiteNavigationElement",
      name: "도서리뷰",
      url: "https://bookjeok.com/review",
    },
    {
      "@type": "SiteNavigationElement",
      name: "도서검색",
      url: "https://bookjeok.com/book/search",
    },
  ],
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
        <Toaster position="bottom-center" />
        <Toaster position="bottom-center" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
