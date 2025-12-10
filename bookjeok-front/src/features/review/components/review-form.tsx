"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/store";
import { BookSearchModal } from "@/features/book/components/book-search-modal";
import { Book } from "@/features/book/types";
import { reviewSchema, ReviewSchemaValues } from "@/features/review/schemas";
import { ReviewFormValues } from "@/features/review/types";
import { TiptapEditor } from "@/shared/components/editor/tiptap-editor";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { StarRating } from "@/shared/components/ui/star-rating";
import { useEditorImageHandler } from "@/shared/hooks/use-editor-image-handler";

import { BOOK_DOMAINS } from "../constants";

interface ReviewFormProps {
  initialData?: {
    title: string;
    content: string;
    bookIsbn: string;
    category: string;
    tags: string[];
    rating: number;
    book?: Book;
  };
  onSubmit: (
    data: ReviewFormValues,
    deletedImageUrls?: string[]
  ) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  isEditMode?: boolean;
}

/**
 * 리뷰 작성 및 수정을 위한 폼 컴포넌트입니다.
 * 책 검색, 별점, 태그, 에디터 기능을 포함합니다.
 */
export const ReviewForm = ({
  initialData,
  onSubmit,
  submitLabel = "작성 완료",
  isSubmitting = false,
  isEditMode = false,
}: ReviewFormProps) => {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(
    initialData?.book || null
  );
  const [tagInput, setTagInput] = useState("");
  const { user } = useAuthStore();

  const { handleImageAdd, uploadImages, isUploading } = useEditorImageHandler({
    uploadPath: (file) =>
      `${user?.provider}-${user?.id}/review-images/${file.name}`,
    initialContent: initialData?.content,
  });

  const form = useForm<ReviewSchemaValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      bookIsbn: initialData?.bookIsbn || "",
      category: initialData?.category || "",
      tags: initialData?.tags || [],
      rating: initialData?.rating || 0,
    },
  });

  useEffect(() => {
    if (initialData?.book) {
      setSelectedBook(initialData.book);
    }
  }, [initialData, form]);

  const handleBookSelect = (book: any) => {
    setSelectedBook(book);
    form.setValue("bookIsbn", book.isbn, { shouldValidate: true });
    setIsBookModalOpen(false);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const currentTags = form.getValues("tags");
    if (currentTags.length >= 5) {
      toast.error("태그는 최대 5개까지 입력 가능합니다.");
      return;
    }
    if (!currentTags.includes(tagInput.trim())) {
      form.setValue("tags", [...currentTags, tagInput.trim()]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveBook = () => {
    setSelectedBook(null);
    form.setValue("bookIsbn", "");
  };

  const handleSubmit = async (data: ReviewFormValues) => {
    const { content, deletedImageUrls } = await uploadImages(data.content);

    await onSubmit(
      {
        ...data,
        content,
        book: selectedBook
          ? {
              isbn: selectedBook.isbn,
              title: selectedBook.title,
              author: selectedBook.author,
              publisher: selectedBook.publisher,
              image: selectedBook.image,
              description: selectedBook.description,
            }
          : undefined,
      },
      deletedImageUrls
    );
  };

  const isProcessing = isSubmitting || isUploading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <fieldset
          disabled={isProcessing}
          className="space-y-8 group-disabled:opacity-50"
        >
          {/* 책 선택 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>리뷰할 책</FormLabel>
            </div>

            {!selectedBook ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 mb-6 border-2 border-dashed rounded-xl bg-muted/30 gap-6 hover:bg-muted/50 transition-colors group">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">
                    리뷰할 책을 선택해주세요
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    ISBN, 제목, 저자명으로 검색하여 리뷰할 책을 선택할 수
                    있습니다.
                  </p>
                </div>
                {!isEditMode && (
                  <BookSearchModal
                    onSelect={handleBookSelect}
                    open={isBookModalOpen}
                    onOpenChange={setIsBookModalOpen}
                    trigger={
                      <Button
                        type="button"
                        size="lg"
                        className="px-8 font-semibold"
                        disabled={isProcessing}
                      >
                        책 검색하기
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center p-6 mb-8 border rounded-xl bg-card shadow-sm gap-6 group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <div className="relative w-24 h-36 shrink-0 rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={selectedBook.image}
                    alt={selectedBook.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-xl leading-tight text-foreground">
                      {selectedBook.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedBook.author} <span className="mx-1">·</span>{" "}
                      {selectedBook.publisher}
                    </p>
                  </div>
                  {!isEditMode && (
                    <div className="flex items-center gap-2 pt-2">
                      <BookSearchModal
                        onSelect={handleBookSelect}
                        open={isBookModalOpen}
                        onOpenChange={setIsBookModalOpen}
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={isProcessing}
                          >
                            다른 책 선택
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <input type="hidden" {...form.register("bookIsbn")} />
            {form.formState.errors.bookIsbn && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.bookIsbn.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 카테고리 선택 */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isProcessing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="도서 유형을 선택해주세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BOOK_DOMAINS.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 별점 입력 섹션 */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>별점</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4 h-10">
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        size={28}
                        disabled={isProcessing}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>제목</FormLabel>
                <FormControl>
                  <Input
                    placeholder="리뷰 제목을 입력해주세요"
                    className="text-lg py-6"
                    {...field}
                    disabled={isProcessing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>태그 (선택, 최대 5개)</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="태그를 입력하고 Enter를 누르세요"
                        disabled={isProcessing || field.value.length >= 5}
                      />
                      <Button
                        type="button"
                        onClick={handleAddTag}
                        disabled={isProcessing || field.value.length >= 5}
                      >
                        추가
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-200"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          #{tag} ✕
                        </Badge>
                      ))}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>내용</FormLabel>
                <FormControl>
                  <TiptapEditor
                    content={field.value}
                    onChange={field.onChange}
                    placeholder="책에 대한 솔직한 후기를 남겨주세요..."
                    onImageAdd={handleImageAdd}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            disabled={isProcessing}
          >
            취소
          </Button>
          <Button type="submit" size="lg" disabled={isProcessing}>
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isProcessing ? "처리 중..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};
