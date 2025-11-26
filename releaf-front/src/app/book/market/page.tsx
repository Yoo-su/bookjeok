import { Metadata } from "next";

import { DefaultLayout } from "@/layouts/default-layout";
import { BookMarketView } from "@/views/book-market-view";

export const metadata: Metadata = {
  title: "중고 서적 마켓",
  description: "다양한 중고 서적을 탐색하고 저렴하게 구매해보세요.",
};

export default function BookMarketPage() {
  return (
    <DefaultLayout>
      <BookMarketView />
    </DefaultLayout>
  );
}
