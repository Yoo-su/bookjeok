import { z } from "zod";

import { KOREA_DISTRICTS } from "@/shared/constants/korea-districts";

export const sellFormSchema = z
  .object({
    title: z
      .string()
      .min(5, "제목은 5자 이상 입력해주세요.")
      .max(50, "제목은 50자를 초과할 수 없습니다."),
    price: z
      .string()
      .min(1, "가격을 입력해주세요.")
      .refine((val) => /^\d+$/.test(val), "숫자만 입력 가능합니다.")
      .refine((val) => parseInt(val) > 0, "가격은 0보다 커야 합니다."),
    city: z.string().min(1, "시/도를 선택해주세요."),
    district: z.string(),
    content: z
      .string()
      .min(10, "상세 내용은 10자 이상 입력해주세요.")
      .max(1000, "상세 내용은 1,000자를 초과할 수 없습니다."),
    images: z
      .custom<FileList>()
      .refine(
        (files) => files && files.length > 0,
        "이미지를 1개 이상 등록해주세요."
      )
      .refine(
        (files) => files && files.length <= 5,
        "이미지는 최대 5개까지 등록할 수 있습니다."
      ),
  })
  // .refine()을 사용하여 객체 전체에 대한 유효성 검사를 추가합니다.
  .refine(
    (data) => {
      // 선택된 'city'에 해당하는 시/군/구 목록을 가져옵니다.
      const districtsForCity = KOREA_DISTRICTS[data.city];

      // 만약 시/군/구 목록이 존재하고 비어있지 않다면 (예: 서울특별시),
      if (districtsForCity && districtsForCity.length > 0) {
        // 'district' 필드는 반드시 값이 있어야 합니다.
        return !!data.district;
      }

      // 시/군/구 목록이 없다면 (예: 세종특별자치시), 이 검증은 항상 통과합니다.
      return true;
    },
    {
      // 유효성 검증에 실패했을 때 보여줄 메시지
      message: "시/군/구를 선택해주세요.",
      // 이 에러가 어떤 필드에 해당하는지 명시
      path: ["district"],
    }
  );

export type SellFormValues = z.infer<typeof sellFormSchema>;
