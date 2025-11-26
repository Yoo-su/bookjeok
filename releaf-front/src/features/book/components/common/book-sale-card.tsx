import { Clock, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BorderBeam } from "@/shared/components/magicui/border-beam";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { formatPostDate } from "@/shared/utils/date";

import { UsedBookSale } from "../../types";
import { SaleStatusBadge } from "./sale-status-badge";

interface SaleCardProps {
  sale: UsedBookSale;
  idx: number;
}
export const BookSaleCard = ({ sale, idx }: SaleCardProps) => {
  const displayDate =
    sale.updatedAt > sale.createdAt ? sale.updatedAt : sale.createdAt;

  return (
    <Link href={`/book/sale/${sale.id}`} passHref>
      <Card className="relative group h-full w-full overflow-hidden duration-300 select-none">
        <CardContent className="p-0">
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={sale.imageUrls[0] || "/placeholder.jpg"}
              alt={sale.title}
              fill
              sizes="250px"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/250x192/e2e8f0/64748b?text=Image";
              }}
            />
            <SaleStatusBadge
              status={sale.status}
              className="absolute right-2 top-2"
            />
          </div>
          <div className="p-4 pb-0">
            <h3 className="truncate font-semibold text-gray-800">
              {sale.title}
            </h3>
            <p className="mt-2 text-xl font-bold text-emerald-600">
              {sale.price.toLocaleString()}원
            </p>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              <span>{formatPostDate(displayDate)}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span className="truncate">
                {sale.city} {sale.district}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t pt-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={sale.user.profileImageUrl || ""} />
                <AvatarFallback>
                  {sale.user.nickname.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">
                {sale.user.nickname}
              </span>
            </div>
          </div>
        </CardContent>
        <BorderBeam duration={8} delay={idx * 10} />
      </Card>
    </Link>
  );
};

BookSaleCard.Skeleton = function BookSaleCardSkeleton() {
  return (
    <Card className="h-full w-full overflow-hidden">
      <CardContent className="p-0">
        <div className="relative h-48 w-full overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="p-4 pb-0">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="mt-2 h-7 w-1/2" />
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <Skeleton className="mr-1.5 h-3.5 w-3.5" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-1 flex items-center text-xs text-gray-500">
            <Skeleton className="mr-1.5 h-3.5 w-3.5" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="mt-4 flex items-center gap-2 border-t pt-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
