import { describe, expect, it } from "vitest";

import { commentKeys } from "../query-keys";
import { CommentTargetType } from "../types";

describe("commentKeys.list", () => {
  it("같은 댓글 페이지라도 조회 사용자가 다르면 별도 캐시를 사용한다", () => {
    const anonymousKey = commentKeys.list(
      CommentTargetType.REVIEW,
      "42",
      1,
      undefined,
    ).queryKey;
    const firstUserKey = commentKeys.list(
      CommentTargetType.REVIEW,
      "42",
      1,
      10,
    ).queryKey;
    const secondUserKey = commentKeys.list(
      CommentTargetType.REVIEW,
      "42",
      1,
      20,
    ).queryKey;

    expect(anonymousKey).not.toEqual(firstUserKey);
    expect(firstUserKey).not.toEqual(secondUserKey);
  });
});
