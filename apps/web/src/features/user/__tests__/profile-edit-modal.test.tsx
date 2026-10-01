import * as apis from "@bookjeok/api-client";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ko from "@/shared/i18n/messages/ko.json";

import { ProfileEditModal } from "../components/profile/profile-edit-modal";

const messages = ko.my_page.edit_modal;
const mockUpdateProfile = vi.fn();
const mockSetUser = vi.fn();

vi.mock("@bookjeok/api-client", () => ({
  checkNickname: vi.fn(),
}));

vi.mock("@/features/user/mutations", () => ({
  useUpdateUserMutation: () => ({ mutateAsync: mockUpdateProfile }),
}));

// 실제 스토어처럼 같은 객체를 돌려줘야 모달의 초기화 effect가 렌더마다 다시 돌지 않는다
const authState = vi.hoisted(() => ({
  user: {
    id: 1,
    provider: "kakao",
    handle: "reader42",
    nickname: "행복한 판다",
    email: "reader@example.com",
    profileImageUrl: "default_profile1",
    name: null,
    gender: null,
    ageRange: null,
  },
  setUser: (..._args: unknown[]) => {},
  accessToken: "token",
}));

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) =>
    selector(authState),
}));

vi.mock("@vercel/blob/client", () => ({ upload: vi.fn() }));

vi.mock("next-intl", async () => {
  const { createIntlMock } = await import("@/__tests__/helpers/intl");
  return createIntlMock();
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// 보이지 않는 문자는 소스에 그대로 쓰면 읽을 수 없어 코드 포인트로 만든다
const HANGUL_FILLER = String.fromCharCode(0x3164);
const DECOMPOSED_GANA = String.fromCharCode(0x1100, 0x1161, 0x1102, 0x1161);

const openModal = () => {
  render(<ProfileEditModal trigger={<button type="button">열기</button>} />);
  fireEvent.click(screen.getByText("열기"));
};

const typeNickname = (value: string) =>
  fireEvent.change(screen.getByLabelText(messages.nickname_label), {
    target: { value },
  });

const saveButton = () => screen.getByRole("button", { name: messages.save });

describe("ProfileEditModal 닉네임", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.setUser = mockSetUser;
    vi.mocked(apis.checkNickname).mockResolvedValue({ available: true });
    mockUpdateProfile.mockResolvedValue({});
  });

  it("앞뒤 공백과 자모 분리 입력을 정규화해 중복 확인하고 저장한다", async () => {
    openModal();
    typeNickname(` ${DECOMPOSED_GANA} `);

    await waitFor(() =>
      expect(apis.checkNickname).toHaveBeenCalledWith("가나"),
    );
    await waitFor(() => expect(saveButton()).toBeEnabled());

    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith({ nickname: "가나" }),
    );
    expect(mockSetUser).toHaveBeenCalledWith(
      expect.objectContaining({ nickname: "가나" }),
    );
  });

  it("보이지 않는 문자로 만든 닉네임은 중복 확인 전에 막는다", async () => {
    openModal();
    typeNickname(HANGUL_FILLER.repeat(2));

    expect(
      await screen.findByText(messages.nickname_invalid),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(apis.checkNickname).not.toHaveBeenCalled();
  });

  it("한글 조합 중 잠깐 낀 자모로는 형식 오류를 띄우지 않는다", async () => {
    openModal();
    typeNickname("독ㅈ");
    expect(
      screen.queryByText(messages.nickname_invalid),
    ).not.toBeInTheDocument();
    // 조합 중에도 확인 전이라 저장은 잠겨 있다
    expect(saveButton()).toBeDisabled();
    typeNickname("독자");

    await waitFor(() =>
      expect(apis.checkNickname).toHaveBeenCalledWith("독자"),
    );
    expect(apis.checkNickname).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText(messages.nickname_invalid),
    ).not.toBeInTheDocument();
  });

  it("비우면 최소 길이 안내를 띄우고 저장을 막는다", async () => {
    openModal();
    typeNickname("   ");

    expect(await screen.findByText(messages.nickname_min)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("앞뒤 공백만 붙인 현재 닉네임은 바뀐 것으로 보지 않는다", async () => {
    openModal();
    typeNickname(" 행복한 판다 ");

    expect(saveButton()).toBeEnabled();
    fireEvent.click(saveButton());

    // 바뀐 것이 없으면 요청 없이 모달만 닫는다
    await waitFor(() =>
      expect(
        screen.queryByLabelText(messages.nickname_label),
      ).not.toBeInTheDocument(),
    );
    expect(apis.checkNickname).not.toHaveBeenCalled();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("입력을 바꾼 뒤 늦게 도착한 이전 중복 확인 결과는 버린다", async () => {
    let resolveFirst: (value: { available: boolean }) => void = () => {};
    vi.mocked(apis.checkNickname)
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve)),
      )
      .mockResolvedValueOnce({ available: true });

    openModal();
    typeNickname("첫번째닉네임");
    await waitFor(() => expect(apis.checkNickname).toHaveBeenCalledTimes(1));

    typeNickname("두번째닉네임");
    expect(
      await screen.findByText(messages.nickname_available),
    ).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();

    // 이전 입력의 "사용 중" 응답이 이제 도착해도 지금 입력의 결과를 덮으면 안 된다
    resolveFirst({ available: false });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.queryByText(messages.nickname_taken)).not.toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
  });
});
