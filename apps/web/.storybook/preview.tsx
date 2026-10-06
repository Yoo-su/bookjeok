import "../src/styles/globals.css";

import type { Preview } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import React, { useState } from "react";

import { useAuthStore } from "../src/features/auth/stores/use-auth-store";
import messages from "../src/shared/i18n/messages/ko.json";
import { MotionProvider } from "../src/shared/providers/motion-provider";
import { gaegu, gowun_batang } from "../src/styles/fonts";

/** 앱 레이아웃처럼 html에 건다. 포털로 뜨는 모달도 받게 */
if (typeof document !== "undefined") {
  document.documentElement.classList.add(gaegu.variable, gowun_batang.variable);
}

/**
 * 스토리마다 새 캐시. 로컬에 API가 없으니 재시도하지 않는다.
 * 자기 QueryClientProvider를 둔 스토리는 안쪽 것이 이긴다
 */
function StoryQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const preview: Preview = {
  /**
   * 인증 스토어는 localStorage(auth-storage)에 남아 다음 스토리로 번진다.
   * 로그인 스토리가 넣은 사용자가 비로그인 스토리를 깨지 않게 매번 비로그인으로 시작한다
   */
  beforeEach: () => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
    });
    localStorage.removeItem("auth-storage");
  },
  parameters: {
    // 공용 부품 → 기능 → 레이아웃 순. 폴더 구조와 같게 둔다
    options: {
      storySort: { order: ["Shared", "Features", "Layouts"] },
    },
    // 북적이 맞추는 폭. 320은 레이아웃 p-4를 빼면 288px만 남는 가장 좁은 기기
    viewport: {
      viewports: {
        narrow: {
          name: "좁은 휴대폰 320",
          styles: { width: "320px", height: "640px" },
          type: "mobile",
        },
        mobile: {
          name: "휴대폰 375",
          styles: { width: "375px", height: "812px" },
          type: "mobile",
        },
        tablet: {
          name: "태블릿 768",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "데스크톱 1280",
          styles: { width: "1280px", height: "800px" },
          type: "desktop",
        },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ko" messages={messages}>
        <StoryQueryProvider>
          {/* 앱 레이아웃과 같이 "동작 줄이기" 설정을 따른다 */}
          <MotionProvider>
            <Story />
          </MotionProvider>
        </StoryQueryProvider>
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;
