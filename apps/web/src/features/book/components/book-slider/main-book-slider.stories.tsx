import { type BookInfo, bookKeys, HOME_PUBLISHERS } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { HomeHeading } from "@/features/intro/components/home-heading";
import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";

import { HOME_PUBLISHER_BOOKS_DISPLAY } from "../../constants/queries";
import { MainBookSlider } from "./main-book-slider";

const toBookInfo = (book: (typeof SAMPLE_BOOKS)[number]): BookInfo => ({
  isbn: book.isbn,
  title: book.title,
  author: book.author,
  publisher: book.publisher,
  description: book.memo ?? "",
  image: book.image ?? "",
  discount: "16200",
});

/** 출판사마다 예시 도서를 9권씩 돌려 담는다(실린더는 15장 이상으로 복제해 채움) */
function withPublisherBooks(Story: () => React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  HOME_PUBLISHERS.forEach((publisher, index) => {
    const books = SAMPLE_BOOKS.slice(index * 9, index * 9 + 9).map(toBookInfo);
    client.setQueryData(
      bookKeys.list({
        query: publisher,
        display: HOME_PUBLISHER_BOOKS_DISPLAY,
      }).queryKey,
      books,
    );
  });
  return (
    <QueryClientProvider client={client}>
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <Story />
      </div>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Book/MainBookSlider",
  component: MainBookSlider,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [withPublisherBooks],
} satisfies Meta<typeof MainBookSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 홈 최상단. 휴대폰 폭에서는 출판사 다섯 칸이 폭을 나눠 한 줄에 다 보이고,
 * 데스크톱은 글자 크기대로 가운데 모인다. 출판사를 바꾸면 흰 표시가 미끄러진다
 */
export const Default: Story = {};

/** 홈에서처럼 머리글 아래에 둔다. 머리글과 칩 사이 간격, 형광펜 획을 함께 본다 */
export const WithHomeHeading: Story = {
  render: () => (
    <>
      <HomeHeading />
      <MainBookSlider />
    </>
  ),
};
