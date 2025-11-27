"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/shared/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { ImageUploader } from "@/shared/components/ui/image-uploader";
import { LocationSelector } from "@/shared/components/ui/location-selector";

import { UsedBookSale } from "../../types";
import { useBookSaleEditForm } from "./use-book-sale-edit-form";

interface BookSaleEditFormProps {
  sale: UsedBookSale;
}

export const BookSaleEditForm = ({ sale }: BookSaleEditFormProps) => {
  const {
    form,
    existingImages,
    newImagePreviews,
    isPending,
    handleImagesAdd,
    handleExistingImageRemove,
    handleNewImageRemove,
    onSubmit,
  } = useBookSaleEditForm({ sale });

  const totalImages = existingImages.length + newImagePreviews.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">판매글 수정</CardTitle>
        <CardDescription>게시글 정보를 수정해주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center p-4 mb-6 border rounded-lg bg-gray-50">
          <Image
            src={sale.book.image}
            alt={sale.book.title}
            width={60}
            height={80}
            className="object-cover rounded-md shadow-md"
          />
          <div className="ml-4">
            <p className="font-semibold text-gray-800">{sale.book.title}</p>
            <p className="text-sm text-gray-500">{sale.book.author} 저</p>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>게시글 제목</FormLabel>
                  <FormControl>
                    <Input placeholder="판매글 제목을 입력하세요" {...field} />
                  </FormControl>
                  <div className="h-5">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>판매 가격 (원)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="숫자만 입력"
                        {...field}
                      />
                    </FormControl>
                    <div className="h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <LocationSelector
                  city={form.watch("city")}
                  district={form.watch("district")}
                  onCityChange={(value) => {
                    form.setValue("city", value, { shouldValidate: true });
                    form.setValue("district", "", { shouldValidate: true });
                  }}
                  onDistrictChange={(value) => {
                    form.setValue("district", value, { shouldValidate: true });
                  }}
                />
                <div className="flex gap-4 mt-2">
                  <div className="flex-1 h-5">
                    {form.formState.errors.city && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 h-5">
                    {form.formState.errors.district && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.district.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel>{`책 상태 이미지 (${totalImages} / 5)`}</FormLabel>
                  <FormControl>
                    <ImageUploader
                      previews={newImagePreviews}
                      existingImages={existingImages}
                      onImagesAdd={handleImagesAdd}
                      onImageRemove={handleNewImageRemove}
                      onExistingImageRemove={handleExistingImageRemove}
                      maxFiles={5}
                    />
                  </FormControl>
                  <div className="h-5">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상세 내용</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="책의 상태, 거래 방식 등 상세한 내용을 작성해주세요."
                      className="resize-none"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <div className="h-5">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full mt-10!"
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              수정 완료
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
