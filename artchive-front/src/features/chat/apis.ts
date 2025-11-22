import { API_PATHS } from "@/shared/constants/apis";
import { privateAxios } from "@/shared/libs/axios";

import { ChatRoom, GetChatMessagesResponse } from "./types";

/**
 * 특정 판매글에 대한 채팅방을 찾거나 생성하는 API
 * @param saleId - 판매글 ID
 */
export const findOrCreateRoom = async (saleId: number): Promise<ChatRoom> => {
  const { data } = await privateAxios.post<ChatRoom>(API_PATHS.chat.rooms, {
    saleId,
  });
  return data;
};

/**
 * 현재 로그인한 유저의 모든 채팅방 목록을 조회하는 API
 */
export const getMyChatRooms = async (): Promise<ChatRoom[]> => {
  const { data } = await privateAxios.get<ChatRoom[]>(API_PATHS.chat.rooms);
  return data;
};

/**
 * 특정 채팅방의 메시지 목록을 페이지네이션으로 조회하는 API
 */
export const getChatMessages = async (
  roomId: number,
  page: number,
  limit: number = 20
): Promise<GetChatMessagesResponse> => {
  const { data } = await privateAxios.get<GetChatMessagesResponse>(
    API_PATHS.chat.messages(roomId),
    { params: { page, limit } }
  );
  return data;
};

/**
 * 특정 채팅방의 메시지를 모두 읽음으로 처리하는 API 함수
 */
export const markMessagesAsRead = async (roomId: number) => {
  const { data } = await privateAxios.patch(API_PATHS.chat.read(roomId));
  return data;
};

/**
 * 채팅방을 나가는 API
 * @param roomId - 나갈 채팅방의 ID
 */
export const leaveChatRoom = async (roomId: number) => {
  const { data } = await privateAxios.delete(API_PATHS.chat.room(roomId));
  return data;
};
