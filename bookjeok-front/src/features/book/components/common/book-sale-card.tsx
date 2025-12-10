import { Eye, MapPin } from "lucide-react";
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
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { UsedBookSale } from "../../types";
import { SaleStatusBadge } from "./sale-status-badge";

interface SaleCardProps {
  sale: UsedBookSale;
  idx?: number;
  className?: string;
  href?: string;
  showEffect?: boolean;
}

const PLACEHOLDER_IMAGE =
  "https://placehold.co/250x192/e2e8f0/64748b?text=Image";

interface SaleCardProps {
  sale: UsedBookSale;
  idx?: number;
  className?: string;
  href?: string;
  showEffect?: boolean;
  rank?: number;
}

export const BookSaleCard = ({
  sale,
  idx = 0,
  className,
  href,
  showEffect = true,
  rank,
}: SaleCardProps) => {
  const linkHref = href || PATHS.BOOK_SALES_DETAIL(String(sale.id));

  return (
    <Link
      href={linkHref}
      passHref
      className={cn("block h-full w-full group", className)}
    >
      <Card
        className={cn(
          "relative h-full w-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-stone-200",
          className
        )}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image Section */}
          <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
            <Image
              src={sale.imageUrls[0] || PLACEHOLDER_IMAGE}
              alt={sale.title}
              title={sale.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_IMAGE;
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-60" />

            {/* Rank Badge */}
            {rank && (
              <div className="absolute top-0 left-0 bg-black/60 text-white px-3 py-1.5 rounded-br-xl font-bold font-serif text-sm backdrop-blur-sm z-10">
                {rank}
              </div>
            )}

            {/* Status Badge */}
            <SaleStatusBadge
              status={sale.status}
              className="absolute right-2 top-2 shadow-sm"
            />
          </div>

          {/* Content Section */}
          <div className="p-3 flex flex-col flex-1">
            <h3 className="line-clamp-1 font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
              {sale.title}
            </h3>

            <div className="mt-1 mb-2">
              <p className="text-lg font-bold text-emerald-600">
                {sale.price.toLocaleString()}원
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {sale.city} {sale.district}
              </span>
            </div>

            {/* Footer: User & View Count */}
            <div className="mt-auto flex items-center justify-between pt-3 border-t border-dashed border-gray-100">
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={sale.user.profileImageUrl || ""} />
                  <AvatarFallback className="text-[9px]">
                    {sale.user.nickname.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-500 truncate max-w-[80px]">
                  {sale.user.nickname}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
                <Eye className="w-3 h-3" />
                <span>{sale.viewCount?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
        {showEffect && <BorderBeam duration={8} delay={idx * 10} />}
      </Card>
    </Link>
  );
};

BookSaleCard.Skeleton = function BookSaleCardSkeleton() {
  return (
    <Card className="h-full w-full overflow-hidden">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Image Skeleton */}
        <div className="relative aspect-4/3 w-full overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>

        {/* Content Skeleton */}
        <div className="p-3 flex flex-col flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-7 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />

          <div className="mt-auto flex items-center justify-between pt-3 border-t border-dashed border-gray-100">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
