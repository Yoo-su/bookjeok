import {
  SaleStatus,
  TradeMethod,
  type User,
  userKeys,
  type WishlistItem,
} from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";

import { WishlistList } from "./index";

const bookItem = (index: number): WishlistItem => {
  const book = SAMPLE_BOOKS[index];
  return {
    id: 100 + index,
    book: {
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      description: book.memo ?? "",
      image: book.image ?? "",
      discount: "16200",
      pubdate: "2024-03-01",
    },
    usedBookSale: null,
    createdAt: "2026-09-28T10:00:00.000Z",
  } as WishlistItem;
};

const saleItem = (index: number): WishlistItem => {
  const book = SAMPLE_BOOKS[index];
  return {
    id: 200 + index,
    book: null,
    usedBookSale: {
      id: 200 + index,
      title: `${book.title} 깨끗하게 읽었어요`,
      price: 9000,
      status: SaleStatus.FOR_SALE,
      tradeMethod: TradeMethod.BOTH,
      city: "서울",
      district: "마포구",
      content: "",
      imageUrls: [],
      createdAt: "2026-09-28T11:00:00.000Z",
      updatedAt: "2026-09-28T11:00:00.000Z",
      viewCount: 3,
      user: {
        id: 3,
        nickname: "판매자",
        handle: "seller",
        profileImageUrl: null,
      },
      book: {
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        description: "",
        image: book.image ?? "",
        discount: "16200",
      },
    },
    createdAt: "2026-09-28T11:00:00.000Z",
  } as WishlistItem;
};

/** 서버 대신 캐시를 고쳐 찜 해제·추가를 흉내 낸다 */
function WishlistPlayground() {
  const [client] = useState(() => {
    const c = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    c.setQueryData<WishlistItem[]>(userKeys.wishlist.queryKey, [
      bookItem(0),
      saleItem(1),
      bookItem(2),
      bookItem(3),
    ]);
    return c;
  });
  const [next, setNext] = useState(4);

  const update = (fn: (items: WishlistItem[]) => WishlistItem[]) =>
    client.setQueryData<WishlistItem[]>(userKeys.wishlist.queryKey, (old) =>
      fn(old ?? []),
    );

  return (
    <QueryClientProvider client={client}>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            className="rounded-md border border-stone-200 px-2.5 py-1.5"
            onClick={() => update((items) => items.slice(1))}
          >
            맨 위 찜 해제
          </button>
          <button
            type="button"
            className="rounded-md border border-stone-200 px-2.5 py-1.5"
            onClick={() => {
              update((items) => [bookItem(next), ...items]);
              setNext((n) => n + 1);
            }}
          >
            도서 하나 찜
          </button>
        </div>
        <WishlistList />
      </div>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/User/WishlistList",
  component: WishlistPlayground,
  parameters: { layout: "padded" },
  beforeEach: () => {
    useAuthStore.setState({
      user: { id: 1, nickname: "미리보기" } as unknown as User,
    });
  },
} satisfies Meta<typeof WishlistPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * - 찜을 해제하면 카드가 사라지고 아래 카드가 그 자리로 당겨진다
 * - 탭 옆 개수는 바뀐 자리만 굴러가고, 탭을 바꾸면 선택 표시가 미끄러진다
 * - 탭을 바꿀 때는 목록을 새로 그려 카드가 한꺼번에 움직이지 않는다
 */
export const Interactions: Story = {};
