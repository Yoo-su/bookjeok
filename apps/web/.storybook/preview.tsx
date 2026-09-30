import "../src/styles/globals.css";

import type { Preview } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import React from "react";

import messages from "../src/shared/i18n/messages/ko.json";
import { gaegu } from "../src/styles/fonts";

/** 앱 레이아웃처럼 html에 건다. 포털로 뜨는 모달도 받게 */
if (typeof document !== "undefined") {
  document.documentElement.classList.add(gaegu.variable);
}

const preview: Preview = {
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
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;
