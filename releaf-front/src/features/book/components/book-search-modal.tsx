"use client";

import { AnimatePresence, motion } from "framer-motion";
import { debounce } from "lodash";
import { Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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

  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { ref, inView } = useInView();

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedQuery(value);
      }, 300),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
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

  const bookList = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data?.pages]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">책 검색</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-xl">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            책 검색
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-2 shrink-0">
          <div className="relative flex items-center">
            <Search
              className="absolute left-4 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary"
              aria-hidden="true"
            />
            <Input
              placeholder="책 제목, 저자 또는 출판사로 검색해보세요"
              defaultValue=""
              onChange={handleSearchChange}
              className="pl-12 h-14 text-lg bg-muted/30 border-none shadow-inner focus-visible:ring-0 focus-visible:bg-muted/50 rounded-2xl transition-all"
              aria-label="책 검색"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0 mt-2 px-6 pb-6">
          <AnimatePresence mode="wait">
            {status === "pending" && isFetching && !isFetchingNextPage ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">
                  책을 찾고 있어요...
                </p>
              </motion.div>
            ) : status === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 text-destructive"
              >
                <p className="font-medium">검색 중 오류가 발생했습니다.</p>
                <p className="text-sm opacity-80 mt-1">
                  잠시 후 다시 시도해주세요.
                </p>
              </motion.div>
            ) : !debouncedQuery ? (
              <motion.div
                key="empty-query"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                  <Search className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    어떤 책을 찾으시나요?
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    판매하거나 리뷰를 남길 책을 검색해주세요.
                  </p>
                </div>
              </motion.div>
            ) : bookList.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                  <Search className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    검색어를 확인하거나 다른 키워드로 시도해보세요.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-3 pt-2 pb-4"
              >
                {bookList.map((book, index) => (
                  <motion.div
                    key={`${book.isbn}-${index}`}
                    whileHover={{
                      backgroundColor: "rgba(0,0,0,0.02)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-start gap-4 p-3 rounded-xl cursor-pointer border border-transparent hover:border-border/50 hover:shadow-sm transition-all"
                    onClick={() => handleSelect(book)}
                  >
                    <div className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                      <Image
                        src={book.image}
                        alt={book.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {book.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {book.author} <span className="mx-1">·</span>{" "}
                        {book.publisher}
                      </p>
                      <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                        {book.description || "책 소개가 없습니다."}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
                <div ref={ref} className="h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
