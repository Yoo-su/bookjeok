import { createQueryKeys } from "@lukemorales/query-key-factory";

export const chatKeys = createQueryKeys("chat", {
  rooms: null,
  messages: (roomId: number) => [roomId],
});
