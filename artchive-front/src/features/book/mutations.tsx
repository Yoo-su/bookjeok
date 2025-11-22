"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { useAuthStore } from "../auth/store";
import { deleteImages } from "./actions/delete-action";
import { uploadImages } from "./actions/upload-action";
import {
  createBookSale,
  deleteBookSale,
  updateBookSale,
  updateBookSaleStatus,
} from "./apis";
import {
  CreateBookSaleParams,
  UpdateBookSaleParams,
  UsedBookSale,
} from "./types";

interface CreateSaleVariables {
  imageFiles: File[];
  payload: Omit<CreateBookSaleParams, "imageUrls">;
}
export const useCreateBookSaleMutation = () => {
  const router = useRouter();
  const { provider, id } = useAuthStore((state) => state.user)!;

  return useMutation<UsedBookSale, Error, CreateSaleVariables>({
    mutationFn: async ({ imageFiles, payload }) => {
      // 1. 클라이언트에서 직접 Vercel Blob으로 이미지 업로드
      const blobs = await Promise.all(
        imageFiles.map((file) => {
          const filePath = `${provider}-${id}/sales-images/${file.name}`;
          return upload(filePath, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
        })
      );
      const imageUrls = blobs.map((blob) => blob.url);

      // 2. 업로드된 이미지 URL을 포함하여 판매글 생성 API 호출
      const finalPayload = { ...payload, imageUrls };
      const saleResult = await createBookSale(finalPayload);

      if (!saleResult.success) {
        throw new Error("게시글 등록에 실패했습니다.");
      }
      return saleResult;
    },
    onSuccess: () => {
      alert("판매글이 성공적으로 등록되었습니다.");
      router.push("/my-page/sales");
    },
    onError: (error) => {
      console.error("Submission failed:", error);
      alert(error.message || "오류가 발생했습니다. 다시 시도해주세요.");
    },
  });
};

/**
 * 판매글 상태를 업데이트하는 뮤테이션 훅 (낙관적 업데이트 적용)
 */
export const useUpdateBookSaleStatusMutation = () => {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.bookKeys.mySales.queryKey;

  return useMutation({
    mutationFn: updateBookSaleStatus,
    onMutate: async ({ saleId, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSales = queryClient.getQueryData<UsedBookSale[]>(queryKey);

      queryClient.setQueryData<UsedBookSale[]>(queryKey, (old) =>
        old
          ? old.map((sale) =>
              sale.id === saleId ? { ...sale, status: status as any } : sale
            )
          : []
      );

      return { previousSales };
    },
    onError: (err, variables, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKey, context.previousSales);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookKeys._def });
    },
  });
};

/**
 * 중고책 판매글 수정을 위한 Mutation Hook
 */
interface UpdateSaleVariables {
  saleId: number;
  payload: UpdateBookSaleParams;
  newImageFiles?: File[];
  deletedImageUrls?: string[];
}
export const useUpdateBookSaleMutation = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { provider, id } = useAuthStore((state) => state.user)!;

  return useMutation<UsedBookSale, Error, UpdateSaleVariables>({
    mutationFn: async ({
      saleId,
      payload,
      newImageFiles = [],
      deletedImageUrls = [],
    }) => {
      // 1. 삭제할 이미지가 있으면 Vercel Blob에서 삭제
      if (deletedImageUrls.length > 0) {
        await deleteImages(deletedImageUrls);
      }

      // 2. 새로 추가할 이미지가 있으면 Vercel Blob에 업로드
      let newImageUrls: string[] = [];
      if (newImageFiles.length > 0) {
        const formData = new FormData();
        newImageFiles.forEach((file) => formData.append("images", file));
        const uploadResult = await uploadImages(formData, provider, id);
        if (!uploadResult.success || !uploadResult.blobs) {
          throw new Error("새 이미지 업로드에 실패했습니다.");
        }
        newImageUrls = uploadResult.blobs.map((blob) => blob.url);
      }

      // 3. 최종 이미지 목록을 조합하여 payload에 포함
      const finalImageUrls = [...(payload.imageUrls || []), ...newImageUrls];
      const finalPayload = { ...payload, imageUrls: finalImageUrls };

      // 4. 백엔드에 최종 데이터 업데이트 요청
      const result = await updateBookSale({ saleId, payload: finalPayload });
      if (!result.success) {
        throw new Error("게시글 정보 업데이트에 실패했습니다.");
      }
      return result;
    },
    onSuccess: (data) => {
      alert("판매글이 성공적으로 수정되었습니다.");
      // 관련 쿼리들을 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bookKeys.mySales.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bookKeys.saleDetail(String(data.id)).queryKey,
      });
      router.push("/my-page/sales");
    },
    onError: (error) => {
      alert(`수정 중 오류가 발생했습니다: ${error.message}`);
    },
  });
};

/**
 * 중고책 판매글 삭제를 위한 Mutation Hook
 */
export const useDeleteBookSaleMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, { saleId: number; imageUrls: string[] }>({
    mutationFn: async ({ saleId, imageUrls }) => {
      // 1. Vercel Blob에 저장된 이미지들 삭제
      if (imageUrls.length > 0) {
        await deleteImages(imageUrls);
      }
      // 2. 백엔드에 게시글 삭제 요청
      await deleteBookSale(saleId);
    },
    onSuccess: (_, { saleId }) => {
      alert("판매글이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookKeys._def });
      // 현재 페이지가 삭제된 게시글 상세 페이지일 경우 홈으로 이동
      if (window.location.pathname.includes(`/book/sale/${saleId}`)) {
        router.push("/my-page/sales");
      }
    },
    onError: (error) => {
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
    },
  });
};
