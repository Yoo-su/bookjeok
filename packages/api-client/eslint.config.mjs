import tseslint from "typescript-eslint";

import sharedConfig from "../../eslint.config.mjs";

export default tseslint.config(
  ...sharedConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // 의존 방향 core → api-client → react-query → 앱
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@bookjeok/react-query",
              message: "api-client는 react-query에 의존하지 않습니다.",
            },
          ],
        },
      ],
    },
  },
);
