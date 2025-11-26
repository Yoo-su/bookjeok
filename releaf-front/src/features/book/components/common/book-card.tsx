import Image from "next/image";
import Link from "next/link";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { BookInfo } from "../../types";

interface BookCardProps {
  book: BookInfo;
}

export const BookCard = ({ book }: BookCardProps) => {
  return (
    <Link href={`/book/${book.isbn}/detail`} className="group">
      <div className="relative w-full h-60 overflow-hidden bg-gray-100 rounded-lg shadow-md">
        <Image
          src={book.image.replace("?type=m1", "")}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600">
          {book.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500 truncate">{book.author}</p>
      </div>
    </Link>
  );
};

BookCard.Skeleton = function BookCardSkeleton() {
  return (
    <div className="animate-pulse">
      <Skeleton className="w-full h-60 rounded-lg" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4" />
        <Skeleton className="w-2/3 h-3" />
      </div>
    </div>
  );
};
