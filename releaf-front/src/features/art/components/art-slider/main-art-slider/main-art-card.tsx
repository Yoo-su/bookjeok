import { MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ArtItem } from "@/features/art/types";

interface MainArtCardProps {
  item: ArtItem;
}
export const MainArtCard = ({ item }: MainArtCardProps) => {
  return (
    <Link href={`/art/${item.mt20id}`} passHref>
      <div className="group relative w-full h-[380px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out transform-gpu hover:!scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
        {/* Background Image */}
        <Image
          src={item.poster}
          alt={item.prfnm}
          fill
          sizes="280px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <h3 className="text-xl font-bold drop-shadow-lg">{item.prfnm}</h3>
          <div className="mt-2 space-y-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" />
              <span className="truncate">{item.genrenm}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{item.fcltynm}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
