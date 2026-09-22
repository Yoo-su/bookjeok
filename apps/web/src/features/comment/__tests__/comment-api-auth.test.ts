import "@/shared/libs/axios";

import {
  getComments,
  privateApiClient,
  publicApiClient,
} from "@bookjeok/api-client";
import { CommentTargetType } from "@bookjeok/core";
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

const emptyCommentsResponse = {
  data: [],
  meta: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

describe("getComments authentication", () => {
  const originalPrivateAdapter = privateApiClient.defaults.adapter;
  const originalPublicAdapter = publicApiClient.defaults.adapter;
  let authorizationHeader: string | undefined;

  beforeEach(() => {
    authorizationHeader = undefined;

    const adapter = async (config: InternalAxiosRequestConfig) => {
      authorizationHeader = config.headers.get("Authorization")?.toString();

      return {
        data: emptyCommentsResponse,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
        config,
      };
    };

    privateApiClient.defaults.adapter = adapter;
    publicApiClient.defaults.adapter = adapter;
  });

  afterEach(() => {
    privateApiClient.defaults.adapter = originalPrivateAdapter;
    publicApiClient.defaults.adapter = originalPublicAdapter;
    useAuthStore.getState().clearAuth();
  });

  it("로그인 상태에서는 댓글 목록 요청에 액세스 토큰을 포함한다", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "comment-access-token",
      refreshToken: "comment-refresh-token",
    });

    await getComments({
      targetType: CommentTargetType.REVIEW,
      targetId: "42",
      page: 1,
      limit: 10,
    });

    expect(authorizationHeader).toBe("Bearer comment-access-token");
  });

  it("비로그인 상태에서도 댓글 목록을 조회할 수 있다", async () => {
    const result = await getComments({
      targetType: CommentTargetType.REVIEW,
      targetId: "42",
      page: 1,
      limit: 10,
    });

    expect(authorizationHeader).toBeUndefined();
    expect(result).toEqual(emptyCommentsResponse);
  });

  it("댓글 조회에서 액세스 토큰이 만료되면 갱신 후 다시 요청한다", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "expired-access-token",
      refreshToken: "valid-refresh-token",
    });

    const requestTokens: Array<string | undefined> = [];
    privateApiClient.defaults.adapter = async (config) => {
      requestTokens.push(config.headers.get("Authorization")?.toString());

      if (requestTokens.length === 1) {
        throw new AxiosError(
          "Unauthorized",
          "ERR_BAD_REQUEST",
          config,
          undefined,
          {
            data: {},
            status: 401,
            statusText: "Unauthorized",
            headers: new AxiosHeaders(),
            config,
          },
        );
      }

      return {
        data: emptyCommentsResponse,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
        config,
      };
    };
    publicApiClient.defaults.adapter = async (config) => ({
      data: {
        accessToken: "renewed-access-token",
        refreshToken: "renewed-refresh-token",
      },
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config,
    });

    const result = await getComments({
      targetType: CommentTargetType.REVIEW,
      targetId: "42",
      page: 1,
      limit: 10,
    });

    expect(result).toEqual(emptyCommentsResponse);
    expect(requestTokens).toEqual([
      "Bearer expired-access-token",
      "Bearer renewed-access-token",
    ]);
  });
});
