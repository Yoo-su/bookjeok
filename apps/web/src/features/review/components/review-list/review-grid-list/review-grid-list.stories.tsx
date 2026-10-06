// 앱 레이아웃이 전역으로 싣는 Swiper 스타일. 분야 탭이 가로로 놓이게
import "@/styles/swiper.css";

import { publicApiClient } from "@bookjeok/api-client";
import { BOOK_DOMAINS, type Review } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import type { AxiosAdapter } from "axios";
import { useState } from "react";

import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";

import { ReviewHomeFilters } from "../review-home-filters";
import { ReviewGridList } from "./index";

/** 예시 책으로 만든 리뷰. 분야를 돌려 가며 붙여 분야마다 목록이 달라 보이게 한다 */
const REVIEWS: Review[] = SAMPLE_BOOKS.slice(0, 36).map((b, i) => ({
  id: i + 1,
  title: b.memo ?? b.title,
  content: `<p>${b.memo ?? ""}</p>`,
  isbn: b.isbn,
  rating: 3 + (i % 5) * 0.5,
  tags: [b.author],
  category: BOOK_DOMAINS[i % 4],
  viewCount: 10 * i,
  userId: 1,
  isPublic: true,
  reactionCount: i % 7,
  user: {
    id: 1,
    handle: "bookworm",
    nickname: "책벌레",
    profileImageUrl: "default_profile3",
  },
  book: {
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    publisher: b.publisher,
    description: "",
    image: b.image,
    link: "",
    discount: "",
    pubdate: "",
  },
  createdAt: `${b.date}T09:00:00.000Z`,
  updatedAt: `${b.date}T09:00:00.000Z`,
}));

/** 로컬에 API가 없어 리뷰 목록 요청을 받는 어댑터를 갈아 끼움 */
const fakeReviewsAdapter =
  (latency: number): AxiosAdapter =>
  async (config) => {
    await new Promise((r) => setTimeout(r, latency));
    const params = new URLSearchParams(config.url?.split("?")[1]);
    const category = params.get("category");
    const reviews = REVIEWS.filter(
      (r) => !category || r.category === category,
    ).slice(0, 12);
    return {
      data: { reviews, page: 1, limit: 12, hasNextPage: false },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };

function FilteredListPlayground() {
  const [category, setCategory] = useState<string | null>(BOOK_DOMAINS[0]);
  const [searchInput, setSearchInput] = useState("");
  return (
    <div className="mx-auto w-full max-w-5xl">
      <ReviewHomeFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={(e) => e.preventDefault()}
        isFiltered={!!category}
        clearFilters={() => setCategory(null)}
        selectedCategory={category}
        handleCategoryClick={(next) =>
          setCategory((c) => (c === next ? null : next))
        }
        selectedTag={null}
        clearTag={() => {}}
        selectedIsbn={null}
        clearIsbn={() => {}}
      />
      <ReviewGridList
        searchQuery=""
        category={category}
        clearFilters={() => setCategory(null)}
      />
    </div>
  );
}

type Args = { latency: number };

const meta: Meta<Args> = {
  title: "Features/Review/ReviewGridList",
  render: () => <FilteredListPlayground />,
  parameters: { layout: "padded", nextjs: { appDirectory: true } },
  args: { latency: 900 },
  argTypes: {
    latency: { control: { type: "range", min: 0, max: 3000, step: 100 } },
  },
  beforeEach: ({ args }) => {
    const original = publicApiClient.defaults.adapter;
    publicApiClient.defaults.adapter = fakeReviewsAdapter(args.latency);
    return () => {
      publicApiClient.defaults.adapter = original;
    };
  },
};

export default meta;
type Story = StoryObj<Args>;

/**
 * 분야를 바꾸면 받는 동안 이전 목록이 흐려지고, 도착하면 새 목록이 살짝 올라오며 바뀐다.
 * 소설·에세이·자기계발·인문에만 예시가 있다
 */
export const FilterSwap: Story = {};
