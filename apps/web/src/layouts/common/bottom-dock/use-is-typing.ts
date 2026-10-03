"use client";

import { useEffect, useState } from "react";

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "radio",
  "range",
  "submit",
  "reset",
  "file",
  "color",
  "image",
]);

const isTextField = (el: Element | null) => {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)
    return true;
  return el instanceof HTMLInputElement && !NON_TEXT_INPUT_TYPES.has(el.type);
};

/** 텍스트 입력에 포커스가 있는지. 모바일 키보드가 올라온 상태로 봄 */
export function useIsTyping() {
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const sync = () => setTyping(isTextField(document.activeElement));
    // focusout 시점의 activeElement는 body라 다음 포커스가 잡힌 뒤 읽음
    const onFocusOut = () => setTimeout(sync, 0);

    sync();
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return typing;
}
