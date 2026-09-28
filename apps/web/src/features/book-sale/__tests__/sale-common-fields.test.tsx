import { TradeMethod } from "@bookjeok/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { Form } from "@/shared/components/shadcn/form";

import {
  SaleBasicFields,
  SaleContentField,
} from "../components/sale-form/sale-common-fields";

vi.mock("next-intl", async () => {
  const { createIntlMock } = await import("@/__tests__/helpers/intl");
  const mock = createIntlMock();
  return {
    ...mock,
    useTranslations: (namespace?: string) => {
      const t = mock.useTranslations(namespace);
      // 추천 태그 목록은 배열이라 raw로 읽는다
      return Object.assign(t, { raw: () => ["#밑줄없음", "#직거래"] });
    },
  };
});

let latestContent = "";

const Harness = () => {
  const form = useForm({
    defaultValues: {
      title: "클린 코드",
      price: "12000",
      tradeMethod: TradeMethod.DIRECT_ONLY,
      content: "",
    },
  });
  latestContent = form.watch("content");
  return (
    <Form {...form}>
      <form>
        <SaleBasicFields />
        <SaleContentField />
      </form>
    </Form>
  );
};

describe("판매글 공용 필드", () => {
  it("부모 폼의 값으로 제목·가격·본문을 그린다", () => {
    render(<Harness />);

    expect(screen.getByDisplayValue("클린 코드")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12000")).toBeInTheDocument();
    expect(screen.getByText("5 / 50", { exact: false })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox").length).toBeGreaterThanOrEqual(2);
  });

  it("추천 태그를 누르면 본문에 한 번만 덧붙인다", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "+ #직거래" }));
    expect(latestContent).toBe("#직거래");

    fireEvent.click(screen.getByRole("button", { name: "+ #밑줄없음" }));
    expect(latestContent).toBe("#직거래\n#밑줄없음");

    fireEvent.click(screen.getByRole("button", { name: "+ #직거래" }));
    expect(latestContent).toBe("#직거래\n#밑줄없음");
  });
});
