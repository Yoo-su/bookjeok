import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useUpdateBookSaleMutation } from "../../mutations";
import { UpdateBookSaleParams, UsedBookSale } from "../../types";
import { editFormSchema, EditFormValues } from "./schema";

interface UseBookSaleEditFormProps {
  sale: UsedBookSale;
}

export const useBookSaleEditForm = ({ sale }: UseBookSaleEditFormProps) => {
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

  // newImageFiles가 변경될 때마다 폼의 'images' 필드를 업데이트합니다.
  useEffect(() => {
    const dataTransfer = new DataTransfer();
    newImageFiles.forEach((file) => dataTransfer.items.add(file));
    form.setValue("images", dataTransfer.files, { shouldValidate: true });
  }, [newImageFiles, form]);

  const handleImagesAdd = (newFiles: FileList) => {
    const files = Array.from(newFiles);
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

  const handleExistingImageRemove = (urlToRemove: string) => {
    setExistingImages((prev) => prev.filter((url) => url !== urlToRemove));
    setDeletedImages((prev) => [...prev, urlToRemove]);
  };

  const handleNewImageRemove = (indexToRemove: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const onSubmit = (data: EditFormValues) => {
    // 전체 이미지 개수 검증
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

  return {
    form,
    existingImages,
    newImagePreviews,
    isPending,
    handleImagesAdd,
    handleExistingImageRemove,
    handleNewImageRemove,
    onSubmit: form.handleSubmit(onSubmit),
  };
};
