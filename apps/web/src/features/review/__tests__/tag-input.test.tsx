/**
 * 태그 입력 자동완성의 계약 검증.
 *
 * 이 컴포넌트의 목적은 **기존 태그를 합치는 것이 아니라 새로 지어내는 것을
 * 막는 것**이다. 운영 태그 117개 중 99개가 1회성이고, `카뮈`/`알베르카뮈`처럼
 * 뜻이 같은 쌍은 문자열로 판정할 수 없다. 그래서 여기서 고정하는 것은
 * "쓰는 순간 기존 태그가 보이고, 고르면 그 표기 그대로 들어간다"까지다.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TagInput } from "@/features/review/components/review-form/tag-input";

vi.mock("next-intl", () => ({
  useTranslations: (section?: string) => {
    const t = (key: string, values?: Record<string, unknown>) => {
      const id = `${section ? `${section}.` : ""}${key}`;
      return values ? `${id}:${Object.values(values).join(",")}` : id;
    };
    return t;
  },
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (m: string) => toastError(m) } }));

const useTagSuggestionsQuery = vi.fn();
vi.mock("@bookjeok/react-query", () => ({
  useTagSuggestionsQuery: (...args: unknown[]) =>
    useTagSuggestionsQuery(...args),
}));

const SUGGESTIONS = [
  { name: "카뮈", count: 5 },
  { name: "카프카", count: 4 },
];

beforeEach(() => {
  vi.clearAllMocks();
  useTagSuggestionsQuery.mockReturnValue({ data: SUGGESTIONS });
});

const getInput = () => screen.getByRole("combobox");

describe("TagInput", () => {
  it("입력에 포커스하면 기존 태그를 사용 횟수와 함께 제안한다", () => {
    render(<TagInput value={[]} onChange={vi.fn()} />);
    fireEvent.focus(getInput());

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("카뮈");
    expect(options[0]).toHaveTextContent("5");
  });

  it("제안을 고르면 그 표기 그대로 추가된다", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    fireEvent.focus(getInput());
    fireEvent.mouseDown(screen.getByRole("option", { name: /카뮈/ }));

    expect(onChange).toHaveBeenCalledWith(["카뮈"]);
  });

  it("이미 고른 태그는 제안에서 뺀다", () => {
    render(<TagInput value={["카뮈"]} onChange={vi.fn()} />);
    fireEvent.focus(getInput());

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("카프카");
  });

  it("직접 입력한 값은 서버와 같은 규칙으로 정규화해 넣는다", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);

    fireEvent.change(getInput(), { target: { value: "  #알베르  카뮈 " } });
    fireEvent.keyDown(getInput(), { key: "Enter" });

    // 선행 #과 앞뒤 공백은 걷어내고, 내부 공백은 하나로 압축만 한다
    expect(onChange).toHaveBeenCalledWith(["알베르 카뮈"]);
  });

  it("한글 조합 중의 Enter는 태그를 추가하지 않는다", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);

    fireEvent.change(getInput(), { target: { value: "카뮈" } });
    fireEvent.keyDown(getInput(), { key: "Enter", isComposing: true });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("같은 태그를 두 번 넣지 않는다", () => {
    const onChange = vi.fn();
    render(<TagInput value={["카뮈"]} onChange={onChange} />);

    fireEvent.change(getInput(), { target: { value: "카뮈" } });
    fireEvent.keyDown(getInput(), { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("상한에 닿으면 입력을 막는다", () => {
    render(<TagInput value={["1", "2", "3", "4", "5"]} onChange={vi.fn()} />);

    expect(getInput()).toBeDisabled();
  });

  it("방향키로 제안을 옮기고 Enter로 고른다", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    fireEvent.focus(getInput());

    fireEvent.keyDown(getInput(), { key: "ArrowDown" });
    fireEvent.keyDown(getInput(), { key: "ArrowDown" });
    fireEvent.keyDown(getInput(), { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(["카프카"]);
  });
});
