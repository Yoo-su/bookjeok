import { REVIEW_TAG_MAX_COUNT } from "@bookjeok/core";
import { z } from "zod";

export const createReviewSchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().min(1, t("title_required")),
    content: z.string().min(1, t("content_required")),
    isbn: z.string().min(1, t("book_required")),
    category: z.string().min(1, t("category_required")),
    tags: z
      .array(z.string())
      .min(1, t("tags_min"))
      .max(REVIEW_TAG_MAX_COUNT, t("tags_max")),
    rating: z.number().min(0).max(5),
    isPublic: z.boolean(),
  });

export type ReviewSchemaValues = z.infer<ReturnType<typeof createReviewSchema>>;
