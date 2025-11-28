// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import nextPlugin from "@next/eslint-plugin-next";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import typescriptEslint from "typescript-eslint";

const eslintConfig = [// 1. 기본적으로 모든 파일에 적용될 TypeScript 규칙
...typescriptEslint.configs.recommended, {
  languageOptions: {
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
}, // 2. Next.js 관련 규칙
{
  plugins: {
    "@next/next": nextPlugin,
  },
  rules: {
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs["core-web-vitals"].rules,
  },
}, // 3. Import 순서 정렬 규칙
{
  plugins: {
    "simple-import-sort": simpleImportSort,
  },
  rules: {
    // 이 규칙을 다시 "error"로 설정하여 코드 품질을 유지하는 것을 권장합니다.
    // 만약 빌드가 또 실패하면, VS Code의 'Fix all auto-fixable problems' 기능으로
    // import 순서를 자동으로 정리한 후 다시 시도해 보세요.
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
}, // 4. 특정 규칙 비활성화 (필요에 따라 추가)
{
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unsafe-function-type": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;
