import { BookInfo, UsedBookSale } from "../book/types";

export interface WishlistItem {
  id: number;
  book: BookInfo | null;
  usedBookSale: UsedBookSale | null;
  createdAt: string;
}
