import {
  SaleStatus,
  TradeMethod,
  WishlistItem as WishlistItemType,
} from "@bookjeok/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WishlistItem } from "../components/wishlist/wishlist-item";
import { WishlistList } from "../components/wishlist/wishlist-list";
import { WishlistSkeleton } from "../components/wishlist/wishlist-list/skeleton";

const mockWishlistData: WishlistItemType[] = [
  {
    id: 1,
    book: {
      isbn: "9788966260959",
      title: "Clean Code",
      author: "로버트 C. 마틴",
      publisher: "인사이트",
      pubdate: "2013-12-24",
      description: "애자일 소프트웨어 장인 정신",
      image: "https://example.com/cover1.jpg",
      discount: "29700",
      link: "https://example.com",
    } as any,
    usedBookSale: null,
    createdAt: "2026-08-28T10:00:00.000Z",
  },
  {
    id: 2,
    book: null,
    usedBookSale: {
      id: 10,
      title: "리팩터링 2판 중고 판매",
      price: 20000,
      status: SaleStatus.FOR_SALE,
      tradeMethod: TradeMethod.BOTH,
      city: "서울",
      district: "강남구",
      content: "깨끗하게 봤습니다",
      imageUrls: ["https://example.com/sale1.jpg"],
      createdAt: "2026-08-28T11:00:00.000Z",
      updatedAt: "2026-08-28T11:00:00.000Z",
      viewCount: 3,
      user: {
        id: 1,
        nickname: "판매자1",
        handle: "seller1",
        profileImageUrl: null,
      },
      book: {
        isbn: "9788966262533",
        title: "리팩터링 2판",
        author: "마틴 파울러",
        image: "https://example.com/cover2.jpg",
      } as any,
    },
    createdAt: "2026-08-28T11:00:00.000Z",
  },
];

let queryReturn = {
  data: mockWishlistData as WishlistItemType[] | undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

vi.mock("@bookjeok/react-query", () => ({
  useMyWishlistQuery: () => queryReturn,
  useWishlistStatusQuery: () => ({ data: true, isLoading: false }),
}));

vi.mock("@/features/user/mutations", () => ({
  useAddToWishlistMutation: () => ({ mutate: vi.fn() }),
  useRemoveFromWishlistMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: () => ({
    id: 1,
    nickname: "테스트유저",
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "tabs.all": "전체",
      "tabs.book": "도서",
      "tabs.sale": "중고거래",
      "empty.title": "위시리스트가 비어있습니다.",
      "empty.desc": "마음에 드는 책이나 판매글을 찜해보세요!",
      "empty.button": "도서 둘러보기",
      "empty_tab.book_title": "찜한 도서가 없습니다.",
      "empty_tab.book_desc": "읽고 싶거나 관심 있는 도서를 찜해보세요!",
      "empty_tab.sale_title": "찜한 중고 판매글이 없습니다.",
      "empty_tab.sale_desc": "관심 있는 중고책 판매글을 찜해보세요!",
      error_title: "위시리스트를 불러오지 못했습니다",
      error_desc: "네트워크 연결을 확인한 후 다시 시도해주세요.",
      retry: "다시 시도",
      type_book: "도서",
      type_sale: "중고거래",
      view_detail: "상세보기",
      sold_out: "판매완료",
      sale_ended: "판매 종료",
      won: "원",
      FOR_SALE: "판매중",
      RESERVED: "예약중",
      SOLD: "판매완료",
      DIRECT_ONLY: "직거래만",
      DELIVERY_ONLY: "택배만",
      BOTH: "직거래/택배",
    };
    return map[key] || key;
  },
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({ href, children, ...props }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

describe("WishlistItem", () => {
  it("renders book item correctly", () => {
    render(<WishlistItem item={mockWishlistData[0]} />);

    expect(screen.getByText("Clean Code")).toBeInTheDocument();
    expect(screen.getByText(/로버트 C. 마틴/)).toBeInTheDocument();
    expect(screen.getByText(/인사이트/)).toBeInTheDocument();
    expect(screen.getByText("도서")).toBeInTheDocument();
    expect(screen.getByText("상세보기")).toBeInTheDocument();
  });

  it("renders used book sale item correctly", () => {
    render(<WishlistItem item={mockWishlistData[1]} />);

    expect(screen.getByText("리팩터링 2판 중고 판매")).toBeInTheDocument();
    expect(screen.getByText("20,000")).toBeInTheDocument();
    expect(screen.getByText("중고거래")).toBeInTheDocument();
    expect(screen.getByText("판매중")).toBeInTheDocument();
    expect(screen.getByText("상세보기")).toBeInTheDocument();
  });
});

describe("WishlistList", () => {
  beforeEach(() => {
    queryReturn = {
      data: mockWishlistData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
  });

  it("renders tab filters with counts and displays all items", () => {
    render(<WishlistList />);

    expect(screen.getByRole("button", { name: /전체/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /도서/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /중고거래/ }),
    ).toBeInTheDocument();

    expect(screen.getByText("Clean Code")).toBeInTheDocument();
    expect(screen.getByText("리팩터링 2판 중고 판매")).toBeInTheDocument();
  });

  it("filters items by book tab", () => {
    render(<WishlistList />);

    const bookTab = screen.getByRole("button", { name: /도서/ });
    fireEvent.click(bookTab);

    expect(screen.getByText("Clean Code")).toBeInTheDocument();
    expect(
      screen.queryByText("리팩터링 2판 중고 판매"),
    ).not.toBeInTheDocument();
  });

  it("filters items by sale tab", () => {
    render(<WishlistList />);

    const saleTab = screen.getByRole("button", { name: /중고거래/ });
    fireEvent.click(saleTab);

    expect(screen.queryByText("Clean Code")).not.toBeInTheDocument();
    expect(screen.getByText("리팩터링 2판 중고 판매")).toBeInTheDocument();
  });

  it("renders empty state when wishlist is empty", () => {
    queryReturn = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };

    render(<WishlistList />);

    expect(screen.getByText("위시리스트가 비어있습니다.")).toBeInTheDocument();
    expect(screen.getByText("도서 둘러보기")).toBeInTheDocument();
  });

  it("마지막 찜을 해제하면 항목이 빠지는 움직임을 거쳐 빈 안내로 바뀐다", async () => {
    queryReturn = { ...queryReturn, data: [mockWishlistData[0]] };
    const { rerender } = render(<WishlistList />);

    queryReturn = { ...queryReturn, data: [] };
    rerender(<WishlistList />);

    // 빠지는 동안에는 항목과 빈 안내가 함께 있다
    expect(screen.getByText("Clean Code")).toBeInTheDocument();
    expect(screen.getByText("위시리스트가 비어있습니다.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Clean Code")).not.toBeInTheDocument(),
    );
  });

  it("renders error state and handles retry", () => {
    const mockRefetch = vi.fn();
    queryReturn = {
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    };

    render(<WishlistList />);

    expect(
      screen.getByText("위시리스트를 불러오지 못했습니다"),
    ).toBeInTheDocument();

    const retryBtn = screen.getByText("다시 시도");
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });
});

describe("WishlistSkeleton", () => {
  it("renders skeleton cards", () => {
    const { container } = render(<WishlistSkeleton />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });
});
