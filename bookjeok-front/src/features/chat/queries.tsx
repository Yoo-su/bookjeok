"use client";

import {
  useInfiniteQuery,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { getChatMessages, getMyChatRooms } from "./apis";
import { ChatRoom } from "./types";

/**
 * 내 채팅방 목록을 조회하는 쿼리 훅입니다.
 */
export const useMyChatRoomsQuery = (
  options?: Omit<UseQueryOptions<ChatRoom[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: QUERY_KEYS.chatKeys.rooms.queryKey,
    queryFn: getMyChatRooms,
    staleTime: Infinity,
    ...options,
  });
};

/**
 * 채팅 메시지 목록을 조회하는 무한 스크롤 쿼리 훅입니다.
 * @param roomId 채팅방 ID
 */
export const useInfiniteChatMessagesQuery = (roomId: number | null) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.chatKeys.messages(roomId!).queryKey,
    queryFn: ({ pageParam = 1 }) => getChatMessages(roomId!, pageParam),
    initialPageParam: 1,
    getPreviousPageParam: (firstPage, allPages) => {
      return firstPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    getNextPageParam: () => undefined,
    enabled: !!roomId,
    refetchOnWindowFocus: false,
  });
};
