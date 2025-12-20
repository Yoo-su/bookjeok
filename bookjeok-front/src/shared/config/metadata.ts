import type { Metadata } from "next";

// SEO를 위한 기본 메타데이터 객체
export const metadata: Metadata = {
  metadataBase: new URL("https://www.bookjeok.com"),
  title: {
    template: "%s | 북적", // 페이지별 제목이 %s 위치에 들어갑니다.
    default: "북적 - 도서 리뷰와 중고책 거래 플랫폼", // 기본 제목 (홈페이지용)
  },
  applicationName: "북적",
  appleWebApp: {
    title: "북적",
  },
  icons: {
    // favicon.ico는 app 폴더에서 자동 인식됨
    apple: "/logo.png",
  },
  description:
    "책과 사람을 잇는 북적. 솔직한 도서 리뷰를 공유하고, 중고책을 거래하며 새로운 독서 경험을 발견하세요.",
  keywords: [
    // 브랜드 키워드 (한글/영문 조합)
    "bookjeok",
    "북적",
    "북적 책리뷰",
    "북적 도서",
    "북적 도서리뷰",
    "북적 중고책",
    "북적 리뷰",
    "bookjeok 책리뷰",
    "bookjeok 도서",
    "bookjeok 도서리뷰",
    "bookjeok 중고책",
    "bookjeok 리뷰",
    // 핵심 서비스 키워드
    "책 리뷰",
    "도서 리뷰",
    "도서리뷰 사이트",
    "책 리뷰 사이트",
    "중고책",
    "중고 도서",
    "중고책 거래",
    "중고책 사이트",
    "중고 서적",
    // 독서 관련 키워드
    "독서 기록",
    "독서 노트",
    "책 추천",
    "베스트셀러",
    "신간 도서",
    // 커뮤니티 키워드
    "독서 커뮤니티",
    "북클럽",
    "독서모임",
  ],
  openGraph: {
    title: "북적 - 책과 사람을 잇는 독서 플랫폼",
    description:
      "솔직한 도서 리뷰를 공유하고 중고책을 거래하세요. 북적에서 나만의 독서 기록을 시작해보세요.",
    url: "https://bookjeok.com",
    siteName: "북적",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "북적 - 도서 리뷰와 중고책 거래 플랫폼",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "북적 - 책과 사람을 잇는 독서 플랫폼",
    description:
      "솔직한 도서 리뷰 공유, 중고책 거래까지. 북적에서 독서의 즐거움을 나눠보세요.",
    images: ["/logo.png"],
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
