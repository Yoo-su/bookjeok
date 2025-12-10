"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";

import { MapLocationSelector } from "@/shared/components/map/map-location-selector";
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

import { useBookSaleEditForm } from "../../hooks/use-book-sale-edit-form";
import { UsedBookSale } from "../../types";

interface BookSaleEditFormProps {
  sale: UsedBookSale;
}

export const BookSaleEditForm = ({ sale }: BookSaleEditFormProps) => {
  const {
    form,
    existingImages,
    newImagePreviews,
    isSubmitDisabled,
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
        <label className="font-medium text-gray-900 text-sm">판매할 책</label>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center p-6 mb-8 border rounded-xl bg-card shadow-sm gap-6 group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="relative w-24 h-36 shrink-0 rounded-lg overflow-hidden shadow-md">
            <Image
              src={sale.book.image}
              alt={sale.book.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="space-y-1">
              <h3 className="font-bold text-xl leading-tight text-foreground">
                {sale.book.title}
              </h3>
              <p className="text-muted-foreground">
                {sale.book.author} <span className="mx-1">·</span>{" "}
                {sale.book.publisher}
              </p>
            </div>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>게시글 제목</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="판매글 제목을 입력하세요"
                        {...field}
                      />
                    </FormControl>
                    <div className="mt-1 min-h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

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
                    <div className="mt-1 min-h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <div className="border rounded-xl p-4 sm:p-6 bg-muted/20 space-y-4 col-span-1 md:col-span-2">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">직거래 희망 장소</h3>
                  <p className="text-sm text-muted-foreground">
                    구매자와 만나서 거래할 안전한 장소를 지도로 선택해주세요.
                  </p>
                </div>

                <MapLocationSelector
                  defaultLat={sale.latitude ?? undefined}
                  defaultLng={sale.longitude ?? undefined}
                  onLocationSelect={(lat, lng, addressInfo) => {
                    form.setValue("latitude", lat);
                    form.setValue("longitude", lng);

                    // 장소명이 있는 경우 (검색 선택)
                    if (addressInfo?.placeName) {
                      form.setValue("placeName", addressInfo.placeName);
                    }
                    // 장소명이 없는 경우 (지도 클릭 등) -> 기존 장소명 초기화
                    // 단, addressInfo가 undefined인 경우(지도 로드 실패 등)는 건드리지 않음?
                    // 아니오, 사용자가 직접 찍은 곳은 장소명이 없으므로 초기화하는 게 맞음.
                    else {
                      form.setValue("placeName", "");
                    }
                  }}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="md:col-span-2 space-y-2">
                    <LocationSelector
                      className="bg-background"
                      city={form.watch("city")}
                      district={form.watch("district")}
                      onCityChange={(value) => {
                        form.setValue("city", value, {
                          shouldValidate: true,
                        });
                        form.setValue("district", "", {
                          shouldValidate: true,
                        });
                      }}
                      onDistrictChange={(value) => {
                        form.setValue("district", value, {
                          shouldValidate: true,
                        });
                      }}
                    />
                    <div className="flex gap-4">
                      <div className="flex-1 min-h-5">
                        {form.formState.errors.city && (
                          <p className="text-sm font-medium text-destructive">
                            {form.formState.errors.city.message}
                          </p>
                        )}
                      </div>
                      <div className="flex-1 min-h-5">
                        {form.formState.errors.district && (
                          <p className="text-sm font-medium text-destructive">
                            {form.formState.errors.district.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="placeName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>상세 위치명 (직접 수정 가능)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="예: 강남역 10번 출구 (지도 선택 시 자동 입력)"
                            className="bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <div className="mt-1 min-h-5">
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
                  <div className="mt-1 min-h-5">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full mt-10!"
              disabled={isSubmitDisabled}
            >
              {isSubmitDisabled && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              수정 완료
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
