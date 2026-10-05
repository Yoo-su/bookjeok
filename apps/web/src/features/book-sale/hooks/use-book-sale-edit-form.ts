import {
  SALE_IMAGE_MAX_COUNT,
  TradeMethod,
  UpdateBookSaleParams,
  UsedBookSale,
} from "@bookjeok/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useImageUpload } from "@/shared/hooks/use-image-upload";

import {
  createEditFormSchema,
  EditFormValues,
} from "../components/sale-form/book-sale-edit-form/schema";
import { useUpdateBookSaleMutation } from "../mutations";
import { useSaleUploadProgress } from "./use-sale-upload-progress";

interface UseBookSaleEditFormProps {
  sale: UsedBookSale;
}

export const useBookSaleEditForm = ({ sale }: UseBookSaleEditFormProps) => {
  const t = useTranslations("market.validation");
  const { mutateAsync, isPending, isSuccess } = useUpdateBookSaleMutation();

  const { uploadStep, uploadProgress, isModalOpen, trackUpload } =
    useSaleUploadProgress();

  const isSubmitDisabled = isPending || isSuccess || isModalOpen;

  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const {
    existingImages,
    newPreviews: newImagePreviews,
    handleImagesAdd,
    handleNewImageRemove,
    handleExistingImageRemove,
  } = useImageUpload({
    maxFiles: SALE_IMAGE_MAX_COUNT,
    initialExistingImages: sale.imageUrls,
    onFilesChange: (files) => {
      setNewImageFiles(files);
      const dataTransfer = new DataTransfer();
      files.forEach((file) => dataTransfer.items.add(file));
      form.setValue("images", dataTransfer.files, { shouldValidate: true });
    },
    onExistingImagesChange: (urls) => {
      const deleted = sale.imageUrls.filter((url) => !urls.includes(url));
      setDeletedImages(deleted);
    },
  });

  const isPaymentFeatureEnabled =
    process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED === "true";

  const form = useForm<EditFormValues>({
    resolver: zodResolver(createEditFormSchema(t)),
    defaultValues: {
      title: sale.title,
      price: String(sale.price),
      tradeMethod: isPaymentFeatureEnabled
        ? (sale.tradeMethod ?? TradeMethod.BOTH)
        : TradeMethod.DIRECT_ONLY,
      city: sale.city,
      district: sale.district,
      latitude: sale.latitude ?? undefined,
      longitude: sale.longitude ?? undefined,
      placeName: sale.placeName ?? "",
      content: sale.content,
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: EditFormValues) => {
    if (existingImages.length + newImageFiles.length === 0) {
      form.setError("images", { message: t("images_min") });
      return;
    }

    const payload: UpdateBookSaleParams = {
      title: data.title,
      price: Number(data.price),
      tradeMethod: data.tradeMethod,
      city: data.city,
      district: data.district,
      latitude: data.latitude,
      longitude: data.longitude,
      placeName: data.placeName,
      content: data.content,
      imageUrls: existingImages,
    };

    await trackUpload((onProgressState) =>
      mutateAsync({
        saleId: sale.id,
        payload,
        newImageFiles,
        deletedImageUrls: deletedImages,
        onProgressState,
      }),
    );
  };

  return {
    form,
    existingImages,
    newImagePreviews,
    isSubmitDisabled,
    handleImagesAdd,
    handleExistingImageRemove,
    handleNewImageRemove,
    uploadStep,
    uploadProgress,
    isModalOpen,
    onSubmit: form.handleSubmit(onSubmit, () => {
      toast.error(t("submit_error"));
    }),
  };
};
