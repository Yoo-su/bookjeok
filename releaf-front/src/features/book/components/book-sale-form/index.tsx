"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
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

import { useCreateBookSaleMutation } from "../../mutations";
import { BookInfo, CreateBookSaleParams } from "../../types";
import { sellFormSchema, SellFormValues } from "./schema";

interface BookSaleFormProps {
  bookInfo: BookInfo;
}

export const BookSaleForm = ({ bookInfo }: BookSaleFormProps) => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const { mutate, isPending } = useCreateBookSaleMutation();

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: {
      title: "",
      price: "",
      content: "",
      city: "",
      district: "",
    },
    mode: "onBlur",
  });

  const selectedCity = form.watch("city");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (!newFiles) return;
    const currentFiles = Array.from(form.getValues("images") || []);
    const combinedFiles = [...currentFiles, ...Array.from(newFiles)];
    if (combinedFiles.length > 5) {
      alert("이미지는 최대 5개까지 첨부할 수 있습니다.");
      return;
    }
    const dataTransfer = new DataTransfer();
    combinedFiles.forEach((file) => dataTransfer.items.add(file));
    form.setValue("images", dataTransfer.files, { shouldValidate: true });
    const newPreviews = combinedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (indexToRemove: number) => {
    const updatedPreviews = imagePreviews.filter(
      (_, index) => index !== indexToRemove
    );
    setImagePreviews(updatedPreviews);

    const currentFiles = Array.from(form.getValues("images") || []);
    const updatedFiles = currentFiles.filter(
      (_, index) => index !== indexToRemove
    );
    const dataTransfer = new DataTransfer();
    updatedFiles.forEach((file) => dataTransfer.items.add(file));
    form.setValue("images", dataTransfer.files, { shouldValidate: true });
  };

  const onSubmit = (data: SellFormValues) => {
    const imageFiles = Array.from(data.images);

    const payload: Omit<CreateBookSaleParams, "imageUrls"> = {
      title: data.title,
      price: data.price,
      city: data.city,
      district: data.district,
      content: data.content,
      book: {
        isbn: bookInfo.isbn,
        title: bookInfo.title,
        description: bookInfo.description,
        author: bookInfo.author,
        publisher: bookInfo.publisher,
        image: bookInfo.image,
        pubdate: bookInfo.pubdate,
      },
    };

    mutate({ imageFiles, payload });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">중고책 판매글 작성</CardTitle>
        <CardDescription>
          판매할 책의 정보를 정확하게 입력해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center p-4 mb-6 border rounded-lg bg-gray-50">
          <Image
            src={bookInfo.image}
            alt={bookInfo.title}
            width={60}
            height={80}
            className="object-cover rounded-md shadow-md"
          />
          <div className="ml-4">
            <p className="font-semibold text-gray-800">{bookInfo.title}</p>
            <p className="text-sm text-gray-500">{bookInfo.author} 저</p>
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
                            {city}
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
                      defaultValue={field.value}
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
                              {district}
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
                    {`책 상태 이미지 (${imagePreviews.length} / 5)`}
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap items-center gap-4">
                      {imagePreviews.map((src, index) => (
                        <div key={src} className="relative">
                          <Image
                            src={src}
                            alt={`Preview ${index}`}
                            width={96}
                            height={96}
                            className="object-cover w-24 h-24 rounded-lg shadow"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            aria-label={`Preview ${index} 삭제`}
                            className="absolute top-[-5px] right-[-5px] p-0.5 bg-red-500 rounded-full text-white shadow-md hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {imagePreviews.length < 5 && (
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
              판매글 등록하기
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
