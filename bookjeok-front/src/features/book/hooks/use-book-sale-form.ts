import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  sellFormSchema,
  SellFormValues,
} from "../components/book-sale-form/schema";
import { useCreateBookSaleMutation } from "../mutations";
import { BookInfo, CreateBookSaleParams } from "../types";

export const useBookSaleForm = () => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { mutate, isPending, isSuccess } = useCreateBookSaleMutation();

  const isSubmitDisabled = isPending || isSuccess;

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: {
      title: "",
      price: "",
      content: "",
      city: "",
      district: "",
      latitude: undefined,
      longitude: undefined,
      placeName: "",
      book: null,
    },
    mode: "onBlur",
  });

  const selectedBook = form.watch("book");

  const handleBookSelect = (book: BookInfo | null) => {
    form.setValue("book", book, { shouldValidate: true });
  };

  const handleImagesAdd = (newFiles: FileList) => {
    const currentFiles = Array.from(form.getValues("images") || []);
    const combinedFiles = [...currentFiles, ...Array.from(newFiles)];

    if (combinedFiles.length > 5) {
      toast.error("이미지는 최대 5개까지 첨부할 수 있습니다.");
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
    if (!data.book) return;
    const imageFiles = Array.from(data.images);

    const payload: Omit<CreateBookSaleParams, "imageUrls"> = {
      title: data.title,
      price: Number(data.price),
      city: data.city,
      district: data.district,
      latitude: data.latitude,
      longitude: data.longitude,
      placeName: data.placeName,
      content: data.content,
      book: {
        isbn: data.book.isbn,
        title: data.book.title,
        description: data.book.description,
        author: data.book.author,
        publisher: data.book.publisher,
        image: data.book.image,
        pubdate: data.book.pubdate,
      },
    };

    mutate({ imageFiles, payload });
  };

  return {
    form,
    imagePreviews,
    isSubmitDisabled,
    selectedBook,
    setSelectedBook: handleBookSelect,
    handleImagesAdd,
    handleImageRemove,
    onSubmit: form.handleSubmit(onSubmit, (errors) => {
      console.log("Validation errors:", errors);
      toast.error("입력 정보를 다시 확인해주세요. (필수 항목 누락 등)");
    }),
  };
};
