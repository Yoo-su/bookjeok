"use client";

import {
  useInfiniteQuery,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { getChatMessages, getMyChatRooms } from "./apis";
import { ChatRoom } from "./types";

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
