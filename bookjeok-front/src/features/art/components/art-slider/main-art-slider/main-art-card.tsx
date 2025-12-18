import { Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ArtItem } from "@/features/art/types";
import { Badge } from "@/shared/components/shadcn/badge";

interface MainArtCardProps {
  item: ArtItem;
}

export const MainArtCard = ({ item }: MainArtCardProps) => {
  return (
    <Link href={`/art/${item.mt20id}`} passHref>
      <div className="group relative w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1 border border-stone-100">
        {/* 포스터 이미지 */}
        <div className="relative aspect-3/4 overflow-hidden">
          <Image
            src={item.poster}
            alt={item.prfnm}
            fill
            sizes="300px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* 상태 배지 */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 backdrop-blur-sm text-stone-700 font-medium text-xs border-0 shadow-sm">
              {item.genrenm}
            </Badge>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-4">
          <h3 className="text-base font-bold text-stone-900 line-clamp-2 leading-snug mb-2 group-hover:text-rose-600 transition-colors">
            {item.prfnm}
          </h3>
          <div className="space-y-1.5 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span className="truncate">{item.fcltynm}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span className="truncate">
                {item.prfpdfrom} ~ {item.prfpdto}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
