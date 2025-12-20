export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "북적",
      alternateName: ["북적", "bookjeok", "Bookjeok"],
      description:
        "책과 사람을 잇는 북적. 솔직한 도서 리뷰를 공유하고, 중고책을 거래하며 새로운 독서 경험을 발견하세요.",
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
