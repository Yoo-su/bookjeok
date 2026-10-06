import { publicApiClient } from "@bookjeok/api-client";
import type { BookInfo } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import type { AxiosAdapter } from "axios";
import { useState } from "react";

import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";

import { BookSearchResultList } from "./index";

const BOOKS: BookInfo[] = SAMPLE_BOOKS.map((b) => ({
  isbn: b.isbn,
  title: b.title,
  author: b.author,
  publisher: b.publisher,
  description: "",
  image: b.image,
  link: "",
  discount: "",
  pubdate: "",
}));

const QUERIES = ["시집", "소설", "에세이"];

/** 로컬에 API가 없어 검색 요청을 받는 어댑터를 갈아 끼움. 검색어마다 다른 20권을 돌려준다 */
const fakeSearchAdapter =
  (latency: number): AxiosAdapter =>
  async (config) => {
    await new Promise((r) => setTimeout(r, latency));
    const offset = Math.max(0, QUERIES.indexOf(config.params?.query)) * 13;
    const items = Array.from(
      { length: 20 },
      (_, i) => BOOKS[(offset + i) % BOOKS.length],
    );
    return {
      data: {
        items,
        display: 20,
        start: Number(config.params?.start ?? 1),
        total: 40,
        lastBuildDate: "",
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };

function SearchPlayground() {
  const [query, setQuery] = useState(QUERIES[0]);
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQuery(q)}
            className={
              q === query
                ? "rounded-full bg-stone-900 px-3 py-1.5 text-white"
                : "rounded-full border border-stone-200 px-3 py-1.5 text-stone-600"
            }
          >
            {q}
          </button>
        ))}
      </div>
      <BookSearchResultList query={query} />
    </div>
  );
}

type Args = { latency: number };

const meta: Meta<Args> = {
  title: "Features/Book/BookSearchResultList",
  render: () => <SearchPlayground />,
  parameters: { layout: "padded", nextjs: { appDirectory: true } },
  args: { latency: 900 },
  argTypes: {
    latency: { control: { type: "range", min: 0, max: 3000, step: 100 } },
  },
  beforeEach: ({ args }) => {
    const original = publicApiClient.defaults.adapter;
    publicApiClient.defaults.adapter = fakeSearchAdapter(args.latency);
    return () => {
      publicApiClient.defaults.adapter = original;
    };
  },
};

export default meta;
type Story = StoryObj<Args>;

/**
 * 검색어를 바꾸면 받는 동안 이전 결과가 흐려지고, 도착하면 새 결과가 살짝 올라오며 나타난다.
 * 차례대로 나오는 건 앞 8장뿐이고 나머지는 함께 나온다. 아래로 내리면 다음 쪽이 한꺼번에 붙는다
 */
export const ResultSwap: Story = {};
