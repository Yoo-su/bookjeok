import {
  ChatMessage,
  ChatMessageType,
  ChatRoom,
  Order,
  orderKeys,
  OrderStatus,
  SaleAuthor,
  SaleStatus,
  TradeMethod,
} from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TradeMethodBadge } from "@/features/book-sale/components/common/trade-method-badge";
import { TradeMessageCard } from "@/features/chat/components/trade/trade-message-card";
import { TradeStatusBanner } from "@/features/chat/components/trade/trade-status-banner";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => {
    const t = (key: string, options?: Record<string, any>) => {
      if (options?.carrier && options?.trackingNumber) {
        return `${options.carrier} ${options.trackingNumber}`;
      }
      return `${section ? `${section}.` : ""}${key}`;
    };
    // rich 텍스트도 키 경로만 돌려주면 충분하다
    t.rich = (key: string) => t(key);
    return t;
  },
}));

vi.mock("@/features/confirm", () => ({
  useConfirm: () => vi.fn(),
}));

const mockSeller: SaleAuthor = {
  id: 1,
  nickname: "판매자",
  handle: "seller",
  profileImageUrl: null,
};

const mockBuyer: SaleAuthor = {
  id: 2,
  nickname: "구매자",
  handle: "buyer",
  profileImageUrl: null,
};

const mockRoom: ChatRoom = {
  id: 10,
  createdAt: "2026-08-27T00:00:00.000Z",
  participants: [{ user: mockSeller }, { user: mockBuyer }],
  usedBookSale: {
    id: 100,
    title: "클린 코드",
    price: 25000,
    city: "서울",
    district: "강남구",
    content: "책 상태 좋습니다.",
    imageUrls: ["https://example.com/book.jpg"],
    status: SaleStatus.FOR_SALE,
    tradeMethod: TradeMethod.BOTH,
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
    user: mockSeller,
    book: {
      isbn: "9788966260959",
      title: "Clean Code",
      author: "로버트 C. 마틴",
      publisher: "인사이트",
      image: "https://example.com/book.jpg",
      description: "클린 코드 책",
      discount: "30000",
      pubdate: "2013-12-24",
      link: "https://example.com/book",
    },
    viewCount: 10,
  },
};

/** 직거래 전용 판매글이 걸린 채팅방 */
const directOnlyRoom = (
  saleOverrides?: Partial<ChatRoom["usedBookSale"]>,
): ChatRoom => ({
  ...mockRoom,
  usedBookSale: {
    ...mockRoom.usedBookSale,
    tradeMethod: TradeMethod.DIRECT_ONLY,
    ...saleOverrides,
  },
});

describe("Phase 7 - Trade UI Components", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQuery = (ui: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );

  describe("TradeMethodBadge", () => {
    it("DIRECT_ONLY 거래방식을 올바르게 표시한다", () => {
      render(<TradeMethodBadge tradeMethod={TradeMethod.DIRECT_ONLY} />);
      expect(
        screen.getByText("market.trade_method.DIRECT_ONLY"),
      ).toBeInTheDocument();
    });

    it("DELIVERY_ONLY 거래방식을 올바르게 표시한다", () => {
      render(<TradeMethodBadge tradeMethod={TradeMethod.DELIVERY_ONLY} />);
      expect(
        screen.getByText("market.trade_method.DELIVERY_ONLY"),
      ).toBeInTheDocument();
    });

    it("BOTH 거래방식을 올바르게 표시한다", () => {
      render(<TradeMethodBadge tradeMethod={TradeMethod.BOTH} />);
      expect(screen.getByText("market.trade_method.BOTH")).toBeInTheDocument();
    });
  });

  describe("TradeMessageCard", () => {
    const tradeMessage = (metadata: Record<string, unknown>): ChatMessage => ({
      id: 9,
      content: "거래가 완료되었습니다.",
      isRead: true,
      type: ChatMessageType.TRADE_ACTION,
      metadata,
      createdAt: "2026-09-04T00:00:00.000Z",
      sender: null,
      chatRoom: { id: 10 },
    });

    it("직거래 완료 메시지를 주문 취소로 표시하지 않는다", () => {
      // metadata.status를 OrderStatus로만 해석하면 직거래 상태가 default
      // 분기(CANCELLED)로 떨어져 "주문 취소"로 보인다.
      renderWithQuery(
        <TradeMessageCard
          message={tradeMessage({
            saleId: 1,
            completionId: 3,
            tradeStatus: "COMPLETED",
          })}
          currentUserId={mockBuyer.id}
        />,
      );

      expect(
        screen.getByText("chat.trade.message_card.trade_title.COMPLETED"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("chat.trade.message_card.title.CANCELLED"),
      ).not.toBeInTheDocument();
    });

    it("직거래 예약 메시지도 전용 라벨로 표시한다", () => {
      renderWithQuery(
        <TradeMessageCard
          message={tradeMessage({ saleId: 1, tradeStatus: "RESERVED" })}
          currentUserId={mockBuyer.id}
        />,
      );

      expect(
        screen.getByText("chat.trade.message_card.trade_title.RESERVED"),
      ).toBeInTheDocument();
    });

    it("판매완료 안내도 전용 라벨로 표시한다", () => {
      // 상대를 지정하지 않고 완료했을 때 다른 채팅방에 나가는 안내다.
      renderWithQuery(
        <TradeMessageCard
          message={tradeMessage({ saleId: 1, tradeStatus: "SOLD" })}
          currentUserId={mockBuyer.id}
        />,
      );

      expect(
        screen.getByText("chat.trade.message_card.trade_title.SOLD"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          "chat.trade.message_card.trade_title.BACK_ON_MARKET",
        ),
      ).not.toBeInTheDocument();
    });

    it("AWAITING_PAYMENT 카드에 결제 요청 정보와 링크가 포함된다", () => {
      const message: ChatMessage = {
        id: 1,
        content: "판매자가 거래 상대로 선택했습니다. 결제를 진행해주세요.",
        isRead: true,
        type: ChatMessageType.TRADE_ACTION,
        metadata: {
          orderId: "ORD-50",
          status: OrderStatus.AWAITING_PAYMENT,
          amount: 25000,
        },
        createdAt: "2026-08-27T00:00:00.000Z",
        sender: null,
        chatRoom: { id: 10 },
      };

      renderWithQuery(
        <TradeMessageCard message={message} currentUserId={mockBuyer.id} />,
      );

      expect(
        screen.getByText("chat.trade.message_card.title.AWAITING_PAYMENT"),
      ).toBeInTheDocument();
      expect(screen.getByText(/25,000/)).toBeInTheDocument();
      expect(
        screen.getByText("chat.trade.message_card.btn_pay_now"),
      ).toBeInTheDocument();
    });

    it("SHIPPED 카드에 운송장 정보가 표시된다", () => {
      const message: ChatMessage = {
        id: 2,
        content: "판매자가 상품을 발송했습니다.",
        isRead: true,
        type: ChatMessageType.TRADE_STATUS,
        metadata: {
          orderId: "ORD-50",
          status: OrderStatus.SHIPPED,
          carrier: "CJ대한통운",
          trackingNumber: "1234567890",
        },
        createdAt: "2026-08-27T00:00:00.000Z",
        sender: null,
        chatRoom: { id: 10 },
      };

      renderWithQuery(
        <TradeMessageCard message={message} currentUserId={mockBuyer.id} />,
      );

      expect(
        screen.getByText("chat.trade.message_card.title.SHIPPED"),
      ).toBeInTheDocument();
      expect(screen.getByText("CJ대한통운 1234567890")).toBeInTheDocument();
    });

    it("취소되거나 만료된 주문의 결제 버튼 클릭 시 토스트를 표시한다", () => {
      const message: ChatMessage = {
        id: 3,
        content: "판매자가 회원님을 거래 상대로 지정했습니다.",
        isRead: true,
        type: ChatMessageType.TRADE_ACTION,
        metadata: {
          orderId: "ORD-100",
          status: OrderStatus.AWAITING_PAYMENT,
          amount: 25000,
        },
        createdAt: "2026-08-27T00:00:00.000Z",
        sender: null,
        chatRoom: { id: 10 },
      };

      // 주문이 이미 취소된 상태로 캐시 세팅
      queryClient.setQueryData(orderKeys.detail("ORD-100").queryKey, {
        id: "ORD-100",
        status: OrderStatus.CANCELLED,
        amount: 25000,
      });

      renderWithQuery(
        <TradeMessageCard message={message} currentUserId={mockBuyer.id} />,
      );

      const payButton = screen.getByText("chat.trade.message_card.btn_pay_now");
      expect(payButton).toBeInTheDocument();

      fireEvent.click(payButton);

      expect(toast.error).toHaveBeenCalledWith(
        "chat.trade.message_card.order_closed_toast",
      );
    });

    it("판매자에게는 AWAITING_PAYMENT 카드에서 결제하기 버튼이 숨겨지고 상세보기만 표시된다", () => {
      const message: ChatMessage = {
        id: 4,
        content: "구매자에게 결제를 요청했습니다.",
        isRead: true,
        type: ChatMessageType.TRADE_ACTION,
        metadata: {
          orderId: "ORD-200",
          status: OrderStatus.AWAITING_PAYMENT,
          amount: 18000,
        },
        createdAt: "2026-08-27T00:00:00.000Z",
        sender: null,
        chatRoom: {
          id: 10,
          usedBookSale: {
            id: 1,
            user: { id: mockSeller.id },
          } as any,
        },
      };

      queryClient.setQueryData(orderKeys.detail("ORD-200").queryKey, {
        id: "ORD-200",
        sellerId: mockSeller.id,
        buyerId: mockBuyer.id,
        status: OrderStatus.AWAITING_PAYMENT,
        amount: 18000,
      });

      renderWithQuery(
        <TradeMessageCard message={message} currentUserId={mockSeller.id} />,
      );

      // 판매자이므로 결제 버튼은 없고 주문 상세보기 버튼만 존재해야 함
      expect(
        screen.queryByText("chat.trade.message_card.btn_pay_now"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("chat.trade.message_card.btn_view_detail"),
      ).toBeInTheDocument();
    });
  });

  describe("TradeStatusBanner", () => {
    it("주문이 없고 판매자일 때 '구매자로 지정' 버튼을 렌더링한다", () => {
      renderWithQuery(
        <TradeStatusBanner
          room={mockRoom}
          currentUser={mockSeller}
          opponent={mockBuyer}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.btn_select_buyer"),
      ).toBeInTheDocument();
    });

    it("직거래 전용 상품에서 구매자에게는 직거래 안내를 보여준다", () => {
      renderWithQuery(
        <TradeStatusBanner
          room={directOnlyRoom()}
          currentUser={mockBuyer}
          opponent={mockSeller}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.direct_only_hint"),
      ).toBeInTheDocument();
    });

    it("직거래 전용 상품에서 판매자에게는 거래 상대 지정 버튼을 보여준다", () => {
      renderWithQuery(
        <TradeStatusBanner
          room={directOnlyRoom()}
          currentUser={mockSeller}
          opponent={mockBuyer}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.btn_reserve_buyer"),
      ).toBeInTheDocument();
    });

    it("직거래가 다른 구매자와 예약되면 대기 안내를 보여준다", () => {
      const reservedRoom = directOnlyRoom({
        status: SaleStatus.RESERVED,
        reservedForUserId: 999,
      });

      renderWithQuery(
        <TradeStatusBanner
          room={reservedRoom}
          currentUser={mockBuyer}
          opponent={mockSeller}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.other_trading_hint"),
      ).toBeInTheDocument();
    });

    it("직거래 예약 상대인 판매자에게는 거래 완료 버튼을 보여준다", () => {
      const reservedRoom = directOnlyRoom({
        status: SaleStatus.RESERVED,
        reservedForUserId: mockBuyer.id,
      });

      renderWithQuery(
        <TradeStatusBanner
          room={reservedRoom}
          currentUser={mockSeller}
          opponent={mockBuyer}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.btn_complete_trade"),
      ).toBeInTheDocument();
    });

    it("상대 없이 예약중이어도 판매자는 거래 완료 흐름에 접근할 수 있다", () => {
      // 마이페이지에서 상대 지정 없이 예약중으로 바꾸면 reservedForUserId가
      // 비어 있다. 이때 "다른 구매자와 거래 중" 분기에 판매자까지 걸리면
      // 자기 판매글의 거래를 끝낼 방법이 사라진다.
      const reservedRoom = directOnlyRoom({
        status: SaleStatus.RESERVED,
        reservedForUserId: null,
      });

      renderWithQuery(
        <TradeStatusBanner
          room={reservedRoom}
          currentUser={mockSeller}
          opponent={mockBuyer}
        />,
      );

      expect(
        screen.queryByText("chat.trade.status_banner.other_trading_hint"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("chat.trade.status_banner.btn_reserve_buyer"),
      ).toBeInTheDocument();
    });

    it("상대 없는 예약중은 구매자에게 특정인을 암시하지 않는다", () => {
      const reservedRoom = directOnlyRoom({
        status: SaleStatus.RESERVED,
        reservedForUserId: null,
      });

      renderWithQuery(
        <TradeStatusBanner
          room={reservedRoom}
          currentUser={mockBuyer}
          opponent={mockSeller}
        />,
      );

      expect(
        screen.getByText(
          "chat.trade.status_banner.reserved_no_counterparty_hint",
        ),
      ).toBeInTheDocument();
    });

    it("다른 분과 예약된 판매글에서는 판매자에게 지정 버튼을 숨긴다", () => {
      const reservedRoom = directOnlyRoom({
        status: SaleStatus.RESERVED,
        reservedForUserId: 999,
      });

      renderWithQuery(
        <TradeStatusBanner
          room={reservedRoom}
          currentUser={mockSeller}
          opponent={mockBuyer}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.seller_reserved_elsewhere"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("chat.trade.status_banner.btn_reserve_buyer"),
      ).not.toBeInTheDocument();
    });

    it("결제 기능이 봉인돼 있어도 직거래 안내는 계속 렌더링한다", () => {
      // 결제 플래그로 배너 전체를 조기 return 하면 직거래 채팅방에서
      // 거래 안내가 통째로 사라진다. 직거래는 결제와 무관하게 동작해야 한다.
      const original = process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED;
      process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED = "false";

      try {
        renderWithQuery(
          <TradeStatusBanner
            room={directOnlyRoom()}
            currentUser={mockSeller}
            opponent={mockBuyer}
          />,
        );

        expect(
          screen.getByText("chat.trade.status_banner.btn_reserve_buyer"),
        ).toBeInTheDocument();
      } finally {
        process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED = original;
      }
    });

    it("결제 기능이 봉인되면 택배 거래글에서는 구매자 선택 UI를 숨긴다", () => {
      const original = process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED;
      process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED = "false";

      try {
        const { container } = renderWithQuery(
          <TradeStatusBanner
            room={mockRoom}
            currentUser={mockSeller}
            opponent={mockBuyer}
          />,
        );

        expect(
          screen.queryByText("chat.trade.status_banner.btn_select_buyer"),
        ).not.toBeInTheDocument();
        expect(container).toBeEmptyDOMElement();
      } finally {
        process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED = original;
      }
    });

    it("상대방이 채팅방을 나갔을 때 '상대방이 대화방을 나갔습니다' 안내를 렌더링한다", () => {
      const leftRoom: ChatRoom = {
        ...mockRoom,
        participants: [
          { user: mockSeller, isActive: true },
          { user: mockBuyer, isActive: false },
        ],
      };

      renderWithQuery(
        <TradeStatusBanner
          room={leftRoom}
          currentUser={mockSeller}
          opponent={mockBuyer}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.opponent_left_hint"),
      ).toBeInTheDocument();
    });

    it("상대방이 채팅방을 나갔어도 예약된 상태라면 판매자에게 예약 취소 버튼을 노출한다", () => {
      const leftReservedRoom: ChatRoom = {
        ...directOnlyRoom({
          status: SaleStatus.RESERVED,
          reservedForUserId: mockBuyer.id,
        }),
        participants: [
          { user: mockSeller, isActive: true },
          { user: mockBuyer, isActive: false },
        ],
      };

      renderWithQuery(
        <TradeStatusBanner
          room={leftReservedRoom}
          currentUser={mockSeller}
          opponent={mockBuyer}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.opponent_left_hint"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("chat.trade.status_banner.btn_cancel_reservation"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("chat.trade.status_banner.btn_complete_trade"),
      ).not.toBeInTheDocument();
    });
  });
});
