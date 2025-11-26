import { z } from "zod";

import { sellFormSchema } from "../book-sale-form/schema";

// 기존 sellFormSchema에서 images 필드를 제거하고,
// optional인 images 필드를 새로 정의하여 병합합니다.
export const editFormSchema = sellFormSchema.omit({ images: true }).extend({
  images: z
    .custom<FileList>()
    .refine(
      (files) => files.length <= 5,
      "새로 추가하는 이미지는 최대 5개까지 등록할 수 있습니다."
    )
    .optional(),
});

// 수정 폼에서 사용할 타입
export type EditFormValues = z.infer<typeof editFormSchema>;
