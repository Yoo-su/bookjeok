"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import { PATHS } from "@/shared/constants/paths";

import { UsedBookSale } from "../../types";

interface BookInfoCardProps {
  sale: UsedBookSale;
}

export const BookInfoCard = ({ sale }: BookInfoCardProps) => {
  return (
    <Link href={PATHS.BOOK_DETAIL(sale.book.isbn)}>
      <Card className="transition-shadow bg-gray-50 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">도서 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative w-20 h-[120px] shrink-0">
              <Image
                src={sale.book.image}
                alt={sale.book.title}
                fill
                sizes="80px"
                className="object-cover rounded-md"
              />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-bold text-gray-800">{sale.book.title}</p>
              <p className="text-gray-600">저자: {sale.book.author}</p>
              <p className="text-gray-600">출판사: {sale.book.publisher}</p>
              <p className="text-gray-500 pt-1 line-clamp-2">
                {sale.book.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
