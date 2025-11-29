"use client";

interface ReviewDetailContentProps {
  content: string;
}

export function ReviewDetailContent({ content }: ReviewDetailContentProps) {
  return (
    <div
      className="prose prose-stone prose-lg md:prose-xl max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
