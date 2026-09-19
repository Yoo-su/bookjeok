import { SaleStatus, UsedBookSale } from "@bookjeok/core";

import { JsonLd } from "@/shared/components/json-ld";

interface BookSaleJsonLdProps {
  sale: UsedBookSale;
  locale?: string;
}

/**
 * 중고책 판매글의 구조화 데이터 (JSON-LD)
 * Google 리치 스니펫에 가격, 재고 상태 등을 노출하기 위한 Product 스키마
 */
export function BookSaleJsonLd({ sale, locale = "ko" }: BookSaleJsonLdProps) {
  // 판매 상태에 따른 availability 매핑
  const getAvailability = (status: string) => {
    switch (status) {
      case SaleStatus.FOR_SALE:
        return "https://schema.org/InStock";
      case SaleStatus.RESERVED:
        return "https://schema.org/LimitedAvailability";
      case SaleStatus.SOLD:
        return "https://schema.org/SoldOut";
      default:
        return "https://schema.org/OutOfStock";
    }
  };

  // book 관계가 빠진 응답이 실제로 나간 적이 있다. 구조화 데이터 한 블록이 비는 것과
  // 페이지 전체가 500이 되는 것은 무게가 다르다. 500은 ISR에 안 남아 매 요청 재렌더된다.
  const book = sale.book;
  const imageUrls = Array.isArray(sale.imageUrls) ? sale.imageUrls : [];
  const fallbackImages = book?.image ? [book.image] : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: sale.title,
    description:
      sale.content ||
      (book ? `${book.title} - ${book.author}` : sale.title) ||
      "",
    image: imageUrls.length > 0 ? imageUrls : fallbackImages,
    ...(book?.isbn && { gtin13: book.isbn }), // Google 쇼핑 연동을 위한 ISBN-13 바인딩
    url: `https://bookjeok.com/${locale}/book/sales/${sale.id}`, // Canonical URL 연동
    offers: {
      "@type": "Offer",
      price: sale.price,
      priceCurrency: "KRW",
      availability: getAvailability(sale.status),
      seller: {
        "@type": "Person",
        name: sale.user?.nickname || "bookjeok",
      },
      itemCondition: "https://schema.org/UsedCondition",
      areaServed: {
        "@type": "Place",
        name: `${sale.city} ${sale.district}`,
      },
    },
    // 책 정보 연결
    ...(book && {
      isRelatedTo: {
        "@type": "Book",
        name: book.title,
        author: {
          "@type": "Person",
          name: book.author,
        },
        isbn: book.isbn,
        image: book.image,
      },
    }),
  };

  return <JsonLd data={jsonLd} />;
}
