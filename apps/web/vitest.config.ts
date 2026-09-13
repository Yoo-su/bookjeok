import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    testTimeout: 15000,
    // next-intl의 ESM 번들은 `next/server` 같은 서브패스를 확장자 없이 import한다.
    // pnpm 중첩 구조에서 Node 해석기가 이를 못 찾으므로 vite 해석기를 태운다.
    server: { deps: { inline: [/next-intl/] } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
