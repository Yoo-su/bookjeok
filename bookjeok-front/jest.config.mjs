import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공합니다.
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // 각 테스트 전에 Jest 환경을 설정하는 파일을 지정합니다.
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // 브라우저 환경을 시뮬레이션합니다.
  testEnvironment: "jest-environment-jsdom",

  // TypeScript 경로 별칭(@/...)을 Jest가 이해할 수 있도록 매핑합니다.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // .ts/.tsx 파일을 @swc/jest로 변환하도록 설정합니다.
  transform: {
    "^.+\\.(ts|tsx)$": "@swc/jest",
  },

  // 테스트할 파일 패턴
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx?|ts?)$",
};

// createJestConfig를 호출하여 Next.js 설정을 Jest 구성에 로드합니다.
export default createJestConfig(customJestConfig);
