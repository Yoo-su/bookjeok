import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useCreateBookSaleMutation } from "../../mutations";
import { BookInfo, CreateBookSaleParams } from "../../types";
import { sellFormSchema, SellFormValues } from "./schema";

interface UseBookSaleFormProps {
  bookInfo: BookInfo;
}

export const useBookSaleForm = ({ bookInfo }: UseBookSaleFormProps) => {
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

  const handleImagesAdd = (newFiles: FileList) => {
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

  const handleImageRemove = (indexToRemove: number) => {
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

  return {
    form,
    imagePreviews,
    isPending,
    handleImagesAdd,
    handleImageRemove,
    onSubmit: form.handleSubmit(onSubmit),
  };
};
