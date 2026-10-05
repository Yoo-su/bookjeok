import * as apis from "@bookjeok/api-client";
import {
  chatKeys,
  ChatMessage,
  ChatMessageType,
  ChatRoom,
  SaleAuthor,
  SaleStatus,
  TradeCompletion,
  TradeCompletionMethod,
  TradeMethod,
  tradeReviewKeys,
} from "@bookjeok/core";
import {
  useCompleteDirectTradeMutation,
  useInfiniteChatMessagesQuery,
  useMyChatRoomsQuery,
  useReserveSaleMutation,
} from "@bookjeok/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { DirectTradeBanner } from "@/features/chat/components/trade/direct-trade-banner";
import { useChatEvents } from "@/features/chat/hooks/use-chat-events";
import { useChatStore } from "@/features/chat/stores/use-chat-store";

const socket = vi.hoisted(() => ({ on: vi.fn(), off: vi.fn() }));

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@bookjeok/api-client")>()),
  getMyChatRooms: vi.fn(),
  getChatMessages: vi.fn(),
  getTradeCompletionByRoom: vi.fn(),
  getMyTradeReviewEligibility: vi.fn(),
  completeDirectTrade: vi.fn(),
  reserveSaleForBuyer: vi.fn(),
}));
vi.mock("@/shared/providers/socket-provider", () => ({
  useSocketContext: () => ({ socket, isConnected: true }),
}));
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));
vi.mock("@/features/confirm", () => ({ useConfirm: () => vi.fn() }));
// 거래 래퍼 훅이 판매글 상세 ISR을 비우는 서버 액션과 App Router를 쓴다
vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/shared/actions/revalidate", () => ({
  revalidateBookSale: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/features/trade/components/review/trade-review-modal", () => ({
  TradeReviewModal: () => null,
}));
vi.mock("@/features/auth/components/email-verification-alert", () => ({
  EmailVerificationModal: () => null,
}));

const seller: SaleAuthor = {
  id: 1,
  handle: "seller",
  nickname: "판매자",
  profileImageUrl: null,
};
const buyer: SaleAuthor = {
  ...seller,
  id: 2,
  handle: "buyer",
  nickname: "구매자",
};
const timestamp = "2026-10-04T00:00:00.000Z";
const initialRoom: ChatRoom = {
  id: 10,
  createdAt: timestamp,
  participants: [{ user: seller }, { user: buyer }],
  usedBookSale: {
    id: 100,
    title: "판매글",
    price: 10000,
    city: "서울",
    district: "강남구",
    content: "책 상태 좋습니다.",
    imageUrls: [],
    status: SaleStatus.RESERVED,
    reservedForUserId: buyer.id,
    tradeMethod: TradeMethod.DIRECT_ONLY,
    createdAt: timestamp,
    updatedAt: timestamp,
    user: seller,
    book: {
      isbn: "9788937460449",
      title: "데미안",
      author: "헤르만 헤세",
      publisher: "민음사",
      image: "https://cdn.bookjeok.com/test.webp",
      description: "책 소개",
      discount: "10000",
      pubdate: "2000-12-20",
      link: "",
    },
    viewCount: 0,
  },
};
const completion: TradeCompletion = {
  id: 99,
  saleId: initialRoom.usedBookSale.id,
  sellerId: seller.id,
  buyerId: buyer.id,
  chatRoomId: initialRoom.id,
  method: TradeCompletionMethod.DIRECT,
  orderId: null,
  completedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
};

let queryClient: QueryClient;
let serverCompleted: boolean;

const getServerRoom = (): ChatRoom => ({
  ...initialRoom,
  usedBookSale: {
    ...initialRoom.usedBookSale,
    status: serverCompleted ? SaleStatus.SOLD : SaleStatus.RESERVED,
  },
});

const BuyerRoom = () => {
  const { data: rooms } = useMyChatRoomsQuery();
  const { registerChatEventListeners, unregisterChatEventListeners } =
    useChatEvents();

  useEffect(() => {
    registerChatEventListeners();
    return unregisterChatEventListeners;
  }, [registerChatEventListeners, unregisterChatEventListeners]);

  return rooms?.[0] ? (
    <DirectTradeBanner room={rooms[0]} currentUser={buyer} opponent={seller} />
  ) : null;
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const reviewButton = () =>
  screen.queryByRole("button", {
    name: "chat.trade.status_banner.btn_write_review",
  });

const receiveMessage = (type: ChatMessageType) => {
  const message: ChatMessage = {
    id: 42,
    content: "거래가 완료되었습니다.",
    type,
    sender: null,
    isRead: true,
    chatRoom: { id: initialRoom.id },
    createdAt: timestamp,
    metadata: {
      saleId: initialRoom.usedBookSale.id,
      completionId: completion.id,
      tradeStatus: "COMPLETED",
    },
  };
  const handler = socket.on.mock.calls.find(
    ([event]) => event === "newMessage",
  )?.[1];
  expect(handler).toBeTypeOf("function");
  act(() => handler(message));
};

beforeEach(() => {
  vi.clearAllMocks();
  serverCompleted = false;
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  useAuthStore.setState({
    user: {
      ...buyer,
      provider: "email",
      providerId: "buyer",
      email: "buyer@example.com",
      isReadingLogPublic: true,
      role: "USER",
      isEmailVerified: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });
  useChatStore.setState({
    isChatOpen: true,
    activeChatRoomId: initialRoom.id,
    isRoomInactive: {},
  });
  vi.mocked(apis.getMyChatRooms).mockImplementation(async () => [
    getServerRoom(),
  ]);
  vi.mocked(apis.getChatMessages).mockResolvedValue({
    messages: [],
    hasNextPage: false,
  });
  vi.mocked(apis.getTradeCompletionByRoom).mockImplementation(async () =>
    serverCompleted ? completion : null,
  );
  vi.mocked(apis.getMyTradeReviewEligibility).mockImplementation(async () => ({
    canWrite: serverCompleted,
    myReview: null,
    expiresAt: null,
  }));
  // 완료 기록이 새로 조회되어도 이전 작성 가능 여부를 그대로 쓰면 버튼이 숨겨진다.
  queryClient.setQueryData(
    tradeReviewKeys.eligibility(completion.id).queryKey,
    {
      canWrite: false,
      myReview: null,
      expiresAt: null,
    },
  );
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  useChatStore.setState({ isChatOpen: false, activeChatRoomId: null });
  useAuthStore.setState({ user: null });
});

const openBuyerRoom = async () => {
  render(<BuyerRoom />, { wrapper });
  await waitFor(() =>
    expect(apis.getTradeCompletionByRoom).toHaveBeenCalledTimes(1),
  );
  expect(reviewButton()).not.toBeInTheDocument();
};

describe("거래 변경의 로컬·원격 캐시 동기화", () => {
  it.each([ChatMessageType.TRADE_ACTION, ChatMessageType.TRADE_STATUS])(
    "%s 수신 후 열린 구매자 채팅방에 후기 버튼이 나타난다",
    async (type) => {
      await openBuyerRoom();
      serverCompleted = true;

      receiveMessage(type);

      await waitFor(() => expect(reviewButton()).toBeInTheDocument());
      expect(
        queryClient.getQueryData<ChatRoom[]>(chatKeys.rooms.queryKey)?.[0]
          .usedBookSale.status,
      ).toBe(SaleStatus.SOLD);
      expect(apis.getMyTradeReviewEligibility).toHaveBeenCalledWith(
        completion.id,
      );
    },
  );

  it("일반 메시지는 거래 완료를 다시 조회하지 않는다", async () => {
    await openBuyerRoom();
    serverCompleted = true;

    receiveMessage(ChatMessageType.TEXT);

    expect(apis.getTradeCompletionByRoom).toHaveBeenCalledTimes(1);
    expect(reviewButton()).not.toBeInTheDocument();
  });

  it("원격 거래 갱신은 전송 중인 메시지를 보존한다", async () => {
    const pendingMessage: ChatMessage = {
      id: -1,
      clientMessageId: "pending",
      sendState: "sending",
      content: "전송 중인 메시지",
      type: ChatMessageType.TEXT,
      sender: buyer,
      isRead: false,
      chatRoom: { id: initialRoom.id },
      createdAt: timestamp,
    };
    queryClient.setQueryData(chatKeys.messages(initialRoom.id).queryKey, {
      pages: [{ messages: [pendingMessage], hasNextPage: false }],
      pageParams: [undefined],
    });
    const { result } = renderHook(
      () => useInfiniteChatMessagesQuery(initialRoom.id),
      { wrapper },
    );
    await openBuyerRoom();
    serverCompleted = true;

    receiveMessage(ChatMessageType.TRADE_ACTION);

    await waitFor(() => expect(reviewButton()).toBeInTheDocument());
    expect(apis.getChatMessages).not.toHaveBeenCalled();
    expect(result.current.data?.pages[0].messages).toEqual([
      expect.objectContaining({ id: 42 }),
      pendingMessage,
    ]);
  });

  it("로컬 완료 요청도 소켓 수신 없이 같은 후기 상태를 갱신한다", async () => {
    await openBuyerRoom();
    vi.mocked(apis.completeDirectTrade).mockImplementation(async () => {
      serverCompleted = true;
      return { sale: getServerRoom().usedBookSale, completion };
    });
    const { result } = renderHook(() => useCompleteDirectTradeMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        saleId: completion.saleId,
        buyerId: buyer.id,
        chatRoomId: initialRoom.id,
      });
    });

    await waitFor(() => expect(reviewButton()).toBeInTheDocument());
  });

  it("실패한 요청도 서버의 최신 거래 상태를 다시 확인한다", async () => {
    await openBuyerRoom();
    vi.mocked(apis.reserveSaleForBuyer).mockImplementation(async () => {
      // 요청 실패 사이에 다른 경로에서 거래가 완료된 경우를 재현한다.
      serverCompleted = true;
      throw new Error("response lost");
    });
    const { result } = renderHook(() => useReserveSaleMutation(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          saleId: completion.saleId,
          buyerId: buyer.id,
        }),
      ).rejects.toThrow("response lost");
    });

    await waitFor(() => expect(reviewButton()).toBeInTheDocument());
  });
});
