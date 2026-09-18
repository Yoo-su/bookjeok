"use client";

import { type Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { LinkIcon } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Input } from "@/shared/components/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/shadcn/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";

export function normalizeEditorUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return ["http:", "https:", "mailto:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function EditorLinkControl({ editor }: { editor: Editor }) {
  const t = useTranslations("common.editor");
  const id = useId();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  const apply = () => {
    const href = normalizeEditorUrl(url);
    if (!href) {
      setError(true);
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setOpen(false);
  };
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        if (value) {
          setUrl(editor.getAttributes("link").href ?? "");
          setError(false);
        }
        setOpen(value);
      }}
    >
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 sm:h-8 sm:w-8"
              aria-label={t("link")}
              aria-pressed={editor.isActive("link")}
            >
              <LinkIcon className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("link")}</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-80 max-w-[calc(100vw-2rem)] space-y-3"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          editor.commands.focus();
        }}
      >
        <label htmlFor={id} className="text-sm font-medium">
          {t("link_url")}
        </label>
        <Input
          id={id}
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setError(false);
          }}
          placeholder="https://"
          autoComplete="off"
          inputMode="url"
          aria-invalid={error}
          aria-describedby={error ? `${id}-error` : undefined}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
        />
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {t("link_error")}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!editor.isActive("link")}
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              setOpen(false);
            }}
          >
            {t("unlink")}
          </Button>
          <Button type="button" size="sm" onClick={apply}>
            {t("apply")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
