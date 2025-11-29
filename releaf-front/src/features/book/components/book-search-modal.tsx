"use client";

import { Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import { Book } from "@/features/book/types";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/shadcn/dialog";
import { Input } from "@/shared/components/shadcn/input";
import { ScrollArea } from "@/shared/components/shadcn/scroll-area";

import { useInfiniteBookSearch } from "../queries";

interface BookSearchModalProps {
  onSelect: (book: Book) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const BookSearchModal = ({
  onSelect,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: BookSearchModalProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled
    ? setControlledOpen || (() => {})
    : setUncontrolledOpen;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { ref, inView } = useInView();

  // Debounce search query
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(e.target.value);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteBookSearch(debouncedQuery);

  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, fetchNextPage]);

  const handleSelect = (book: Book) => {
    onSelect(book);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">책 검색</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>책 검색</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border rounded-md px-3 shrink-0">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <Input
            placeholder="책 제목 또는 저자로 검색하세요"
            value={searchQuery}
            onChange={handleSearchChange}
            className="border-0 focus-visible:ring-0 px-0"
          />
        </div>
        <ScrollArea className="flex-1 min-h-0 mt-4 pr-4">
          {status === "pending" && isFetching && !isFetchingNextPage ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : status === "error" ? (
            <div className="text-center py-8 text-destructive">
              검색 중 오류가 발생했습니다.
            </div>
          ) : !debouncedQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              검색어를 입력해주세요.
            </div>
          ) : data?.pages[0].items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {data?.pages.flatMap((page) =>
                page.items.map((book, index) => (
                  <div
                    key={`${book.isbn}-${index}`}
                    className="flex items-start gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                    onClick={() => handleSelect(book)}
                  >
                    <div className="relative w-12 h-16 shrink-0 rounded overflow-hidden bg-muted">
                      <Image
                        src={book.image}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm line-clamp-1">
                        {book.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {book.author} | {book.publisher}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <div ref={ref} className="h-4" />
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
