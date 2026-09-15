import { TradeMethod } from "@bookjeok/core";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { EmailVerificationAlert } from "@/features/auth/components/email-verification-alert";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { BookSearchModal } from "@/features/book/components/common/book-search-modal";
import { StatefulButton } from "@/shared/components/aceternityui/stateful-button";
import { BookIcon, BoxIcon, TruckFastIcon } from "@/shared/components/icons";
import { Handshake, Loader2 } from "@/shared/components/icons/iconsax";
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

import { useBookSaleForm } from "../../../hooks/use-book-sale-form";
import { UploadProgressModal } from "../../common/upload-progress-modal";
import { RegionDisplayCard } from "../region-display-card";
import { TradeMethodField } from "../trade-method-field";

// 카카오맵 SDK가 무거우므로 지연 로딩
const MapLocationSelector = dynamic(
  () =>
    import("@/shared/components/map/map-location-selector").then(
      (mod) => mod.MapLocationSelector,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] rounded-lg animate-pulse bg-muted/30" />
    ),
  },
);

export const BookSaleForm = () => {
  const t = useTranslations("market.form");
  const tVerify = useTranslations("auth.verification.alert");
  const user = useAuthStore((state) => state.user);
  const isEmailUnverified = !!user && !user.isEmailVerified;

  const {
    form,
    imagePreviews,
    isSubmitDisabled,
    selectedBook,
    setSelectedBook,
    handleImagesAdd,
    handleImageRemove,
    uploadStep,
    uploadProgress,
    isModalOpen,
    onSubmit,
  } = useBookSaleForm();

  return (
    <Card className="w-full border-none shadow-none sm:border sm:border-stone-200/90 dark:sm:border-stone-800 sm:shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:sm:shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      <CardHeader className="px-0 sm:px-6">
        <CardTitle className="text-2xl">{t("title_write")}</CardTitle>
        <CardDescription>{t("desc_write")}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {isEmailUnverified && (
          <EmailVerificationAlert
            title={tVerify("sale_form_title")}
            description={tVerify("sale_form_desc")}
            className="mb-6"
          />
        )}
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-8">
            <fieldset
              disabled={isSubmitDisabled || isEmailUnverified}
              className="space-y-8"
            >
              <FormField
                control={form.control}
                name="book"
                render={() => (
                  <>
                    <FormLabel>{t("book.label")}</FormLabel>
                    <FormItem>
                      {!selectedBook ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 mb-2 border-2 border-dashed rounded-xl bg-muted/30 gap-6 hover:bg-muted/50 transition-colors group">
                          <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <BookIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div className="text-center space-y-2">
                            <h3 className="font-semibold text-lg">
                              {t("book.empty_title")}
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                              {t("book.empty_desc")}
                            </p>
                          </div>
                          <BookSearchModal
                            onSelect={setSelectedBook}
                            trigger={
                              <Button size="lg" className="px-8 font-semibold">
                                {t("book.search")}
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
                                    {t("book.change")}
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

              <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>{t("fields.title")}</FormLabel>
                        <span className="text-xs text-muted-foreground">
                          {field.value?.length || 0} / 50{t("char_unit")}
                        </span>
                      </div>
                      <FormControl>
                        <Input
                          placeholder={t("fields.title_placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.price")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                            ₩
                          </span>
                          <Input
                            type="number"
                            placeholder={t("fields.price_placeholder")}
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* 거래 방식 선택 (택배 옵션은 PG 승인 전까지 비활성) */}
              <TradeMethodField control={form.control} name="tradeMethod" />

              <div className="border rounded-xl p-4 sm:p-6 bg-muted/20 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">
                    {t("fields.location_title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("fields.location_desc")}
                  </p>
                </div>
                <MapLocationSelector
                  onLocationSelect={(lat, lng, addressInfo) => {
                    form.setValue("latitude", lat);
                    form.setValue("longitude", lng);

                    if (addressInfo) {
                      if (addressInfo.city) {
                        form.setValue("city", addressInfo.city, {
                          shouldValidate: true,
                        });
                      }
                      if (addressInfo.district) {
                        form.setValue("district", addressInfo.district, {
                          shouldValidate: true,
                        });
                      }
                      if (addressInfo.placeName) {
                        form.setValue("placeName", addressInfo.placeName);
                      } else {
                        form.setValue("placeName", "");
                      }
                    } else {
                      if (!addressInfo && (lat !== 0 || lng !== 0)) {
                        toast.error(t("error_location"));
                      }
                      form.setValue("placeName", "");
                    }
                  }}
                />
                <RegionDisplayCard
                  city={form.watch("city")}
                  district={form.watch("district")}
                  placeName={form.watch("placeName")}
                  error={
                    form.formState.errors.city?.message ||
                    form.formState.errors.district?.message
                  }
                />

                <FormField
                  control={form.control}
                  name="placeName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t("fields.location_name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("fields.location_name_placeholder")}
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
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
                      {`${t("fields.images")} (${imagePreviews.length} / 5)`}
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
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("fields.content")}</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        {field.value?.length || 0} / 1000{t("char_unit")}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {((t.raw("suggested_tags") as string[]) || []).map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const currentContent =
                                form.getValues("content") || "";
                              if (!currentContent.includes(tag)) {
                                form.setValue(
                                  "content",
                                  currentContent
                                    ? `${currentContent}\n${tag}`
                                    : tag,
                                  { shouldValidate: true },
                                );
                              }
                            }}
                            className="text-xs px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                          >
                            + {tag}
                          </button>
                        ),
                      )}
                    </div>

                    <FormControl>
                      <Textarea
                        placeholder={t("fields.content_placeholder")}
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
            </fieldset>

            <StatefulButton
              type="submit"
              status={
                uploadStep === "success"
                  ? "success"
                  : uploadStep === "idle"
                    ? "idle"
                    : "loading"
              }
              className="w-full mt-10"
              disabled={isSubmitDisabled || isEmailUnverified}
            >
              {t("submit")}
            </StatefulButton>
          </form>
        </Form>
        <UploadProgressModal
          open={isModalOpen}
          step={uploadStep}
          progress={uploadProgress}
        />
      </CardContent>
    </Card>
  );
};
