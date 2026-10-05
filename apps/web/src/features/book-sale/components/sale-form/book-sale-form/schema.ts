import {
  SALE_CONTENT_MAX_LENGTH,
  SALE_CONTENT_MIN_LENGTH,
  SALE_IMAGE_MAX_COUNT,
  SALE_TITLE_MAX_LENGTH,
  SALE_TITLE_MIN_LENGTH,
  TradeMethod,
} from "@bookjeok/core";
import { z } from "zod";

export const createSellFormSchema = (
  t: (key: string, values?: Record<string, number>) => string,
) =>
  z
    .object({
      title: z
        .string()
        .min(
          SALE_TITLE_MIN_LENGTH,
          t("title_min", { min: SALE_TITLE_MIN_LENGTH }),
        )
        .max(
          SALE_TITLE_MAX_LENGTH,
          t("title_max", { max: SALE_TITLE_MAX_LENGTH }),
        ),
      price: z
        .string()
        .refine((val) => /^\d+$/.test(val), t("price_number"))
        .refine((val) => parseInt(val) > 0, t("price_min")),
      tradeMethod: z.nativeEnum(TradeMethod),
      city: z.string().min(1, t("city_required")),
      district: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      placeName: z.string().min(1, t("location_required")),
      content: z
        .string()
        .min(
          SALE_CONTENT_MIN_LENGTH,
          t("content_min", { min: SALE_CONTENT_MIN_LENGTH }),
        )
        .max(
          SALE_CONTENT_MAX_LENGTH,
          t("content_max", { max: SALE_CONTENT_MAX_LENGTH }),
        ),
      images: z
        .custom<FileList>()
        .refine((files) => files && files.length > 0, t("images_min"))
        .refine(
          (files) => files && files.length <= SALE_IMAGE_MAX_COUNT,
          t("images_max", { max: SALE_IMAGE_MAX_COUNT }),
        ),
      book: z
        .object({
          isbn: z.string(),
          title: z.string(),
          author: z.string(),
          publisher: z.string(),
          image: z.string(),
          description: z.string(),
          pubdate: z.string().optional(),
          discount: z.string(),
        })
        .nullable()
        .refine((val) => val !== null, t("book_required")),
    })
    .refine((data) => Boolean(data.city && data.district), {
      message: t("district_required"),
      path: ["district"],
    });

export type SellFormValues = z.infer<ReturnType<typeof createSellFormSchema>>;
