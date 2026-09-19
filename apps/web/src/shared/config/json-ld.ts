export const getJsonLd = (
  t: (key: string) => string,
  locale: string = "ko",
) => {
  const siteUrl = `https://bookjeok.com/${locale}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: t("json_ld.name"),
        alternateName: ["북적", "bookjeok", "Bookjeok"],
        description: t("json_ld.description"),
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `https://bookjeok.com/${locale}/book/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: t("json_ld.name"),
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: "https://bookjeok.com/logo-square-sketch.png",
          width: "512",
          height: "512",
          encodingFormat: "image/png",
        },
      },
      {
        "@type": "SiteNavigationElement",
        name: t("json_ld.nav.market"),
        url: `https://bookjeok.com/${locale}/book/market`,
      },
      {
        "@type": "SiteNavigationElement",
        name: t("json_ld.nav.review"),
        url: `https://bookjeok.com/${locale}/book/reviews`,
      },
      {
        "@type": "SiteNavigationElement",
        name: t("json_ld.nav.search"),
        url: `https://bookjeok.com/${locale}/book/search`,
      },
      {
        "@type": "SiteNavigationElement",
        name: t("json_ld.nav.lounge"),
        url: `https://bookjeok.com/${locale}/lounge`,
      },
    ],
  };
};
