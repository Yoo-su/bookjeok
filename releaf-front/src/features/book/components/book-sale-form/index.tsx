"use client";

import { BookOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

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

import { useBookSaleForm } from "../../hooks/use-book-sale-form";
import { BookSearchModal } from "../book-search-modal";

export const BookSaleForm = () => {
  const {
    form,
    imagePreviews,
    isSubmitDisabled,
    selectedBook,
    setSelectedBook,
    handleImagesAdd,
    handleImageRemove,
    onSubmit,
  } = useBookSaleForm();

  return (
    <Card className="w-full border-none shadow-none sm:border sm:shadow-sm">
      <CardHeader className="px-0 sm:px-6">
        <CardTitle className="text-2xl">중고책 판매글 작성</CardTitle>
        <CardDescription>
          판매할 책의 정보를 정확하게 입력해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-8">
            <FormField
              control={form.control}
              name="book"
              render={() => (
                <>
                  <FormLabel>판매할 책</FormLabel>
                  <FormItem>
                    {!selectedBook ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 mb-2 border-2 border-dashed rounded-xl bg-muted/30 gap-6 hover:bg-muted/50 transition-colors group">
                        <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-2">
                          <h3 className="font-semibold text-lg">
                            판매할 책을 선택해주세요
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            ISBN, 제목, 저자명으로 검색하여 판매할 책을 등록할
                            수 있습니다.
                          </p>
                        </div>
                        <BookSearchModal
                          onSelect={setSelectedBook}
                          trigger={
                            <Button size="lg" className="px-8 font-semibold">
                              책 검색하기
                            </Button>
                          }
                        />
                      </div>
                    ) : (
                      <div className="relative flex flex-col sm:flex-row items-start sm:items-center p-6 mb-2 border rounded-xl bg-card shadow-sm gap-6 group overflow-hidden">
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
                              {selectedBook.author}{" "}
                              <span className="mx-1">·</span>{" "}
                              {selectedBook.publisher}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <BookSearchModal
                              onSelect={setSelectedBook}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                >
                                  다른 책 선택
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-1 min-h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                </>
              )}
            />

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

            <div className="border rounded-xl p-4 sm:p-6 bg-muted/20 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-base">직거래 희망 장소</h3>
                <p className="text-sm text-muted-foreground">
                  구매자와 만나서 거래할 안전한 장소를 지도로 선택해주세요.
                </p>
              </div>
              <MapLocationSelector
                onLocationSelect={(lat, lng, addressInfo) => {
                  form.setValue("latitude", lat);
                  form.setValue("longitude", lng);

                  if (addressInfo) {
                    if (addressInfo.placeName) {
                      form.setValue("placeName", addressInfo.placeName);
                    } else {
                      form.setValue("placeName", "");
                    }
                  } else {
                    if (!addressInfo && (lat !== 0 || lng !== 0)) {
                      toast.error(
                        "주소가 확인되지 않는 지역입니다. 정확한 위치를 다시 선택해주세요."
                      );
                    }
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
                      form.setValue("city", value, { shouldValidate: true });
                      form.setValue("district", "", { shouldValidate: true });
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

            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel>
                    {`책 상태 이미지 (${imagePreviews.length} / 5)`}
                  </FormLabel>
                  <FormControl>
                    <ImageUploader
                      previews={imagePreviews}
                      onImagesAdd={handleImagesAdd}
                      onImageRemove={handleImageRemove}
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
              판매글 등록하기
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
