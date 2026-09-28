import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";

/**
 * 전역 코딩 컨벤션을 위한 공유 ESLint 설정 (Flat Config)
 */
export const sharedConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/no-explicit-any": "off",
      // 쓰지 않는 import·변수가 쌓이지 않게 막는다. 매개변수와 catch 변수는
      // 시그니처를 맞추느라 남기는 경우가 많아 검사하지 않는다.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "none",
          caughtErrors: "none",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
  {
    // apps/admin은 미사용 앱이라 코드 정리 대상이 아니다(AGENTS.md). 자체 설정 없이
    // 이 파일을 쓰므로 여기서만 끈다. 다른 앱은 각자 위치 기준이라 이 패턴에 걸리지 않는다.
    files: ["apps/admin/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);

export default sharedConfig;
