import { UsedBookSale } from "../types";

interface BookSaleJsonLdProps {
  sale: UsedBookSale;
}

/**
 * 중고책 판매글의 구조화 데이터 (JSON-LD)
 * Google 리치 스니펫에 가격, 재고 상태 등을 노출하기 위한 Product 스키마
 */
export function BookSaleJsonLd({ sale }: BookSaleJsonLdProps) {
  // 판매 상태에 따른 availability 매핑
  const getAvailability = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "https://schema.org/InStock";
      case "RESERVED":
        return "https://schema.org/LimitedAvailability";
      case "SOLD_OUT":
        return "https://schema.org/SoldOut";
      default:
        return "https://schema.org/InStock";
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: sale.title,
    description: sale.content || `${sale.book.title} - ${sale.book.author}`,
    image: sale.imageUrls.length > 0 ? sale.imageUrls : [sale.book.image],
    brand: {
      "@type": "Organization",
      name: "bookjeok",
    },
    offers: {
      "@type": "Offer",
      price: sale.price,
      priceCurrency: "KRW",
      availability: getAvailability(sale.status),
      seller: {
        "@type": "Person",
        name: sale.user.nickname,
      },
      itemCondition: "https://schema.org/UsedCondition",
      areaServed: {
        "@type": "Place",
        name: `${sale.city} ${sale.district}`,
      },
    },
    // 책 정보 연결
    isRelatedTo: {
      "@type": "Book",
      name: sale.book.title,
      author: {
        "@type": "Person",
        name: sale.book.author,
      },
      isbn: sale.book.isbn,
      image: sale.book.image,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
