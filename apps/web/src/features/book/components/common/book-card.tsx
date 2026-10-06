"use client";

import { BaseBookInfo, BookInfo } from "@bookjeok/core";
import {
  motion,
  type MotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import Image from "next/image";
import React, { createContext, ReactNode, useContext } from "react";

import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

interface BookCardContextValue {
  book: BaseBookInfo | BookInfo;
  /** 마우스를 올렸을 때 표지가 들리고 포인터 쪽으로 기우는 값 */
  tilt: {
    x: MotionValue<number>;
    y: MotionValue<number>;
    lift: MotionValue<number>;
  };
}

const TILT_SPRING = { stiffness: 300, damping: 22, mass: 0.5 };
/** 가장자리에서 기우는 최대 각도(도) */
const MAX_TILT = 7;

const BookCardContext = createContext<BookCardContextValue | null>(null);

const useBookCardContext = () => {
  const context = useContext(BookCardContext);
  if (!context) {
    throw new Error("BookCard subcomponents must be used within BookCard.Root");
  }
  return context;
};

interface BookCardRootProps {
  book: BaseBookInfo | BookInfo;
  children: ReactNode;
  className?: string;
  href?: string;
  asLink?: boolean;
}

function BookCardRoot({
  book,
  children,
  className,
  href,
  asLink = true,
}: BookCardRootProps) {
  const linkHref = href || PATHS.BOOK_DETAIL(book.isbn);
  const reduceMotion = useReducedMotion();
  const tilt = {
    x: useSpring(0, TILT_SPRING),
    y: useSpring(0, TILT_SPRING),
    lift: useSpring(0, TILT_SPRING),
  };

  // 터치의 가짜 hover에는 걸지 않는다
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    tilt.x.set(-py * MAX_TILT);
    tilt.y.set(px * MAX_TILT);
    tilt.lift.set(-6);
  };
  const handlePointerLeave = () => {
    tilt.x.set(0);
    tilt.y.set(0);
    tilt.lift.set(0);
  };

  const inner = (
    <div
      className={cn("group block", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>
  );

  return (
    <BookCardContext.Provider value={{ book, tilt }}>
      {asLink ? (
        <Link href={linkHref} prefetch={false} className="block">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </BookCardContext.Provider>
  );
}

interface BookCardCoverProps {
  className?: string;
  children?: ReactNode;
}

function BookCardCover({ className, children }: BookCardCoverProps) {
  const { book, tilt } = useBookCardContext();

  return (
    <motion.div
      style={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        y: tilt.lift,
        transformPerspective: 700,
      }}
      className={cn(
        "relative w-full aspect-3/4 overflow-hidden rounded-sm bg-stone-100 shadow-md transition-shadow duration-300 ease-out pointer-fine:group-hover:shadow-lg",
        className,
      )}
    >
      <Image
        src={book.image || ""}
        alt={book.title}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        className="object-cover"
        unoptimized
      />
      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/0 transition-colors duration-300 pointer-fine:group-hover:bg-black/8" />
      {children}
    </motion.div>
  );
}

interface BookCardMetaProps {
  className?: string;
  children?: ReactNode;
}

function BookCardMeta({ className, children }: BookCardMetaProps) {
  return <div className={cn("mt-2.5 px-0.5", className)}>{children}</div>;
}

interface BookCardTitleProps {
  className?: string;
}

function BookCardTitle({ className }: BookCardTitleProps) {
  const { book } = useBookCardContext();

  return (
    <h3
      className={cn(
        "text-sm font-medium text-stone-800 line-clamp-1 transition-colors duration-200 group-hover:text-stone-950",
        className,
      )}
    >
      {book.title}
    </h3>
  );
}

interface BookCardAuthorProps {
  className?: string;
}

function BookCardAuthor({ className }: BookCardAuthorProps) {
  const { book } = useBookCardContext();

  return (
    <p className={cn("mt-0.5 text-xs text-stone-400 truncate", className)}>
      {book.author}
    </p>
  );
}

interface BookCardActionProps {
  children: ReactNode;
  className?: string;
}

function BookCardAction({ children, className }: BookCardActionProps) {
  return (
    <div
      className={cn("mt-2", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}

// 도서 카드 스켈레톤
function BookCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("block", className)}>
      <div className="relative w-full aspect-3/4 overflow-hidden rounded-sm bg-stone-100 shadow-md animate-pulse" />
      <div className="mt-2.5 px-0.5 space-y-1.5">
        <Skeleton className="h-4 w-3/4 bg-stone-200/60" />
        <Skeleton className="h-3 w-1/2 bg-stone-200/40" />
      </div>
    </div>
  );
}

export interface FlatBookCardProps {
  book: BaseBookInfo | BookInfo;
  className?: string;
  href?: string;
  asLink?: boolean;
  action?: ReactNode;
}

/**
 * 기본 표준 도서 카드 컴포넌트입니다. (토스 하이브리드 패턴)
 * 커스텀이 필요할 경우 BookCard.Root, BookCard.Cover 등을 조합하여 확장할 수 있습니다.
 */
export function BookCard({
  book,
  className,
  href,
  asLink = true,
  action,
}: FlatBookCardProps) {
  return (
    <BookCardRoot book={book} className={className} href={href} asLink={asLink}>
      <BookCardCover />
      <BookCardMeta>
        <BookCardTitle />
        <BookCardAuthor />
        {action && <BookCardAction>{action}</BookCardAction>}
      </BookCardMeta>
    </BookCardRoot>
  );
}

BookCard.Root = BookCardRoot;
BookCard.Cover = BookCardCover;
BookCard.Meta = BookCardMeta;
BookCard.Title = BookCardTitle;
BookCard.Author = BookCardAuthor;
BookCard.Action = BookCardAction;
BookCard.Skeleton = BookCardSkeleton;
