"use client";

import { PenSquare } from "lucide-react";
import { useRouter } from "next/navigation";

import { WishlistButton } from "@/features/user/components/wishlist-button";
import { Button } from "@/shared/components/shadcn/button";

import { BookInfo as BookType } from "../../types";

interface BookActionsProps {
  isbn: string;
  book: BookType;
}

export const BookActions = ({ isbn, book }: BookActionsProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        size="lg"
        className="w-full sm:w-auto"
        onClick={() => router.push(`/book/${isbn}/sell`)}
      >
        <PenSquare className="w-4 h-4 mr-2" />
        중고책 판매글 작성
      </Button>
      <WishlistButton
        type="BOOK"
        id={isbn}
        bookData={book}
        className="w-full sm:w-auto border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 rounded-md"
      />
    </div>
  );
};
