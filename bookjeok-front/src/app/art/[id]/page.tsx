import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { getArtDetail } from "@/features/art/apis";
import { DefaultLayout } from "@/layouts/default-layout";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { ArtDetailView } from "@/views/art-detail-view";

export const metadata: Metadata = {
  title: "공연/전시 상세",
  description: "공연 및 전시 상세 정보를 확인하세요.",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  const queryClient = getQueryClient();

  // 서버에서 공연/전시 상세 정보 prefetch
  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.artKeys.detail(id).queryKey,
    queryFn: () => getArtDetail(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DefaultLayout>
        <ArtDetailView artId={id} />
      </DefaultLayout>
    </HydrationBoundary>
  );
}
