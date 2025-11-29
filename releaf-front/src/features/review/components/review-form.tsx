"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { upload } from "@vercel/blob/client";
import { BookOpen, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuthStore } from "@/features/auth/store";
import { BookSearchModal } from "@/features/book/components/book-search-modal";
import { Book } from "@/features/book/types";
import { ReviewEditor } from "@/features/review/components/review-editor";
import { ReviewFormValues } from "@/features/review/types";
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

import { BOOK_DOMAINS } from "../constants";

const reviewSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  content: z.string().min(1, "내용을 입력해주세요."),
  bookIsbn: z.string().min(1, "책을 선택해주세요."),
  category: z.string().min(1, "카테고리를 선택해주세요."),
  tags: z.array(z.string()).max(5, "태그는 최대 5개까지 입력 가능합니다."),
  rating: z.number().min(0).max(5),
});

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
  onSubmit: (data: ReviewFormValues) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export const ReviewForm = ({
  initialData,
  onSubmit,
  submitLabel = "작성 완료",
  isSubmitting = false,
}: ReviewFormProps) => {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(
    initialData?.book || null
  );
  const [tagInput, setTagInput] = useState("");
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const { user } = useAuthStore();

  const imageMapRef = useRef<Map<string, File>>(new Map());

  const form = useForm<ReviewFormValues>({
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
      alert("태그는 최대 5개까지 입력 가능합니다.");
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

  const handleImageAdd = (file: File) => {
    const url = URL.createObjectURL(file);
    imageMapRef.current.set(url, file);
    return url;
  };

  const handleSubmit = async (data: ReviewFormValues) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsLocalSubmitting(true);
    try {
      let content = data.content;
      const imagesToUpload: File[] = [];
      const placeholderUrls: string[] = [];

      // 업로드가 필요한 콘텐츠 내 모든 이미지 찾기
      imageMapRef.current.forEach((file, url) => {
        if (content.includes(url)) {
          imagesToUpload.push(file);
          placeholderUrls.push(url);
        }
      });

      if (imagesToUpload.length > 0) {
        // @vercel/blob/client를 사용한 클라이언트 측 업로드
        const blobs = await Promise.all(
          imagesToUpload.map((file) => {
            const filePath = `${user.provider}-${user.id}/review-images/${file.name}`;
            return upload(filePath, file, {
              access: "public",
              handleUploadUrl: "/api/upload",
            });
          })
        );

        // blob URL을 실제 Vercel Blob URL로 교체
        blobs.forEach((blob, index) => {
          content = content.replace(placeholderUrls[index], blob.url);
        });
      }

      // object URL 정리
      imageMapRef.current.forEach((_, url) => URL.revokeObjectURL(url));
      imageMapRef.current.clear();

      await onSubmit({
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
      });
    } catch (error: any) {
      console.error("Review submission error:", error);
      alert(error.message || "리뷰 작성 중 오류가 발생했습니다.");
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  const isProcessing = isSubmitting || isLocalSubmitting;

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
              <BookSearchModal
                onSelect={handleBookSelect}
                open={isBookModalOpen}
                onOpenChange={setIsBookModalOpen}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isProcessing}
                  >
                    <Search className="w-4 h-4 mr-2" />책 검색
                  </Button>
                }
              />
            </div>

            {selectedBook ? (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30 relative group">
                <div className="relative w-16 h-24 rounded overflow-hidden shadow-sm">
                  <Image
                    src={selectedBook.image}
                    alt={selectedBook.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedBook.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedBook.author} | {selectedBook.publisher}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveBook}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-24 border-dashed flex flex-col gap-2 hover:bg-muted/50"
                onClick={() => setIsBookModalOpen(true)}
                disabled={isProcessing}
              >
                <BookOpen className="w-6 h-6 text-muted-foreground" />
                <span className="text-muted-foreground">
                  리뷰할 책을 검색하여 선택해주세요
                </span>
              </Button>
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
                  <ReviewEditor
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
