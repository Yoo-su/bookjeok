import Image from "next/image";

import { cn } from "@/shared/utils/cn";

interface BookCoverProps {
  src: string;
  alt: string;
  className?: string;
}

export const BookCover = ({ src, alt, className }: BookCoverProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative overflow-hidden transition-shadow duration-300 shadow-lg rounded-xl group hover:shadow-2xl aspect-3/4">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20" />
      </div>
    </div>
  );
};
