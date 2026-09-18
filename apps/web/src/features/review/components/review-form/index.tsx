"use client";

import {
  BOOK_DOMAINS,
  BookInfo,
  CATEGORY_MAP,
  ReviewFormValues,
} from "@bookjeok/core";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { BookSearchModal } from "@/features/book/components/common/book-search-modal";
import {
  createReviewSchema,
  ReviewSchemaValues,
} from "@/features/review/schemas";
import { BookOpen, Info, Loader2 } from "@/shared/components/icons/iconsax";
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
import { Switch } from "@/shared/components/shadcn/switch";
import { StarRating } from "@/shared/components/ui/star-rating";
import { useEditorImageHandler } from "@/shared/hooks/use-editor-image-handler";

import { ReviewPreview } from "./review-preview";

// Tiptap 에디터는 무거운 라이브러리이므로 지연 로딩
const TiptapEditor = dynamic(
  () =>
    import("@/shared/components/editor/tiptap-editor").then(
      (mod) => mod.TiptapEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-md min-h-[300px] animate-pulse bg-muted/30" />
    ),
  },
);

interface ReviewFormProps {
  initialData?: {
    title: string;
    content: string;
    isbn: string;
    category: string;
    tags: string[];
    rating: number;
    isPublic?: boolean;
    book?: BookInfo;
  };
  onSubmit: (
    data: ReviewFormValues,
    deletedImageUrls?: string[],
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
  submitLabel, // Optional now, will default to translated value
  isSubmitting = false,
  isEditMode = false,
}: ReviewFormProps) => {
  const t = useTranslations("review.form");
  const tFilters = useTranslations("review.filters");
  const tValidation = useTranslations("review.validation");
  const tAria = useTranslations("common.aria");

  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(
    initialData?.book || null,
  );
  const [tagInput, setTagInput] = useState("");
  const user = useAuthStore((state) => state.user);

  const { handleImageAdd, uploadImages, isUploading } = useEditorImageHandler({
    uploadPath: (file) =>
      `${user?.provider}-${user?.id}/review-images/${file.name}`,
    initialContent: initialData?.content,
  });

  const form = useForm<ReviewSchemaValues>({
    resolver: zodResolver(createReviewSchema((key) => tValidation(key))),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      isbn: initialData?.isbn || "",
      category: initialData?.category || "",
      tags: initialData?.tags || [],
      rating: initialData?.rating || 0,
      isPublic: initialData?.isPublic ?? true,
    },
  });

  useEffect(() => {
    if (initialData?.book) {
      setSelectedBook(initialData.book);
    }
  }, [initialData, form]);

  const handleBookSelect = (book: BookInfo) => {
    setSelectedBook(book);
    form.setValue("isbn", book.isbn, { shouldValidate: true });
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const currentTags = form.getValues("tags");
    if (currentTags.length >= 5) {
      toast.error(t("fields.tags_error_limit"));
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
      currentTags.filter((tag) => tag !== tagToRemove),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (data: ReviewSchemaValues) => {
    const { content, deletedImageUrls } = await uploadImages(data.content);

    await onSubmit(
      {
        ...data,
        content,
      },
      deletedImageUrls,
    );
  };

  const isProcessing = isSubmitting || isUploading;

  const currentSubmitLabel =
    submitLabel ||
    (isEditMode ? t("buttons.submit_edit") : t("buttons.submit_create"));

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
              <FormLabel>{t("book_selection.label")}</FormLabel>
            </div>

            {!selectedBook ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 mb-6 border-2 border-dashed rounded-xl bg-muted/30 gap-6 hover:bg-muted/50 transition-colors group">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">
                    {t("book_selection.empty_title")}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {t("book_selection.empty_description")}
                  </p>
                </div>
                {!isEditMode && (
                  <BookSearchModal
                    onSelect={handleBookSelect}
                    trigger={
                      <Button
                        type="button"
                        size="lg"
                        className="px-8 font-semibold"
                        disabled={isProcessing}
                      >
                        {t("book_selection.search_button")}
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
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={isProcessing}
                          >
                            {t("book_selection.change_button")}
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <input type="hidden" {...form.register("isbn")} />
            {form.formState.errors.isbn && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.isbn.message}
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
                  <FormLabel>{t("fields.category")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isProcessing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("fields.category_placeholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BOOK_DOMAINS.map((category) => (
                        <SelectItem key={category} value={category}>
                          {tFilters(`categories.${CATEGORY_MAP[category]}`, {
                            defaultMessage: category,
                          })}
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
                  <FormLabel>{t("fields.rating")}</FormLabel>
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
                <FormLabel>{t("fields.title")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("fields.title_placeholder")}
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
                <FormLabel>{t("fields.tags")}</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t("fields.tags_placeholder")}
                        disabled={isProcessing || field.value.length >= 5}
                      />
                      <Button
                        type="button"
                        onClick={handleAddTag}
                        disabled={isProcessing || field.value.length >= 5}
                      >
                        {t("fields.tags_add")}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          role="button"
                          tabIndex={0}
                          aria-label={tAria("tag_remove", { tag })}
                          className="px-3 py-1 text-sm cursor-pointer hover:bg-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                          onClick={() => handleRemoveTag(tag)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleRemoveTag(tag);
                            }
                          }}
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

          {/* 공개 여부 설정 */}
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <>
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/30">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("fields.public_label")}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {field.value
                        ? t("fields.public_true")
                        : t("fields.public_false")}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isProcessing}
                    />
                  </FormControl>
                </FormItem>
                <div className="mt-3 flex gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">
                      {t("fields.public_notice_title")}
                    </p>
                    <p className="text-blue-600/90 text-xs leading-relaxed">
                      {t("fields.public_notice_desc")}
                    </p>
                  </div>
                </div>
              </>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-3">
                  <FormLabel>{t("fields.content")}</FormLabel>
                  <ReviewPreview content={field.value} />
                </div>
                <FormControl>
                  <TiptapEditor
                    content={field.value}
                    onChange={field.onChange}
                    placeholder={t("fields.content_placeholder")}
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
            {t("buttons.cancel")}
          </Button>
          <Button type="submit" size="lg" disabled={isProcessing}>
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isProcessing ? t("buttons.processing") : currentSubmitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};
