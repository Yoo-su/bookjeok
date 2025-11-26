import { DefaultLayout } from "@/layouts/default-layout";
import { ArtDetailView } from "@/views/art-detail-view";

type Props = {
  params: Promise<{ id: string }>;
};
export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <DefaultLayout>
      <ArtDetailView artId={id} />
    </DefaultLayout>
  );
}
