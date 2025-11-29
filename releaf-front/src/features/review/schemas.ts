import { z } from "zod";

export const reviewSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  content: z.string().min(1, "내용을 입력해주세요."),
  bookIsbn: z.string().min(1, "책을 선택해주세요."),
  category: z.string().min(1, "카테고리를 선택해주세요."),
  tags: z
    .array(z.string())
    .min(1, "태그를 최소 1개 이상 입력해주세요.")
    .max(5, "태그는 최대 5개까지 입력 가능합니다."),
  rating: z.number().min(0).max(5),
});

export type ReviewSchemaValues = z.infer<typeof reviewSchema>;
