"use client";

import { normalizeTagName, REVIEW_TAG_MAX_COUNT } from "@bookjeok/core";
import { useTagSuggestionsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { Input } from "@/shared/components/shadcn/input";

/** 입력이 멎은 뒤 제안을 조회하기까지의 대기. 한 글자마다 요청하지 않는다. */
const DEBOUNCE_MS = 250;

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

/**
 * 태그 입력 + 기존 태그 제안.
 *
 * 제안은 **합치는 장치가 아니라 새로 지어내는 것을 막는 장치**다. 운영 태그
 * 117개 중 99개가 1회성인데, `카뮈`/`알베르카뮈`처럼 뜻이 같은 쌍을 문자열로
 * 판정해 합칠 방법은 없다. 쓰는 순간에 이미 있는 태그를 보여주는 것만이
 * 갈라짐을 줄인다. 이미 저장된 태그는 건드리지 않는다.
 */
export function TagInput({ value, onChange, disabled = false }: TagInputProps) {
  const t = useTranslations("review.form");
  const tAria = useTranslations("common.aria");

  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const isFull = value.length >= REVIEW_TAG_MAX_COUNT;

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const { data } = useTagSuggestionsQuery(debounced, open && !disabled);

  // 이미 고른 태그는 제안에서 뺀다.
  const suggestions = (data ?? []).filter((s) => !value.includes(s.name));

  useEffect(() => {
    setActiveIndex(-1);
  }, [debounced]);

  // 바깥을 누르면 닫는다. 제안 항목 클릭은 onMouseDown에서 이미 처리된다.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const addTag = (raw: string) => {
    // 서버와 같은 규칙으로 정규화해야 중복 판정이 어긋나지 않는다.
    const name = normalizeTagName(raw);
    if (!name) return;

    if (value.includes(name)) {
      setInput("");
      return;
    }
    if (isFull) {
      toast.error(t("fields.tags_error_limit"));
      return;
    }

    onChange([...value, name]);
    setInput("");
    setActiveIndex(-1);
  };

  const removeTag = (target: string) => {
    onChange(value.filter((tag) => tag !== target));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중의 Enter는 조합 확정이지 태그 추가가 아니다.
    if (event.nativeEvent.isComposing) return;

    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const picked = suggestions[activeIndex];
      addTag(picked ? picked.name : input);
    }
  };

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("fields.tags_placeholder")}
            disabled={disabled || isFull}
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls="tag-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `tag-suggestion-${activeIndex}` : undefined
            }
          />
          <Button
            type="button"
            onClick={() => addTag(input)}
            disabled={disabled || isFull}
          >
            {t("fields.tags_add")}
          </Button>
        </div>

        {open && suggestions.length > 0 && (
          <ul
            id="tag-suggestions"
            role="listbox"
            aria-label={tAria("tag_suggestions")}
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.name}
                id={`tag-suggestion-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                // onClick이면 input의 blur가 먼저 일어나 목록이 닫힌다.
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(suggestion.name);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                  index === activeIndex
                    ? "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                    : "text-stone-600 dark:text-stone-300"
                }`}
              >
                <span>
                  <span className="font-serif italic text-stone-400">#</span>
                  {suggestion.name}
                </span>
                <span className="text-xs font-light text-stone-400">
                  {suggestion.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            role="button"
            tabIndex={0}
            aria-label={tAria("tag_remove", { tag })}
            className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            onClick={() => removeTag(tag)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                removeTag(tag);
              }
            }}
          >
            #{tag} ✕
          </Badge>
        ))}
      </div>
    </div>
  );
}
