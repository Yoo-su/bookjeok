"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { KOREA_DISTRICTS } from "@/shared/constants/korea-districts";

import { useUpdateBookSaleMutation } from "../../mutations";
import { UpdateBookSaleParams, UsedBookSale } from "../../types";
import { editFormSchema, EditFormValues } from "./schema";

interface BookSaleEditFormProps {
  sale: UsedBookSale;
}

export const BookSaleEditForm = ({ sale }: BookSaleEditFormProps) => {
  const { mutate, isPending } = useUpdateBookSaleMutation();

  const [existingImages, setExistingImages] = useState<string[]>(
    sale.imageUrls
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: sale.title,
      price: String(sale.price),
      city: sale.city,
      district: sale.district,
      content: sale.content,
    },
    mode: "onBlur",
  });

  const selectedCity = form.watch("city");

  useEffect(() => {
    const dataTransfer = new DataTransfer();
    newImageFiles.forEach((file) => dataTransfer.items.add(file));
    form.setValue("images", dataTransfer.files, { shouldValidate: true });
  }, [newImageFiles, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages =
      existingImages.length + newImageFiles.length + files.length;

    if (totalImages > 5) {
      alert("이미지는 최대 5개까지 첨부할 수 있습니다.");
      return;
    }
    setNewImageFiles((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveExistingImage = (urlToRemove: string) => {
    setExistingImages((prev) => prev.filter((url) => url !== urlToRemove));
    setDeletedImages((prev) => [...prev, urlToRemove]);
  };

  const handleRemoveNewImage = (indexToRemove: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const onSubmit = (data: EditFormValues) => {
    // ⭐️ Zod 스키마 대신 여기서 직접 이미지 개수를 검증합니다.
    if (existingImages.length + newImageFiles.length === 0) {
      form.setError("images", { message: "이미지를 1개 이상 등록해주세요." });
      return;
    }

    const payload: UpdateBookSaleParams = {
      title: data.title,
      price: Number(data.price),
      city: data.city,
      district: data.district,
      content: data.content,
      imageUrls: existingImages,
    };

    mutate({
      saleId: sale.id,
      payload,
      newImageFiles,
      deletedImageUrls: deletedImages,
    });
  };

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>지역 (시/도)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.resetField("district");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="시/도 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(KOREA_DISTRICTS).map((city) => (
                          <SelectItem key={city} value={city}>
                            {" "}
                            {city}{" "}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>지역 (시/군/구)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={
                        !selectedCity ||
                        KOREA_DISTRICTS[selectedCity]?.length === 0
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="시/군/구 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedCity &&
                          KOREA_DISTRICTS[selectedCity].map((district) => (
                            <SelectItem key={district} value={district}>
                              {" "}
                              {district}{" "}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel>
                    책 상태 이미지 (
                    {existingImages.length + newImageFiles.length} / 5)
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap items-center gap-4">
                      {existingImages.map((url) => (
                        <div key={url} className="relative">
                          <Image
                            src={url}
                            alt="기존 이미지"
                            width={96}
                            height={96}
                            className="object-cover w-24 h-24 rounded-lg shadow"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(url)}
                            className="absolute top-[-5px] right-[-5px] p-0.5 bg-red-500 rounded-full text-white shadow-md hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {newImagePreviews.map((src, index) => (
                        <div key={src} className="relative">
                          <Image
                            src={src}
                            alt={`새 이미지 ${index}`}
                            width={96}
                            height={96}
                            className="object-cover w-24 h-24 rounded-lg shadow"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute top-[-5px] right-[-5px] p-0.5 bg-red-500 rounded-full text-white shadow-md hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {existingImages.length + newImageFiles.length < 5 && (
                        <label
                          htmlFor="image-upload"
                          className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <ImagePlus className="w-8 h-8 text-gray-400" />
                          <span className="mt-1 text-xs text-gray-500">
                            이미지 추가
                          </span>
                        </label>
                      )}
                      <Input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </div>
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
