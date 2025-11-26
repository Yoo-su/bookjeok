import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { UsedBookSale } from "@/features/book/types";

interface RecentSaleCardProps {
  sale: UsedBookSale;
}

export const RecentSaleCard = ({ sale }: RecentSaleCardProps) => {
  return (
    <Link
      href={`/book/sale/${sale.id}`}
      className="group block w-full"
      passHref
    >
      <div className="flex flex-col items-center text-center py-4">
        {/* 동그란 이미지 */}
        <div className="relative w-40 h-40 mb-4 transition-transform duration-300 ease-in-out group-hover:scale-105">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 transition-all duration-300 group-hover:inset-[-4px]" />
          <div className="relative w-full h-full overflow-hidden border-4 border-white rounded-full shadow-lg">
            <Image
              src={sale.imageUrls[0] || "/placeholder.jpg"}
              alt={sale.title}
              fill
              sizes="160px"
              className="object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/160x160/e2e8f0/64748b?text=Image";
              }}
            />
          </div>
        </div>

        {/* 텍스트 정보 */}
        <h3 className="font-bold text-gray-800 truncate w-full px-2">
          {sale.title}
        </h3>
        <p className="mt-1 text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
          {sale.price.toLocaleString()}원
        </p>
        <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
          <MapPin className="w-3 h-3 mr-1" />
          <span>
            {sale.city} {sale.district}
          </span>
        </div>
      </div>
    </Link>
  );
};
