"use client";

import { useOpenFeedback } from "../../hooks/use-open-feedback";
import { FeedbackPreset } from "../../stores/use-feedback-dialog-store";

interface FeedbackButtonProps {
  children: React.ReactNode;
  className?: string;
  preset?: FeedbackPreset;
}

/**
 * 문의 창을 여는 텍스트 버튼. 푸터·메뉴·빈 화면 등 어디에나 둔다
 */
export const FeedbackButton = ({
  children,
  className,
  preset,
}: FeedbackButtonProps) => {
  const openFeedback = useOpenFeedback();

  return (
    <button
      type="button"
      className={className}
      onClick={() => openFeedback(preset)}
    >
      {children}
    </button>
  );
};
