"use client";

import { WishlistButton } from "@/features/user/components/wishlist-button";

import { BookInfo as BookType } from "../../types";

interface BookActionsProps {
  isbn: string;
  book: BookType;
}

export const BookActions = ({ isbn, book }: BookActionsProps) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <WishlistButton
        type="BOOK"
        id={isbn}
        bookData={book}
        className="w-full sm:w-auto border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 rounded-md"
      />
    </div>
  );
};
