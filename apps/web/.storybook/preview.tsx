import "../src/styles/globals.css";

import type { Preview } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import React, { useState } from "react";

import { useAuthStore } from "../src/features/auth/stores/use-auth-store";
import messages from "../src/shared/i18n/messages/ko.json";
import { gaegu } from "../src/styles/fonts";

/** 앱 레이아웃처럼 html에 건다. 포털로 뜨는 모달도 받게 */
if (typeof document !== "undefined") {
  document.documentElement.classList.add(gaegu.variable);
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
          <Story />
        </StoryQueryProvider>
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;
