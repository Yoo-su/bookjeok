import { reviewKeys } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { Toaster } from "@/shared/components/shadcn/sonner";

import { TagInput } from "./tag-input";

/** 빈 입력으로 포커스했을 때 뜨는 기존 태그. 다른 검색어는 로컬에 API가 없어 제안이 없다 */
function TagInputPlayground({ initial }: { initial: string[] }) {
  const [client] = useState(() => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    qc.setQueryData(reviewKeys.tagSuggestions("").queryKey, [
      { name: "카뮈", count: 5 },
      { name: "카프카", count: 4 },
      { name: "여름에읽기좋은", count: 3 },
      { name: "재독", count: 2 },
    ]);
    return qc;
  });
  const [tags, setTags] = useState(initial);
  return (
    <QueryClientProvider client={client}>
      <div className="mx-auto w-full max-w-xl">
        <TagInput value={tags} onChange={setTags} />
      </div>
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Review/TagInput",
  component: TagInputPlayground,
  parameters: { layout: "padded" },
  args: { initial: ["부조리", "실존주의", "프랑스문학"] },
} satisfies Meta<typeof TagInputPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 태그를 넣으면 칩이 톡 튀어나오고, 칩을 눌러 지우면 조용히 빠지며 뒤 칩들이 당겨진다.
 * 여러 줄로 넘어가도 줄 사이를 미끄러져 옮겨 간다
 */
export const AddAndRemove: Story = {};

/** 빈 상태에서 시작 */
export const Empty: Story = { args: { initial: [] } };
