"use server";

import { put } from "@vercel/blob";
import { z } from "zod";

// Zod 스키마를 사용해 파일 유효성 검사를 할 수 있습니다.
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ImageSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "이미지 파일이 필요합니다.")
  .refine(
    (file) => file.size <= MAX_FILE_SIZE,
    "이미지 크기는 4MB를 초과할 수 없습니다."
  )
  .refine(
    (file) => ALLOWED_IMAGE_TYPES.includes(file.type),
    "지원되지 않는 이미지 형식입니다."
  );

export async function uploadImages(
  formData: FormData,
  provider: string,
  id: number
) {
  const imageFiles = formData.getAll("images") as File[];

  try {
    // 각 파일 유효성 검사
    const validationResult = z.array(ImageSchema).safeParse(imageFiles);
    if (!validationResult.success) {
      throw new Error(
        validationResult.error.issues.map((e) => e.message).join(", ")
      );
    }

    // 모든 파일을 Vercel Blob에 병렬로 업로드
    const blobs = await Promise.all(
      imageFiles.map((file) =>
        put(`${provider}-${id}/sales-images/${file.name}`, file, {
          access: "public", // 업로드된 파일을 공개적으로 접근 가능하게 설정
        })
      )
    );

    return { success: true, blobs };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "이미지 업로드에 실패했습니다.",
    };
  }
}
