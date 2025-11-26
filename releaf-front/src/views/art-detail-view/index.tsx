"use client";

import { AlertTriangle } from "lucide-react";

import { ArtDetail } from "@/features/art/components/art-detail";
import { ArtDetailSkeleton } from "@/features/art/components/skeleton";
import { useArtDetailQuery } from "@/features/art/queries";

interface ArtDetailViewProps {
  artId: string;
}
export const ArtDetailView = ({ artId }: ArtDetailViewProps) => {
  const { data: art, isLoading, isError } = useArtDetailQuery(artId);

  if (isLoading) {
    return <ArtDetailSkeleton />;
  }

  if (isError || !art) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold">
          공연 정보를 불러올 수 없습니다.
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          삭제되었거나 유효하지 않은 정보일 수 있습니다.
        </p>
      </div>
    );
  }

  return <ArtDetail art={art} />;
};
