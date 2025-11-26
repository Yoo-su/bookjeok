import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BookInfo } from "../../types";
import { BookSaleForm } from ".";

// Mutation Hook Mock
const mockMutate = jest.fn();
jest.mock("../../mutations", () => ({
  useCreateBookSaleMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

// Next.js Image 컴포넌트 Mock
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || ""} {...props} />;
  },
}));

// 테스트용 bookInfo 데이터
const mockBookInfo: BookInfo = {
  isbn: "9788932920238",
  title: "깊이에의 강요",
  description: "파트리크 쥐스킨트의 단편 소설집",
  author: "파트리크 쥐스킨트",
  publisher: "열린책들",
  image: "https://example.com/book.jpg",
  pubdate: "20200420",
  link: "https://example.com",
  discount: "11520",
};

// JSDOM polyfills
beforeAll(() => {
  // DataTransfer polyfill
  class MockDataTransferItem {
    kind = "file" as const;
    type: string;
    file: File;

    constructor(file: File) {
      this.type = file.type;
      this.file = file;
    }

    getAsFile() {
      return this.file;
    }

    getAsString(callback: (data: string) => void) {
      callback("");
    }
  }

  class MockDataTransferItemList {
    private items: MockDataTransferItem[] = [];

    get length() {
      return this.items.length;
    }

    add(file: File) {
      this.items.push(new MockDataTransferItem(file));
      return this.items[this.items.length - 1];
    }

    clear() {
      this.items = [];
    }

    remove(index: number) {
      this.items.splice(index, 1);
    }

    [Symbol.iterator]() {
      return this.items[Symbol.iterator]();
    }
  }

  global.DataTransfer = class DataTransfer {
    items: MockDataTransferItemList;
    files: FileList | undefined;
    effectAllowed = "all" as const;
    dropEffect = "none" as const;

    constructor() {
      this.items = new MockDataTransferItemList();

      Object.defineProperty(this, "files", {
        get: () => {
          const fileArray = Array.from(this.items).map((item) =>
            item.getAsFile()
          );
          Object.defineProperty(fileArray, "item", {
            value: (index: number) => fileArray[index] || null,
          });
          return fileArray as unknown as FileList;
        },
      });
    }

    setData(_format: string, _data: string) {}
    getData(_format: string) {
      return "";
    }
    clearData(_format?: string) {}
    setDragImage(_image: Element, _x: number, _y: number) {}
  } as any;

  // URL.createObjectURL polyfill
  if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = jest.fn((file: File) => `blob:${file.name}`);
  }
  if (!global.URL.revokeObjectURL) {
    global.URL.revokeObjectURL = jest.fn();
  }

  // Pointer Capture polyfills
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }

  // scrollIntoView polyfill
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = jest.fn();
  }
});

describe("BookSaleForm", () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  describe("UI 렌더링 테스트", () => {
    it("폼의 모든 기본 요소가 렌더링되어야 한다", () => {
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      expect(screen.getByText("중고책 판매글 작성")).toBeInTheDocument();
      expect(
        screen.getByText("판매할 책의 정보를 정확하게 입력해주세요.")
      ).toBeInTheDocument();

      // 책 정보 표시
      expect(screen.getByText("깊이에의 강요")).toBeInTheDocument();
      expect(screen.getByText("파트리크 쥐스킨트 저")).toBeInTheDocument();

      // Form 필드들
      expect(
        screen.getByPlaceholderText("판매글 제목을 입력하세요")
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("숫자만 입력")).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /시\/도/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /시\/군\/구/ })
      ).toBeInTheDocument();
      expect(screen.getByText(/책 상태 이미지/)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/책의 상태, 거래 방식 등/)
      ).toBeInTheDocument();

      // 제출 버튼
      expect(
        screen.getByRole("button", { name: "판매글 등록하기" })
      ).toBeInTheDocument();
    });

    it("초기 렌더링 시 이미지 카운트가 0/5로 표시되어야 한다", () => {
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      expect(screen.getByText(/책 상태 이미지 \(0 \/ 5\)/)).toBeInTheDocument();
    });
  });

  describe("제목 필드 유효성 검사", () => {
    it("제목이 비어있을 때 에러 메시지를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const titleInput =
        screen.getByPlaceholderText("판매글 제목을 입력하세요");

      await user.click(titleInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText("제목은 5자 이상 입력해주세요.")
        ).toBeInTheDocument();
      });
    });

    it("제목이 5자 미만일 때 에러 메시지를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const titleInput =
        screen.getByPlaceholderText("판매글 제목을 입력하세요");

      await user.type(titleInput, "짧음");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText("제목은 5자 이상 입력해주세요.")
        ).toBeInTheDocument();
      });
    });

    it("제목이 50자를 초과할 때 에러 메시지를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const titleInput =
        screen.getByPlaceholderText("판매글 제목을 입력하세요");
      const longTitle = "a".repeat(51);

      await user.type(titleInput, longTitle);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText("제목은 50자를 초과할 수 없습니다.")
        ).toBeInTheDocument();
      });
    });

    it("제목이 5자 이상 50자 이하일 때 에러가 없어야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const titleInput =
        screen.getByPlaceholderText("판매글 제목을 입력하세요");

      await user.type(titleInput, "깊이에의 강요 판매합니다");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByText("제목은 5자 이상 입력해주세요.")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText("제목은 50자를 초과할 수 없습니다.")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("가격 필드 유효성 검사", () => {
    it("가격이 비어있을 때 에러 메시지를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const priceInput = screen.getByPlaceholderText("숫자만 입력");

      await user.click(priceInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText("가격을 입력해주세요.")).toBeInTheDocument();
      });
    });

    it("가격이 0일 때 에러 메시지를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const priceInput = screen.getByPlaceholderText("숫자만 입력");

      await user.type(priceInput, "0");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText("가격은 0보다 커야 합니다.")
        ).toBeInTheDocument();
      });
    });

    it("유효한 가격일 때 에러가 없어야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const priceInput = screen.getByPlaceholderText("숫자만 입력");

      await user.type(priceInput, "10000");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByText("가격을 입력해주세요.")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText("가격은 0보다 커야 합니다.")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("지역 선택 유효성 검사", () => {
    it("시/도를 선택하지 않았을 때 에러 메시지를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const submitButton = screen.getByRole("button", {
        name: "판매글 등록하기",
      });

      await user.type(
        screen.getByPlaceholderText("판매글 제목을 입력하세요"),
        "테스트 판매글입니다"
      );
      await user.type(screen.getByPlaceholderText("숫자만 입력"), "10000");
      await user.type(
        screen.getByPlaceholderText(/책의 상태, 거래 방식 등/),
        "상태 좋습니다. 거래 원해요."
      );

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("시/도를 선택해주세요.")).toBeInTheDocument();
      });
    });

    it("시/도 선택 시 시/군/구 선택이 활성화되어야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const districtSelect = screen.getByRole("combobox", {
        name: /시\/군\/구/,
      });
      expect(districtSelect).toBeDisabled();

      const citySelect = screen.getByRole("combobox", { name: /시\/도/ });
      await user.click(citySelect);

      // Radix UI Select는 포털을 사용하므로 document.body에서 찾음
      await waitFor(() => {
        const portal = document.body;
        const seoulOption = within(portal).getByRole("option", {
          name: "서울특별시",
        });
        expect(seoulOption).toBeInTheDocument();
      });

      const portal = document.body;
      const seoulOption = within(portal).getByRole("option", {
        name: "서울특별시",
      });
      await user.click(seoulOption);

      await waitFor(() => {
        expect(districtSelect).not.toBeDisabled();
      });
    });

    it("시/도가 선택되고 하위 시/군/구가 있을 때 시/군/구를 선택하지 않으면 에러를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const citySelect = screen.getByRole("combobox", { name: /시\/도/ });
      await user.click(citySelect);

      await waitFor(() => {
        const portal = document.body;
        const seoulOption = within(portal).getByRole("option", {
          name: "서울특별시",
        });
        expect(seoulOption).toBeInTheDocument();
      });

      const portal = document.body;
      const seoulOption = within(portal).getByRole("option", {
        name: "서울특별시",
      });
      await user.click(seoulOption);

      const submitButton = screen.getByRole("button", {
        name: "판매글 등록하기",
      });

      await user.type(
        screen.getByPlaceholderText("판매글 제목을 입력하세요"),
        "테스트 판매글입니다"
      );
      await user.type(screen.getByPlaceholderText("숫자만 입력"), "10000");
      await user.type(
        screen.getByPlaceholderText(/책의 상태, 거래 방식 등/),
        "상태 좋습니다. 거래 원해요."
      );

      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("시/군/구를 선택해주세요.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("이미지 첨부 기능 테스트", () => {
    it("이미지를 첨부하지 않았을 때 에러 메시지를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const submitButton = screen.getByRole("button", {
        name: "판매글 등록하기",
      });

      await user.type(
        screen.getByPlaceholderText("판매글 제목을 입력하세요"),
        "테스트 판매글입니다"
      );
      await user.type(screen.getByPlaceholderText("숫자만 입력"), "10000");
      await user.type(
        screen.getByPlaceholderText(/책의 상태, 거래 방식 등/),
        "상태 좋습니다. 거래 원해요."
      );

      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("이미지를 1개 이상 등록해주세요.")
        ).toBeInTheDocument();
      });
    });

    it("이미지를 첨부하면 미리보기가 표시되어야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const fileInput = screen.getByLabelText("이미지 추가");

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(
          screen.getByText(/책 상태 이미지 \(1 \/ 5\)/)
        ).toBeInTheDocument();
        expect(screen.getByAltText("Preview 0")).toBeInTheDocument();
      });
    });

    it("이미지를 삭제할 수 있어야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const fileInput = screen.getByLabelText("이미지 추가");

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText("Preview 0")).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText("Preview 0 삭제");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByAltText("Preview 0")).not.toBeInTheDocument();
        expect(
          screen.getByText(/책 상태 이미지 \(0 \/ 5\)/)
        ).toBeInTheDocument();
      });
    });

    it("이미지를 5개 초과로 첨부하려 하면 경고창이 표시되어야 한다", async () => {
      const user = userEvent.setup();
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const files = Array.from(
        { length: 6 },
        (_, i) => new File(["image"], `test${i}.jpg`, { type: "image/jpeg" })
      );

      const fileInput = screen.getByLabelText("이미지 추가");

      await user.upload(fileInput, files);

      expect(alertSpy).toHaveBeenCalledWith(
        "이미지는 최대 5개까지 첨부할 수 있습니다."
      );

      alertSpy.mockRestore();
    });

    it("이미지를 5개 첨부하면 추가 버튼이 사라져야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const files = Array.from(
        { length: 5 },
        (_, i) => new File(["image"], `test${i}.jpg`, { type: "image/jpeg" })
      );

      const fileInput = screen.getByLabelText("이미지 추가");
      await user.upload(fileInput, files);

      await waitFor(() => {
        expect(
          screen.getByText(/책 상태 이미지 \(5 \/ 5\)/)
        ).toBeInTheDocument();
        expect(screen.queryByLabelText("이미지 추가")).not.toBeInTheDocument();
      });
    });
  });

  describe("상세 내용 필드 유효성 검사", () => {
    it("상세 내용이 비어있을 때 에러 메시지를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const contentTextarea =
        screen.getByPlaceholderText(/책의 상태, 거래 방식 등/);

      await user.click(contentTextarea);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText("상세 내용은 10자 이상 입력해주세요.")
        ).toBeInTheDocument();
      });
    });

    it("상세 내용이 10자 미만일 때 에러 메시지를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const contentTextarea =
        screen.getByPlaceholderText(/책의 상태, 거래 방식 등/);

      await user.type(contentTextarea, "짧은 글");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText("상세 내용은 10자 이상 입력해주세요.")
        ).toBeInTheDocument();
      });
    });

    it("상세 내용이 1000자를 초과할 때 에러 메시지를 표시해야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      const contentTextarea =
        screen.getByPlaceholderText(/책의 상태, 거래 방식 등/);
      const longContent = "a".repeat(1001);

      await user.type(contentTextarea, longContent);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText("상세 내용은 1,000자를 초과할 수 없습니다.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("폼 제출 테스트", () => {
    it("모든 필드가 유효할 때 폼이 제출되어야 한다", async () => {
      const user = userEvent.setup();
      render(<BookSaleForm bookInfo={mockBookInfo} />);

      // 모든 필드 채우기
      await user.type(
        screen.getByPlaceholderText("판매글 제목을 입력하세요"),
        "깊이에의 강요 판매합니다"
      );
      await user.type(screen.getByPlaceholderText("숫자만 입력"), "10000");

      const citySelect = screen.getByRole("combobox", { name: /시\/도/ });
      await user.click(citySelect);

      await waitFor(() => {
        const portal = document.body;
        const seoulOption = within(portal).getByRole("option", {
          name: "서울특별시",
        });
        expect(seoulOption).toBeInTheDocument();
      });

      const portalAfterCity = document.body;
      const seoulOption = within(portalAfterCity).getByRole("option", {
        name: "서울특별시",
      });
      await user.click(seoulOption);

      await waitFor(() => {
        const districtSelect = screen.getByRole("combobox", {
          name: /시\/군\/구/,
        });
        expect(districtSelect).not.toBeDisabled();
      });

      const districtSelect = screen.getByRole("combobox", {
        name: /시\/군\/구/,
      });
      await user.click(districtSelect);

      await waitFor(() => {
        const portal = document.body;
        const options = within(portal).getAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
      });

      // 첫 번째 구 선택
      const portalAfterDistrict = document.body;
      const districtOptions =
        within(portalAfterDistrict).getAllByRole("option");
      await user.click(districtOptions[0]);

      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const fileInput = screen.getByLabelText("이미지 추가");
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText("Preview 0")).toBeInTheDocument();
      });

      await user.type(
        screen.getByPlaceholderText(/책의 상태, 거래 방식 등/),
        "책 상태 매우 좋습니다. 직거래 원합니다."
      );

      const submitButton = screen.getByRole("button", {
        name: "판매글 등록하기",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1);
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            imageFiles: expect.any(Array),
            payload: expect.objectContaining({
              title: "깊이에의 강요 판매합니다",
              price: "10000",
              city: "서울특별시",
              content: "책 상태 매우 좋습니다. 직거래 원합니다.",
              book: expect.objectContaining({
                isbn: "9788932920238",
                title: "깊이에의 강요",
              }),
            }),
          })
        );
      });
    });
  });
});
