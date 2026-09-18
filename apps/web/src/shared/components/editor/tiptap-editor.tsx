"use client";

import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import ImageResize from "tiptap-extension-resize-image";

import { Bold, Highlighter, Italic } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { cn } from "@/shared/utils/cn";

import { EditorLinkControl } from "./editor-link-control";
import { EditorToolbar } from "./editor-toolbar";
import { keepEditorCaretVisible } from "./keep-editor-caret-visible";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onImageAdd?: (file: File) => string | null; // 객체 URL 반환 (용량 초과 시 null)
}

export const TiptapEditor = ({
  content,
  onChange,
  placeholder,
  onImageAdd,
}: TiptapEditorProps) => {
  const t = useTranslations("common.editor");
  const effectivePlaceholder = placeholder ?? t("placeholder");
  const caretFrame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(caretFrame.current), []);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: effectivePlaceholder,
      }),
      ImageResize,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    editorProps: {
      handleScrollToSelection: keepEditorCaretVisible,
      handleDOMEvents: {
        input: (view) => {
          cancelAnimationFrame(caretFrame.current);
          caretFrame.current = requestAnimationFrame(() =>
            keepEditorCaretVisible(view),
          );
          return false;
        },
        compositionend: (view) => {
          cancelAnimationFrame(caretFrame.current);
          caretFrame.current = requestAnimationFrame(() =>
            keepEditorCaretVisible(view),
          );
          return false;
        },
      },
      attributes: {
        class:
          "prose mx-auto focus:outline-none min-h-[300px] p-4 max-w-none font-[family-name:var(--font-pretendard)] prose-p:text-[15px] prose-p:leading-6 prose-p:my-2 prose-h1:text-[32px] prose-h1:font-bold prose-h1:mt-8 prose-h1:mb-4 prose-h2:text-[30px] prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3 prose-blockquote:text-[19px] prose-blockquote:leading-8 prose-blockquote:not-italic prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:my-4",
      },
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/") && onImageAdd) {
            const url = onImageAdd(file);
            // 용량 초과 등으로 이미지 추가 실패 시 무시
            if (!url) return true;
            const { schema } = view.state;
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            if (coordinates) {
              const node = schema.nodes.imageResize.create({ src: url });
              const transaction = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(transaction);
            }
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // prop에서 에디터로 콘텐츠 동기화 (제어 컴포넌트 동작)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selection = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      highlight: editor?.isActive("highlight") ?? false,
    }),
  });

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onImageAdd && editor) {
        const url = onImageAdd(file);
        // 용량 초과 등으로 이미지 추가 실패 시 무시
        if (!url) {
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        // 이미지를 삽입한 다음 단락을 추가하여 대체를 방지하고 입력을 허용합니다.
        editor
          .chain()
          .focus()
          .insertContent({
            type: "imageResize",
            attrs: { src: url },
          })
          .createParagraphNear()
          .run();
      }
      // 동일한 파일을 다시 선택할 수 있도록 입력 값을 초기화합니다.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [editor, onImageAdd],
  );

  if (!editor) {
    return null;
  }

  return (
    <div
      data-review-editor
      className="border rounded-md relative bg-background"
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      <EditorToolbar editor={editor} onImageAdd={handleImageClick} />

      <BubbleMenu
        editor={editor}
        options={{ placement: "top", offset: 8 }}
        className="z-30 flex items-center gap-1 rounded-md border bg-background p-1 shadow-md"
      >
        {[
          {
            label: t("bold"),
            icon: Bold,
            active: selection?.bold,
            action: () => editor.chain().focus().toggleBold().run(),
          },
          {
            label: t("italic"),
            icon: Italic,
            active: selection?.italic,
            action: () => editor.chain().focus().toggleItalic().run(),
          },
          {
            label: t("highlight"),
            icon: Highlighter,
            active: selection?.highlight,
            action: () =>
              editor
                .chain()
                .focus()
                .toggleHighlight({ color: "#fef3c7" })
                .run(),
          },
        ].map(({ label, icon: Icon, active, action }) => (
          <Tooltip key={label} delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={label}
                aria-pressed={active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={action}
                className={cn(
                  "size-10 p-0 sm:size-8",
                  active && "bg-muted text-primary",
                )}
              >
                <Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
        <EditorLinkControl editor={editor} />
      </BubbleMenu>

      <EditorContent editor={editor} />
      <p className="border-t px-4 py-3 text-xs text-muted-foreground">
        {t("heading_hint")}
      </p>
    </div>
  );
};
