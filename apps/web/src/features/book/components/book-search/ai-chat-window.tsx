"use client";

import { motion } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import remarkGfm from "remark-gfm";

import { RotateCcw, Send } from "@/shared/components/icons/iconsax";
import { Particles } from "@/shared/components/magicui/particles";
import { Input } from "@/shared/components/shadcn/input";
import { Spinner } from "@/shared/components/shadcn/spinner";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { gowun_batang } from "@/styles/fonts";

import { AI_CHAT_SUGGESTION_CHIPS, ChatMessage } from "../../constants/ai-chat";
import { useAiChat } from "../../hooks/use-ai-chat";
import { AiBookRecommendSlider } from "./ai-book-recommend-slider";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
});

export const AiChatWindow = () => {
  const t = useTranslations("book.ai_chat_window");
  const {
    isLoggedIn,
    messages,
    input,
    setInput,
    loading,
    chatContainerRef,
    handleSendMessage,
    handleClearChat,
  } = useAiChat();

  const suggestionChips =
    (t.raw("suggestion_chips") as string[]) || AI_CHAT_SUGGESTION_CHIPS;

  return (
    <div className="relative w-full bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col h-[680px] overflow-hidden">
      {/* 배경 Particles 효과 */}
      <Particles
        className="z-0 pointer-events-none"
        quantity={35}
        color="#71717a"
        ease={60}
      />

      {/* 1. 헤더 */}
      <div className="relative z-10 px-5 py-3.5 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2
            className={`text-base sm:text-lg font-bold text-stone-800 tracking-tight ${gowun_batang.className}`}
          >
            {t("title")}
          </h2>
          {!isLoggedIn && (
            <span className="text-[11px] text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">
              {t("members_only")}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-1 text-xs text-stone-500 hover:text-stone-900 border border-stone-200 rounded-md bg-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t("clear_chat")}</span>
        </button>
      </div>

      {/* 2. 대화 타임라인 (내부 독립 스크롤 & overscroll-contain & stable-scroll) */}
      <div
        ref={chatContainerRef}
        className="relative z-10 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 custom-scrollbar stable-scroll"
      >
        {messages.map((msg: ChatMessage) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* 메시지 말풍선 */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-stone-900 text-white rounded-br-xs shadow-xs"
                  : "bg-stone-100/90 text-stone-800 rounded-bl-xs border border-stone-200/60 shadow-2xs"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-stone-700">
                  <Image
                    src="/icons/reindeer-face.svg"
                    alt="Bookjeok AI"
                    width={16}
                    height={16}
                    className="w-4 h-4 shrink-0"
                    unoptimized
                  />
                  <span>Bookjeok AI</span>
                </div>
              )}

              {/* 로딩 / 상태 메시지 표시 */}
              {msg.isStreaming && !msg.content ? (
                <div className="flex items-center gap-2 py-0.5 text-stone-500 text-xs">
                  <Spinner className="size-3.5 text-stone-500" />
                  <span className="text-stone-600 font-medium">
                    {msg.statusMessage || t("ai_preparing")}
                  </span>
                </div>
              ) : (
                <div className="prose prose-stone prose-sm max-w-none break-words leading-relaxed text-inherit font-[family-name:var(--font-pretendard)]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 mb-2 space-y-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 mb-2 space-y-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-xs sm:text-sm">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-stone-900">
                          {children}
                        </strong>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* 도서 추천 슬라이더 카드 (도서 목록이 포함된 경우) */}
            {msg.books && msg.books.length > 0 && (
              <div className="w-full mt-3">
                <AiBookRecommendSlider books={msg.books} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* 3. 비로그인 안내 */}
      {!isLoggedIn && (
        <div className="relative z-10 mx-4 sm:mx-6 my-2 p-3 bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <span className="text-stone-600">{t("login_notice")}</span>
          <Link
            href={PATHS.LOGIN}
            className="px-3 py-1.5 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 transition-colors shrink-0"
          >
            {t("login_button")}
          </Link>
        </div>
      )}

      {/* 4. 대화 추천 칩 */}
      {isLoggedIn && messages.length <= 2 && (
        <div className="relative z-10 px-4 sm:px-6 py-2 flex flex-wrap gap-1.5 bg-stone-50/50 border-t border-stone-100">
          {suggestionChips.map((chip, idx) => (
            <button
              key={`chip-${idx}`}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1 text-xs text-stone-600 bg-white border border-stone-200 rounded-full hover:border-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* 5. 입력 폼 */}
      <div className="relative z-10 p-3.5 sm:p-4 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isLoggedIn
                ? t("placeholder_logged_in")
                : t("placeholder_logged_out")
            }
            disabled={!isLoggedIn || loading}
            className="w-full pl-4 pr-12 h-11 text-base sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-stone-400 transition-all placeholder:text-stone-400 disabled:bg-stone-100 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!isLoggedIn || !input.trim() || loading}
            className="absolute right-2 w-7 h-7 bg-stone-800 hover:bg-stone-900 text-white rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
            aria-label={t("send_aria")}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
