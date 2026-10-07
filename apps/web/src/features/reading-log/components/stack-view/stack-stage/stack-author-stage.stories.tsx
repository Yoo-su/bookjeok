import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor } from "@storybook/test";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { useStackCopy } from "../hooks/use-stack-copy";
import { STACK_AUTHOR_IDS, STACK_AUTHORS } from "../lib/authors";
import { SAMPLE_BOOKS } from "../lib/sample-books";
import type { StackAuthor } from "../lib/types";
import { StackCompareStage } from "../stack-compare-stage";
import { StackStage, type StackStagePerson } from "./index";

const STACK_MM = SAMPLE_BOOKS.reduce((mm, b) => mm + b.depth, 0);
const PAPER =
  "rounded-2xl border border-stone-200 bg-white bg-[radial-gradient(#e2e0dd_1.1px,transparent_1.4px)] bg-[length:16px_16px]";

function AuthorStage({ author }: { author: StackAuthor }) {
  const { sceneLabels } = useStackCopy();
  const t = useTranslations("reading_log.stack");
  const name = t(`authors.${author}`);
  const person = useMemo<StackStagePerson>(
    () => ({
      userMm: STACK_AUTHORS[author].heightCm * 10,
      character: author,
      labelsFor: (status, userMm) =>
        sceneLabels({
          status,
          userMm,
          stackMm: STACK_MM,
          avgDepthMm: STACK_MM / SAMPLE_BOOKS.length,
          authorName: name,
        }),
    }),
    [author, sceneLabels, name],
  );
  return (
    <div data-author={author} className={PAPER}>
      <StackStage
        books={SAMPLE_BOOKS}
        stackMm={STACK_MM}
        person={person}
        replayKey={0}
        height={520}
        stackClickLabel=""
        ariaLabel={name}
      />
    </div>
  );
}

function Authors() {
  return (
    <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {STACK_AUTHOR_IDS.map((author) => (
        <AuthorStage key={author} author={author} />
      ))}
    </div>
  );
}

function Switching() {
  const { sceneLabels } = useStackCopy();
  return (
    <div className={`relative mx-auto h-[600px] w-full max-w-2xl ${PAPER}`}>
      <StackCompareStage
        books={SAMPLE_BOOKS}
        stackMm={STACK_MM}
        autoCycle={false}
        labelsFor={(status, userMm, authorName) =>
          sceneLabels({
            status,
            userMm,
            authorName,
            stackMm: STACK_MM,
            avgDepthMm: STACK_MM / SAMPLE_BOOKS.length,
          })
        }
        ariaLabel="작가와 독서 키재기"
      />
    </div>
  );
}

const meta: Meta = {
  title: "Features/ReadingLog/Stack/StackAuthorStage",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;
export const OnDottedPaper: Story = {
  render: () => <Authors />,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        canvasElement.querySelectorAll(".stack-character .traced-art"),
      ).toHaveLength(STACK_AUTHOR_IDS.length),
    );
    const paper = [
      ...canvasElement.querySelectorAll<SVGGeometryElement>(
        '[data-author="woolf"] .traced-art > path[fill="#FFFFFF"]',
      ),
    ];
    // 실제 브라우저의 채움 판정으로 얼굴·목·몸·원피스가 배경을 가리는지 확인한다.
    for (const [x, y] of [
      [270, 175],
      [305, 335],
      [310, 590],
      [330, 1400],
      [525, 750],
    ]) {
      expect(paper.some((path) => path.isPointInFill(new DOMPoint(x, y)))).toBe(
        true,
      );
    }
  },
};
export const SwitchAuthors: Story = { render: () => <Switching /> };
