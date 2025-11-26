import { Metadata } from "next";

import { DefaultLayout } from "@/layouts/default-layout";
import BookSearchView from "@/views/book-search-view";

export const metadata: Metadata = {
  title: "도서 검색",
  description:
    "판매하고 싶은 중고 서적을 검색하거나, 관심 있는 책의 판매글이 있는지 찾아보세요.",
};

export default function Page() {
  return (
    <DefaultLayout>
      <BookSearchView />
    </DefaultLayout>
  );
}
