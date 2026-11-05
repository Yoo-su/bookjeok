import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";

import { useGlobalSearch } from "../hooks/use-global-search";
import {
  installSearchPreviewMock,
  type SearchPreviewMockOptions,
} from "../lib/sample-search-preview";
import { useRecentSearchesStore } from "../stores/use-recent-searches-store";
import { SEARCH_INPUT_CLASS } from "./header-search";
import { SearchPreviewPanel } from "./search-preview-panel";

const noop = () => {};

/** 상태별로 패널만 본다. 위 입력창에 직접 쳐 볼 수 있다 */
const Harness = ({ initialValue = "" }: { initialValue?: string }) => {
  const search = useGlobalSearch({ onClose: noop });
  const { setValue } = search;
  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue, setValue]);

  return (
    <div className="mx-auto w-full max-w-[40rem] p-4">
      <div className="mb-3 flex h-11 items-center rounded-full bg-stone-100 px-4">
        <input {...search.inputProps} className={SEARCH_INPUT_CLASS} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-lg shadow-stone-900/5">
        <SearchPreviewPanel search={search} variant="popover" />
      </div>
    </div>
  );
};

const withMock =
  (options?: SearchPreviewMockOptions, recent: string[] = []) =>
  () => {
    useRecentSearchesStore.setState({ queries: recent });
    const restore = installSearchPreviewMock(options);
    return () => {
      restore();
      useRecentSearchesStore.setState({ queries: [] });
    };
  };

const meta = {
  title: "Features/Search/SearchPreviewPanel",
  component: Harness,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  beforeEach: withMock(),
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 입력 전. 최근 검색어와 인기 검색어. ×로 하나씩, 「전체 삭제」로 모두 지운다 */
export const Idle: Story = {
  beforeEach: withMock(undefined, ["작별하지 않는다", "데미안", "헤르만 헤세"]),
};

/** 최근 검색어가 없고 인기 검색어도 못 받았을 때 */
export const IdleEmpty: Story = {
  beforeEach: () => {
    useRecentSearchesStore.setState({ queries: [] });
    const restore = installSearchPreviewMock({ mode: "error" });
    return restore;
  },
};

/**
 * 세 영역이 모두 걸릴 때.
 * - 도서는 4권까지, 넘치면 「모두 보기」. 책마다 리뷰·중고 수를 붙인다
 * - 맞는 글자에 형광펜 자국. 입력할 때마다 다시 그려지므로 긋는 애니메이션은 없다
 * - ↑↓로 고르고 Enter로 이동, 아무것도 안 고르면 도서 검색으로
 */
export const Results: Story = { args: { initialValue: "한강" } };

/** 판매글만 걸리면 다른 영역은 아예 그리지 않는다 */
export const OnlySales: Story = { args: { initialValue: "양장" } };

/** 한 글자는 미리보기를 부르지 않는다 */
export const Short: Story = { args: { initialValue: "한" } };

export const NoResults: Story = { args: { initialValue: "양자역학" } };

export const Loading: Story = {
  args: { initialValue: "한강" },
  beforeEach: withMock({ mode: "loading" }),
};

export const FetchError: Story = {
  args: { initialValue: "한강" },
  beforeEach: withMock({ mode: "error" }),
};

/** 응답이 느릴 때. 새 결과가 올 때까지 직전 결과를 흐리게 남긴다. 「한강」 뒤에 「 소설」을 쳐 보자 */
export const SlowNetwork: Story = {
  args: { initialValue: "한강" },
  beforeEach: withMock({ delay: 1200 }),
};
