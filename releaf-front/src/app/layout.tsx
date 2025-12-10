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
  metadataBase: new URL("https://releaf-hub.vercel.app"),
  title: {
    template: "%s | ReLeaf", // 페이지별 제목이 %s 위치에 들어갑니다.
    default: "ReLeaf - 책과 지식의 선순환, 중고책 거래 및 독서 커뮤니티", // 기본 제목
  },
  applicationName: "ReLeaf",
  appleWebApp: {
    title: "ReLeaf",
  },
  description:
    "ReLeaf(릴리프)에서 중고 서적을 거래하고 공연, 전시 정보를 확인하세요. 독서 모임과 리뷰를 통해 지식의 선순환을 만드는 문화 커뮤니티입니다.",
  keywords: [
    "ReLeaf",
    "릴리프",
    "릴리프 중고책",
    "릴리프 중고서적",
    "릴리프 중고 서적",
    "릴리프 도서리뷰",
    "릴리프 도서 리뷰",
    "릴리프 책리뷰",
    "릴리프 독후감",
    "릴리프 독서모임",
    "ReLeaf 중고책",
    "ReLeaf 중고서적",
    "ReLeaf 중고 서적",
    "ReLeaf 도서리뷰",
    "ReLeaf 도서 리뷰",
    "ReLeaf 책리뷰",
    "ReLeaf 독후감",
    "ReLeaf 독서모임",
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
    title: "ReLeaf - 책과 지식의 선순환",
    description:
      "다양한 문화 예술 정보를 탐색하고, 중고 서적을 거래하며 지식의 가치를 발견하는 공간입니다.",
    url: "https://releaf-hub.vercel.app",
    siteName: "ReLeaf",
    images: [
      {
        url: "/imgs/releaf.png",
        width: 1200,
        height: 630,
        alt: "ReLeaf - 책과 지식의 선순환",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReLeaf - 책과 지식의 선순환",
    description:
      "공연, 전시, 중고 서적 거래를 한 곳에서. 당신의 문화 생활을 업그레이드하세요.",
    images: ["/imgs/releaf.png"],
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
      name: "ReLeaf",
      alternateName: ["릴리프", "ReLeaf Hub"],
      url: "https://releaf-hub.vercel.app",
      potentialAction: {
        "@type": "SearchAction",
        target:
          "https://releaf-hub.vercel.app/book/search?keyword={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SiteNavigationElement",
      name: "중고마켓",
      url: "https://releaf-hub.vercel.app/book/market",
    },
    {
      "@type": "SiteNavigationElement",
      name: "도서리뷰",
      url: "https://releaf-hub.vercel.app/review",
    },
    {
      "@type": "SiteNavigationElement",
      name: "도서검색",
      url: "https://releaf-hub.vercel.app/book/search",
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
