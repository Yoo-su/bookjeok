import { describe, expect, it } from "vitest";

import { createSignupSchema } from "@/features/auth/schema";

const schema = createSignupSchema((key) => key);

const errorsFor = (nickname: string) => {
  const result = schema.safeParse({
    email: "user@example.com",
    password: "Aa1!bbbb",
    passwordConfirm: "Aa1!bbbb",
    nickname,
    name: "홍길동",
  });
  return result.success
    ? []
    : result.error.issues
        .filter((issue) => issue.path[0] === "nickname")
        .map((issue) => issue.message);
};

describe("signup nickname", () => {
  it.each(["판다", "행복한 판다", "book_lover", " 판다 ", "가".repeat(20)])(
    "accepts the profile nickname rule: %p",
    (nickname) => {
      expect(errorsFor(nickname)).toEqual([]);
    },
  );

  it.each([
    ["가", "nickname_min"],
    ["가".repeat(21), "nickname_max"],
    ["두  칸", "nickname_invalid"],
    ["느낌표!", "nickname_invalid"],
  ])("rejects %p with %s", (nickname, message) => {
    expect(errorsFor(nickname)).toEqual([message]);
  });
});
