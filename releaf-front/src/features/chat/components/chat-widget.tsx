"use client";

import { AnimatePresence, motion } from "framer-motion";

import { Card } from "@/shared/components/shadcn/card";

import { useChatStore } from "../stores/use-chat-store";
import { ChatList } from "./chat-list";
import { ChatRoom } from "./chat-room";

export const ChatWidget = () => {
  const { isChatOpen, activeChatRoomId } = useChatStore();

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed bottom-24 right-6 z-[999] h-[70vh] w-[90vw] max-w-sm"
        >
          <Card className="h-full w-full flex flex-col shadow-2xl overflow-hidden">
            {activeChatRoomId ? <ChatRoom /> : <ChatList />}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
