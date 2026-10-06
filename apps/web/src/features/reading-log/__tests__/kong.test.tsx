import * as apis from "@bookjeok/api-client";
import { readingLogKeys, User } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { KongOwnerRow } from "@/features/reading-log/components/kong/kong-owner-row";
import { KongVisitorRow } from "@/features/reading-log/components/kong/kong-visitor-row";

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@bookjeok/api-client")>()),
  sendKong: vi.fn(),
  getSentKongs: vi.fn(),
  getReceivedKongs: vi.fn(),
  getReadingLogSettings: vi.fn(),
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  usePathname: () => "/users/reader",
  Link: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: () => (key: string) => key,
}));

// 날아가는 연출은 실제 화면에서 확인한다. 여기서는 보낸 뒤 상태만 본다
vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => true,
}));

const LOG_ID = "11111111-1111-4111-8111-111111111111";

describe("콩 보내기 줄", () => {
  let queryClient: QueryClient;
  let seatHost: HTMLDivElement;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    seatHost = document.createElement("div");
    document.body.appendChild(seatHost);
  });

  const renderRow = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <KongVisitorRow
          logId={LOG_ID}
          handle="reader"
          nickname="독자"
          bookTitle="채식주의자"
          seatHost={seatHost}
        />
      </QueryClientProvider>,
    );

  it("비로그인이면 보내지 않고 로그인 말풍선을 띄운다", async () => {
    useAuthStore.setState({ user: null });
    renderRow();

    fireEvent.click(screen.getByRole("button", { name: "aria" }));

    expect(await screen.findByRole("status")).toHaveTextContent("login_bubble");
    expect(screen.getByRole("link", { name: "login" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(apis.getSentKongs).not.toHaveBeenCalled();
    expect(apis.sendKong).not.toHaveBeenCalled();
  });

  it("처음 보내면 서버에 한 번 보내고 표지 위에 내 콩을 앉힌다", async () => {
    useAuthStore.setState({ user: { id: 2, handle: "me" } as User });
    // 보낸 뒤 다시 받으면 서버 목록에 들어 있다
    vi.mocked(apis.getSentKongs)
      .mockResolvedValueOnce({ logIds: [] })
      .mockResolvedValue({ logIds: [LOG_ID] });
    vi.mocked(apis.sendKong).mockResolvedValue({ logId: LOG_ID, sent: true });
    renderRow();

    fireEvent.click(await screen.findByRole("button", { name: "aria" }));

    await waitFor(() => expect(apis.sendKong).toHaveBeenCalledWith(LOG_ID));
    expect(
      await screen.findByRole("button", { name: "seat_label" }),
    ).toBeInTheDocument();
    expect(seatHost).toContainElement(
      screen.getByRole("button", { name: "seat_label" }),
    );
    expect(screen.getByText("sent")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "aria" })).toBeNull();
  });

  it("이미 보낸 기록이면 보내기 버튼 없이 앉은 콩만 보인다", async () => {
    useAuthStore.setState({ user: { id: 2, handle: "me" } as User });
    vi.mocked(apis.getSentKongs).mockResolvedValue({ logIds: [LOG_ID] });
    renderRow();

    expect(
      await screen.findByRole("button", { name: "seat_label" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "aria" })).toBeNull();
  });

  it("보내기에 실패하면 앉은 콩을 거두고 버튼을 되돌린다", async () => {
    useAuthStore.setState({ user: { id: 2, handle: "me" } as User });
    vi.mocked(apis.getSentKongs).mockResolvedValue({ logIds: [] });
    vi.mocked(apis.sendKong).mockRejectedValue(new Error("network"));
    renderRow();

    fireEvent.click(await screen.findByRole("button", { name: "aria" }));

    expect(
      await screen.findByRole("button", { name: "aria" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "seat_label" })).toBeNull(),
    );
    expect(
      queryClient.getQueryData(readingLogKeys.kongsSent("reader").queryKey),
    ).toEqual({ logIds: [] });
  });
});

describe("내 기록의 콩 줄", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    vi.clearAllMocks();
  });

  const renderRow = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <KongOwnerRow logId={LOG_ID} />
      </QueryClientProvider>,
    );

  it("받은 콩이 있으면 수와 보낸 사람을 보여 준다", async () => {
    queryClient.setQueryData(readingLogKeys.settings.queryKey, {
      isReadingLogPublic: true,
    });
    queryClient.setQueryData(readingLogKeys.kongsReceived.queryKey, {
      total: 4,
      logs: [
        {
          logId: LOG_ID,
          date: "2026-10-05",
          book: {
            isbn: "9788936434595",
            title: "채식주의자",
            author: "한강",
            publisher: "창비",
            image: "",
          },
          count: 4,
          senders: ["하루", "민지", "모래", "책벌레"].map((nickname, i) => ({
            userId: i + 3,
            nickname,
            handle: `h${i}`,
            profileImageUrl: null,
          })),
          lastReceivedAt: "2026-10-07T00:00:00.000Z",
        },
      ],
    });
    renderRow();

    expect(screen.getByText("received")).toBeInTheDocument();
    // 셋을 넘으면 「외 N명」
    expect(screen.getByText("senders_more")).toBeInTheDocument();
  });

  it("비공개면 받을 수 없다고 알려 준다", async () => {
    queryClient.setQueryData(readingLogKeys.settings.queryKey, {
      isReadingLogPublic: false,
    });
    queryClient.setQueryData(readingLogKeys.kongsReceived.queryKey, {
      total: 0,
      logs: [],
    });
    renderRow();

    expect(screen.getByText("private")).toBeInTheDocument();
  });
});
