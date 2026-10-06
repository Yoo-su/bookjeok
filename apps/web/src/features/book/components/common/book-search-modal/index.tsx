"use client";

import { BookInfo } from "@bookjeok/core";
import { useInfiniteBookSearch } from "@bookjeok/react-query";
import debounce from "lodash/debounce";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";

import { Loader2, Search } from "@/shared/components/icons/iconsax";
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

interface BookSearchModalProps {
  onSelect: (book: BookInfo) => void;
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
  const t = useTranslations("book.search_modal");
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
    [],
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

  const handleSelect = (book: BookInfo) => {
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
        {trigger || <Button variant="outline">{t("trigger")}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-xl">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {t("title")}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-2 shrink-0">
          <div className="relative flex items-center">
            <Search
              className="absolute left-4 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary"
              aria-hidden="true"
            />
            <Input
              placeholder={t("placeholder")}
              defaultValue=""
              onChange={handleSearchChange}
              className="pl-12 h-14 text-lg bg-muted/30 border-none shadow-inner focus-visible:ring-0 focus-visible:bg-muted/50 rounded-2xl transition-all"
              aria-label={t("aria_label")}
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
                  {t("loading")}
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
                <p className="font-medium">{t("error_title")}</p>
                <p className="text-sm opacity-80 mt-1">{t("error_desc")}</p>
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
                    {t("empty_prompt_title")}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {t("empty_prompt_desc")}
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
                    {t("no_results_title")}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {t("no_results_desc")}
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
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(book);
                      }
                    }}
                    aria-label={book.title}
                    className="group flex items-start gap-4 p-3 rounded-xl cursor-pointer border border-transparent hover:border-border/50 hover:shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-border transition-all"
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
                        {book.description || t("no_description")}
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
