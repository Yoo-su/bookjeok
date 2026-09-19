import { Metadata } from "next";

export const generateGlobalMetadata = (
  t: (key: string) => string,
  locale: string = "ko",
): Metadata => {
  // 한국어 외 로케일(/en)은 검색에 노출하지 않는다.
  //
  // robots.txt로 막지 않는 이유: 수집을 차단하면 크롤러가 이 noindex를 읽을 수
  // 없어 이미 색인된 페이지가 그대로 남는다. 수집은 허용하고 noindex로
  // 걷어내게 한다.
  const isSearchExcludedLocale = locale !== "ko";
  const homeImage = `/og/${locale === "en" ? "en" : "ko"}-home.png`;
  return {
    metadataBase: new URL("https://bookjeok.com"),
    title: {
      template: t("meta.template_title"),
      default: t("meta.default_title"),
    },
    applicationName: "Bookjeok", // Brand name usually stays same or simple transliteration
    appleWebApp: {
      title: "Bookjeok",
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/logo-square-sketch.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/logo-square-sketch.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/logo-square-sketch.png", sizes: "512x512", type: "image/png" },
      ],
    },
    description: t("meta.description"),
    keywords: t("meta.keywords").split(","),
    alternates: {
      types: {
        "application/rss+xml": [
          { url: "/rss.xml", title: t("meta.rss_title") },
        ],
      },
    },
    openGraph: {
      title: t("meta.og.title"),
      description: t("meta.og.description"),
      url: "https://bookjeok.com",
      siteName: "Bookjeok",
      images: [
        {
          url: homeImage,
          width: 1200,
          height: 630,
          alt: t("meta.default_title"),
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.twitter.title"),
      description: t("meta.twitter.description"),
      images: [homeImage],
    },
    robots:
      process.env.VERCEL_ENV === "preview" || isSearchExcludedLocale
        ? { index: false, follow: false }
        : {
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
      other: {
        "naver-site-verification": "3f5c1201020029acfa61cba1ea4057dd25e1e0b0",
      },
    },
  };
};

type CreatePageMetadataProps = {
  title: string;
  description: string;
  imageUrl?: string | null;
  locale?: string;
  path?: string;
  noIndex?: boolean;
  absoluteTitle?: boolean;
};

export const createPageMetadata = ({
  title,
  description,
  imageUrl,
  locale = "ko",
  path,
  noIndex = false,
  absoluteTitle = false,
}: CreatePageMetadataProps): Metadata => {
  const pageImage = (
    {
      "": "home",
      "/": "home",
      "/book/market": "market",
      "/book/reviews": "reviews",
      "/lounge": "lounge",
    } as Record<string, string>
  )[path ?? "__default"];
  const image =
    imageUrl ||
    (pageImage
      ? `/og/${locale === "en" ? "en" : "ko"}-${pageImage}.png`
      : "/logo-og-sketch.png");
  const images = [
    { url: image, alt: title, ...(!imageUrl && { width: 1200, height: 630 }) },
  ];
  const currentLocale = locale || "ko";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const fullPath = `/${currentLocale}${cleanPath}`;
  const brandName = currentLocale === "en" ? "Bookjeok" : "북적";

  // 이미 타이틀에 브랜드명이 포함되어 있거나 absoluteTitle이 명시된 경우
  const isAbsolute =
    absoluteTitle ||
    title.includes("북적") ||
    title.includes("Bookjeok") ||
    cleanPath === "";

  const formattedOgTitle = isAbsolute ? title : `${title} | ${brandName}`;

  const metadata: Metadata = {
    metadataBase: new URL("https://bookjeok.com"),
    title: isAbsolute ? { absolute: title } : title,
    description,
    openGraph: {
      title: formattedOgTitle,
      description,
      images,
      siteName: "Bookjeok",
      type: "website",
      url: path !== undefined ? `https://bookjeok.com${fullPath}` : undefined,
    },
    twitter: {
      // 세로 도서 표지는 작은 카드, 가로 브랜드 카드·실물 사진은 큰 카드.
      card: image.includes("cdn.bookjeok.com/covers/")
        ? "summary"
        : "summary_large_image",
      title: formattedOgTitle,
      description,
      images,
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };

  if (path !== undefined) {
    // /en은 레이아웃에서 noindex 처리하므로 hreflang alternate에서 제외
    // (색인 제외 URL을 대체 언어판으로 제시하면 모순된 신호)
    metadata.alternates = {
      canonical: fullPath,
      languages: {
        ko: `/ko${cleanPath}`,
        "x-default": `/ko${cleanPath}`,
      },
    };
  }

  return metadata;
};
