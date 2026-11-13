import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { consumeReturnUrl } from "@/features/auth/utils/return-url";
import {
  consumeSessionToast,
  hardRedirect,
  markSessionToast,
  redirectToLogin,
} from "@/shared/utils/session";

const originalLocation = window.location;
const replace = vi.fn();

/** window.location을 읽고 쓸 수 있는 더미로 교체 (jsdom은 실제 이동을 지원하지 않음) */
const stubLocation = (pathname: string) => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: Object.assign(new URL(pathname, "https://bookjeok.com"), {
      replace,
    }),
  });
};

describe("세션 종료 유틸", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    replace.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  describe("hardRedirect", () => {
    it("현재 로케일을 유지한 채 이동한다", () => {
      stubLocation("/en/my-page");
      hardRedirect("/login");
      expect(replace).toHaveBeenCalledWith("/en/login");
    });

    it("로케일을 알 수 없으면 기본 로케일(ko)로 이동한다", () => {
      stubLocation("/my-page");
      hardRedirect("/login");
      expect(replace).toHaveBeenCalledWith("/ko/login");
    });

    it("홈(/)은 로케일 경로만 남긴다 — 중복 슬래시로 리다이렉트가 한 번 더 돌지 않도록", () => {
      stubLocation("/ko/book/market");
      hardRedirect("/");
      expect(replace).toHaveBeenCalledWith("/ko");
    });
  });

  it("세션 만료 시 보고 있던 검색 결과와 위치를 복귀 주소로 넘긴다", () => {
    stubLocation("/en/book/market?search=books#listings");
    redirectToLogin();
    expect(replace).toHaveBeenCalledWith("/en/login");
    expect(consumeReturnUrl()).toEqual({
      href: "/book/market?search=books#listings",
      locale: "en",
    });
    expect(consumeReturnUrl()).toBeNull();
  });

  describe("세션 토스트 인계", () => {
    it("예약한 메시지를 한 번만 꺼낸다", () => {
      markSessionToast("로그아웃되었습니다");

      expect(consumeSessionToast()).toBe("로그아웃되었습니다");
      expect(consumeSessionToast()).toBeNull();
    });

    it("예약된 메시지가 없으면 null을 돌려준다", () => {
      expect(consumeSessionToast()).toBeNull();
    });
  });
});
