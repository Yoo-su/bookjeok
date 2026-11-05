import { Fragment } from "react";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 검색어와 맞는 부분에 형광펜 자국을 남긴다.
 * 입력할 때마다 다시 그려지므로 긋는 애니메이션은 끈다.
 */
export const Highlight = ({ text, query }: { text: string; query: string }) => {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  const lowered = words.map((w) => w.toLowerCase());

  return (
    <>
      {text.split(pattern).map((part, i) =>
        lowered.includes(part.toLowerCase()) ? (
          <mark
            key={i}
            className="highlighter-mark bg-transparent text-inherit [animation:none]"
          >
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
};

/**
 * 「소년이 온다 (한강 소설ㅣ2024년 …)」처럼 판매용 부제가 붙은 제목을 본제목과 부제로 나눈다.
 * 좁은 줄에서 본제목이 먼저 잘리지 않게 하려는 것이다.
 */
export const splitBookTitle = (title: string): [string, string | null] => {
  const match = title.match(/^(.+?)\s+(\(.+|-\s.+)$/);
  if (!match) return [title, null];
  const sub = match[2].replace(/^-\s*/, "").replace(/^\((.*)\)$/, "$1");
  return [match[1], sub];
};
