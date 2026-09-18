"use client";

import { type Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useEffect, useReducer, useState } from "react";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Highlighter,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Minus,
  MoreVertical,
  Palette,
  Quote,
  RefreshCw,
  RotateCcw,
  Strikethrough,
  Underline,
  X,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
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
import {
  READING_TOOLBAR_GAP,
  StickyReadingSurface,
} from "@/shared/components/ui/sticky-reading-surface";
import { useSiteHeaderHeight } from "@/shared/hooks/use-site-header-height";
import { cn } from "@/shared/utils/cn";

import { EditorLinkControl } from "./editor-link-control";

const colors = [
  "#1c1917",
  "#57534e",
  "#b91c1c",
  "#c2410c",
  "#a16207",
  "#15803d",
  "#0e7490",
  "#1d4ed8",
  "#7e22ce",
  "#be185d",
];
const highlights = [
  "#fef3c7",
  "#ffedd5",
  "#fee2e2",
  "#fce7f3",
  "#f3e8ff",
  "#dbeafe",
  "#cffafe",
  "#dcfce7",
  "#e7e5e4",
  "#ffffff",
];

export function EditorToolbar({
  editor,
  onImageAdd,
}: {
  editor: Editor;
  onImageAdd?: () => void;
}) {
  const t = useTranslations("common.editor");
  const height = useSiteHeaderHeight();
  const [more, setMore] = useState(false);
  const [modifier, setModifier] = useState("Ctrl");
  const [, update] = useReducer((value) => value + 1, 0);
  useEffect(() => {
    setModifier(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl");
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);
  const tool = (
    label: string,
    Icon: typeof Bold,
    action: () => void,
    active?: boolean,
    disabled = false,
    shortcut?: string,
  ) => (
    <Tooltip key={label} delayDuration={500}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={action}
          className={cn(
            "h-10 w-10 shrink-0 p-0 sm:h-8 sm:w-8",
            active && "bg-muted text-primary",
          )}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && (
          <span className="ml-2 opacity-70">
            {modifier}+{shortcut}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
  const palette = (highlight: boolean) => {
    const label = t(highlight ? "highlight" : "color");
    const Icon = highlight ? Highlighter : Palette;
    const current = highlight
      ? editor.getAttributes("highlight").color
      : editor.getAttributes("textStyle").color;
    return (
      <Popover>
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={label}
                className="h-10 w-10 p-0 sm:h-8 sm:w-8"
              >
                <Icon className="size-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
        <PopoverContent
          className="w-56 p-3"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            editor.commands.focus();
          }}
        >
          <p className="mb-2 text-sm font-medium">{label}</p>
          <div className="grid grid-cols-5 gap-2">
            {(highlight ? highlights : colors).map((color) => (
              <button
                type="button"
                key={color}
                aria-label={`${label} ${color}`}
                aria-pressed={current === color}
                className="size-8 rounded border focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: color,
                  outline:
                    current === color ? "2px solid currentColor" : undefined,
                }}
                onClick={() =>
                  highlight
                    ? editor.chain().focus().setHighlight({ color }).run()
                    : editor.chain().focus().setColor(color).run()
                }
              />
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() =>
              highlight
                ? editor.chain().focus().unsetHighlight().run()
                : editor.chain().focus().unsetColor().run()
            }
          >
            {t("reset")}
          </Button>
        </PopoverContent>
      </Popover>
    );
  };
  const heading = [1, 2, 3, 4, 5, 6].find((level) =>
    editor.isActive("heading", { level }),
  );
  return (
    <StickyReadingSurface
      className="z-20 rounded-t-md border-b bg-background/95 p-2 backdrop-blur"
      top={height + READING_TOOLBAR_GAP}
    >
      <div
        className="flex flex-wrap items-center gap-1"
        role="group"
        aria-label={t("toolbar")}
      >
        <select
          aria-label={t("block_type")}
          value={heading ?? 0}
          onChange={(event) => {
            const level = Number(event.target.value);
            if (level === 0) editor.chain().focus().setParagraph().run();
            else if (level === 2 || level === 3)
              editor.chain().focus().setHeading({ level }).run();
          }}
          className="h-10 max-w-36 rounded border bg-background px-2 text-sm sm:h-8"
        >
          <option value={0}>{t("paragraph")}</option>
          {heading && ![2, 3].includes(heading) && (
            <option value={heading}>
              {t("legacy_heading", { level: heading })}
            </option>
          )}
          <option value={2}>{t("heading2")}</option>
          <option value={3}>{t("heading3")}</option>
        </select>
        {tool(
          t("bold"),
          Bold,
          () => {
            editor.chain().focus().toggleBold().run();
          },
          editor.isActive("bold"),
          false,
          "B",
        )}
        {tool(
          t("italic"),
          Italic,
          () => {
            editor.chain().focus().toggleItalic().run();
          },
          editor.isActive("italic"),
          false,
          "I",
        )}
        {palette(true)}
        <EditorLinkControl editor={editor} />
        {tool(
          t("quote"),
          Quote,
          () => {
            editor.chain().focus().toggleBlockquote().run();
          },
          editor.isActive("blockquote"),
        )}
        {onImageAdd && tool(t("image"), ImageIcon, onImageAdd)}
        {tool(
          t("undo"),
          RotateCcw,
          () => {
            editor.chain().focus().undo().run();
          },
          undefined,
          !editor.can().undo(),
          "Z",
        )}
        {tool(
          t("redo"),
          RefreshCw,
          () => {
            editor.chain().focus().redo().run();
          },
          undefined,
          !editor.can().redo(),
          "Shift+Z",
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 gap-1 sm:hidden"
          aria-expanded={more}
          onClick={() => setMore(!more)}
        >
          <MoreVertical className="size-4" />
          {t("more")}
        </Button>
        <div
          className={cn(
            "w-full flex-wrap items-center gap-1 border-t pt-1 sm:flex sm:w-auto sm:border-0 sm:pt-0",
            more ? "flex" : "hidden",
          )}
        >
          {tool(
            t("underline"),
            Underline,
            () => {
              editor.chain().focus().toggleUnderline().run();
            },
            editor.isActive("underline"),
            false,
            "U",
          )}
          {tool(
            t("strike"),
            Strikethrough,
            () => {
              editor.chain().focus().toggleStrike().run();
            },
            editor.isActive("strike"),
          )}
          {tool(
            t("bullet_list"),
            List,
            () => {
              editor.chain().focus().toggleBulletList().run();
            },
            editor.isActive("bulletList"),
          )}
          {tool(
            t("ordered_list"),
            ListOrdered,
            () => {
              editor.chain().focus().toggleOrderedList().run();
            },
            editor.isActive("orderedList"),
          )}
          {tool(
            t("align_left"),
            AlignLeft,
            () => {
              editor.chain().focus().setTextAlign("left").run();
            },
            editor.isActive({ textAlign: "left" }),
          )}
          {tool(
            t("align_center"),
            AlignCenter,
            () => {
              editor.chain().focus().setTextAlign("center").run();
            },
            editor.isActive({ textAlign: "center" }),
          )}
          {tool(
            t("align_right"),
            AlignRight,
            () => {
              editor.chain().focus().setTextAlign("right").run();
            },
            editor.isActive({ textAlign: "right" }),
          )}
          {palette(false)}
          {tool(
            t("code"),
            Code,
            () => {
              editor.chain().focus().toggleCodeBlock().run();
            },
            editor.isActive("codeBlock"),
          )}
          {tool(t("divider"), Minus, () => {
            editor.chain().focus().setHorizontalRule().run();
          })}
          {tool(t("clear_format"), X, () => {
            editor.chain().focus().unsetAllMarks().run();
          })}
        </div>
      </div>
    </StickyReadingSurface>
  );
}
