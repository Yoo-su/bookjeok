import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

import sharedConfig from "../../eslint.config.mjs";

const eslintConfig = tseslint.config(
  // 1. 기본적으로 모든 파일에 적용될 TypeScript 규칙
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // 2. Next.js 관련 규칙
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  ...sharedConfig,
  // 3. 아이콘은 iconsax 세트만 사용한다.
  //    components.json의 iconLibrary가 "lucide"라 shadcn CLI로 컴포넌트를 추가하면
  //    lucide-react import가 다시 생성되는데, 여기서 잡아 되돌아오는 것을 막는다.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              message:
                "아이콘은 @/shared/components/icons/iconsax를 사용하세요. 필요한 아이콘이 없으면 scripts/iconsax/mapping.mjs에 추가하고 pnpm --filter @bookjeok/web icons:gen을 실행하세요.",
            },
          ],
        },
      ],
      // 4. 라우트 경로는 PATHS 상수로 (루트 "/"와 외부 "//"는 허용)
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='router'][callee.property.name=/^(push|replace|prefetch)$/] > Literal[value=/^\\x2F(?!\\x2F)./]",
          message: "라우트 경로는 PATHS 상수를 사용하세요.",
        },
        {
          selector:
            "CallExpression[callee.object.name='router'][callee.property.name=/^(push|replace|prefetch)$/] > TemplateLiteral > TemplateElement:first-child[value.raw=/^\\x2F(?!\\x2F)./]",
          message: "라우트 경로는 PATHS 상수를 사용하세요.",
        },
        {
          selector:
            "JSXAttribute[name.name='href'] > Literal[value=/^\\x2F(?!\\x2F)./]",
          message: "라우트 경로는 PATHS 상수를 사용하세요.",
        },
      ],
    },
  },
);

export default eslintConfig;
