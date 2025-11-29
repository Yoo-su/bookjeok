"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface ReviewViewerProps {
  content: string;
}

export const ReviewViewer = ({ content }: ReviewViewerProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
};
