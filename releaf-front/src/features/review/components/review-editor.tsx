"use client";

import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic } from "lucide-react";
import { useCallback, useRef } from "react";
import ImageResize from "tiptap-extension-resize-image";

import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils/cn";

import { EditorToolbar } from "./editor-toolbar";

interface ReviewEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onImageAdd?: (file: File) => string; // Returns the object URL
}

export const ReviewEditor = ({
  content,
  onChange,
  placeholder = "내용을 입력하세요...",
  onImageAdd,
}: ReviewEditorProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      ImageResize,
      ImageResize,
      BubbleMenuExtension,
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onImageAdd && editor) {
        const url = onImageAdd(file);

        // Insert image and then a paragraph to prevent replacement and allow typing
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
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [editor, onImageAdd]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md overflow-hidden relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      <EditorToolbar editor={editor} onImageAdd={handleImageClick} />

      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex bg-background border rounded-md shadow-md p-1 gap-1"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bold") && "bg-muted text-primary"
            )}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("italic") && "bg-muted text-primary"
            )}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("heading", { level: 2 }) &&
                "bg-muted text-primary"
            )}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  );
};
