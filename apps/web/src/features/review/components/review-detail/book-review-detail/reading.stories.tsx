import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { TiptapEditor } from "@/shared/components/editor/tiptap-editor";

import { ReviewPreview } from "../../review-form/review-preview";
import { ReviewDetailContent } from "./content";

const paragraph =
  "<p>책을 읽는 동안 익숙한 장면을 다른 시선으로 바라보게 되었다. 답을 찾기보다 질문을 오래 품고 싶어지는 순간이 있었다. 문장과 문장 사이에서 잠시 멈추고, 내 경험과 연결해 생각을 정리해 보았다.</p>";
const sample =
  "<p>화면 검증을 위한 예시 리뷰입니다.</p>" +
  ["책을 펼치며", "오래 남은 문장", "다시 읽고 싶은 이유", "읽고 난 뒤"]
    .map(
      (title, index) =>
        `<h2>${title}</h2>${paragraph.repeat(index === 3 ? 1 : 8)}${index === 1 ? `<h3>일상으로 이어지는 질문</h3>${paragraph.repeat(3)}` : ""}`,
    )
    .join("");

const meta = {
  title: "Feature/ReviewReading",
  component: ReviewDetailContent,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <>
        <header
          data-site-header
          className="sticky top-0 z-50 flex h-20 items-center border-b bg-white px-6 font-medium"
        >
          북적 · 리뷰 화면 검증
        </header>
        <main className="mx-auto max-w-5xl p-4 sm:p-6">
          <h1 className="mb-10 mt-6 text-3xl font-bold">
            읽는 동안 생긴 질문들
          </h1>
          <Story />
          <div className="mt-12 min-h-96 border-t py-8">
            댓글 · 본문 진행률에서 제외
          </div>
        </main>
      </>
    ),
  ],
} satisfies Meta<typeof ReviewDetailContent>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LongReview: Story = { args: { content: sample } };
export const NoHeadings: Story = { args: { content: paragraph.repeat(3) } };
export const LongOutline: Story = {
  args: {
    content: Array.from(
      { length: 30 },
      (_, index) =>
        `<h2>${index + 1}. 아주 긴 소제목이 여러 줄로 표시되는 리뷰의 목차 확인</h2>${paragraph.repeat(3)}`,
    ).join(""),
  },
};
function WritingExample() {
  const [content, setContent] = useState(sample);
  return (
    <div className="space-y-4">
      <ReviewPreview content={content} />
      <TiptapEditor content={content} onChange={setContent} />
    </div>
  );
}
export const Writing: Story = {
  args: { content: sample },
  render: () => <WritingExample />,
};
