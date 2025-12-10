"use client";

import { type Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Strikethrough,
  Underline,
} from "lucide-react";

import { Button } from "@/shared/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/shadcn/popover";
import { Separator } from "@/shared/components/shadcn/separator";
import { Toggle } from "@/shared/components/shadcn/toggle";
import { cn } from "@/shared/utils/cn";

interface EditorToolbarProps {
  editor: Editor;
  onImageAdd?: () => void;
}

export const EditorToolbar = ({ editor, onImageAdd }: EditorToolbarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b bg-muted/40 p-2 flex flex-wrap gap-1 sticky top-0 z-10 items-center">
      {/* 텍스트 스타일 */}
      <div className="flex items-center gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Underline"
        >
          <Underline className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 헤딩 */}
      <div className="flex items-center gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          aria-label="H1"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label="H2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          aria-label="H3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 정렬 */}
      <div className="flex items-center gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "left" })}
          onPressedChange={() =>
            editor.chain().focus().setTextAlign("left").run()
          }
          aria-label="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={() =>
            editor.chain().focus().setTextAlign("center").run()
          }
          aria-label="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={() =>
            editor.chain().focus().setTextAlign("right").run()
          }
          aria-label="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 리스트 & 블록 */}
      <div className="flex items-center gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          aria-label="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          aria-label="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("codeBlock")}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="Code Block"
        >
          <Code className="h-4 w-4" />
        </Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 색상 */}
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("textStyle") && "bg-muted"
              )}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1 flex-wrap max-w-[150px]">
              {[
                "#000000",
                "#495057",
                "#868E96",
                "#ADB5BD",
                "#FF0000",
                "#C92A2A",
                "#E64980",
                "#A61E4D",
                "#BE4BDB",
                "#862E9C",
                "#7950F2",
                "#5F3DC4",
                "#4C6EF5",
                "#364FC7",
                "#228BE6",
                "#1864AB",
                "#15AABF",
                "#0B7285",
                "#12B886",
                "#087F5B",
                "#40C057",
                "#2B8A3E",
                "#82C91E",
                "#FAB005",
                "#FD7E14",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  className="w-6 h-6 rounded-md border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs h-7"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("highlight") && "bg-muted"
              )}
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1 flex-wrap max-w-[150px]">
              {[
                "#F8F9FA",
                "#E9ECEF",
                "#DEE2E6",
                "#CED4DA",
                "#FFF5F5",
                "#FFE3E3",
                "#FFF0F6",
                "#FFDEEB",
                "#F8F0FC",
                "#F3D9FA",
                "#F3F0FF",
                "#E5DBFF",
                "#EDF2FF",
                "#DBE4FF",
                "#E7F5FF",
                "#D0EBFF",
                "#E3FAFC",
                "#C5F6FA",
                "#E6FCF5",
                "#C3FAE8",
                "#EBFBEE",
                "#D3F9D8",
                "#F4FCE3",
                "#FFF9DB",
                "#FFF4E6",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    editor.chain().focus().toggleHighlight({ color }).run()
                  }
                  className="w-6 h-6 rounded-md border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs h-7"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 삽입 */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0"
          title="구분선"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href;
            const url = window.prompt("URL을 입력하세요", previousUrl);

            // cancelled
            if (url === null) {
              return;
            }

            // empty
            if (url === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              return;
            }

            // update
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: url })
              .run();
          }}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("link") && "bg-muted text-primary"
          )}
          title="링크"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 이미지 & 갤러리 */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onImageAdd}
          className="h-8 w-8 p-0"
          title="이미지 추가"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
