import { privateApiClient } from "@bookjeok/api-client";
import {
  API_PATHS,
  bookSaleKeys,
  CreateBookSaleParams,
  UpdateBookSaleParams,
  UsedBookSale,
} from "@bookjeok/core";
import {
  useCreateBookSaleMutation as useSharedCreateBookSaleMutation,
  useDeleteBookSaleMutation as useSharedDeleteBookSaleMutation,
  useUpdateBookSaleMutation as useSharedUpdateBookSaleMutation,
  useUpdateBookSaleStatusMutation as useSharedUpdateBookSaleStatusMutation,
} from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { revalidateBookSale } from "@/shared/actions/revalidate";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { compressImages } from "@/shared/utils/compress-image";
import { handleMutationError } from "@/shared/utils/error-handler";
import { purgeRouteCache } from "@/shared/utils/purge-route-cache";

import { deleteImages } from "../actions/delete-action";
import { uploadImages } from "../actions/upload-action";
import { uploadSaleImages } from "../services/image-upload-service";

interface CreateSaleVariables {
  imageFiles: File[];
  payload: Omit<CreateBookSaleParams, "imageUrls">;
  idempotencyKey?: string;
  onProgressState?: (
    step: "compressing" | "uploading" | "submitting",
    percent: number,
  ) => void;
}

/**
 * 이미지 업로드 전 만료된 AccessToken을 미리 Refresh하는 헬퍼 함수
 */
const ensureFreshAuthToken = async (loginRequiredMsg: string) => {
  await privateApiClient.get(API_PATHS.user.profile);
  const authState = useAuthStore.getState();
  if (!authState.user || !authState.accessToken) {
    throw new Error(loginRequiredMsg);
  }
  return {
    user: authState.user,
    accessToken: authState.accessToken,
  };
};

/**
 * 중고책 판매글을 생성하는 뮤테이션 훅입니다.
 */
export const useCreateBookSaleMutation = () => {
  const t = useTranslations("market.toast");
  const router = useRouter();
  const queryClient = useQueryClient();

  const sharedMutation = useSharedCreateBookSaleMutation({
    onSuccess: async (data: UsedBookSale) => {
      toast.success(t("create_success"));
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
      await purgeRouteCache(revalidateBookSale({ saleId: data.id }), () =>
        router.refresh(),
      );
      router.push(PATHS.MY_PAGE_SALES);
    },
    onError: (error: Error) => {
      handleMutationError(error, "판매글 등록");
    },
  });

  const processCreate = async ({
    imageFiles,
    payload,
    idempotencyKey,
    onProgressState,
  }: CreateSaleVariables) => {
    onProgressState?.("compressing", 10);
    const { user, accessToken } = await ensureFreshAuthToken(
      t("login_required"),
    );

    onProgressState?.("uploading", 25);
    const imageUrls = await uploadSaleImages(
      imageFiles,
      { provider: user.provider, id: user.id },
      accessToken,
      {
        onCompressProgress: () => onProgressState?.("compressing", 20),
        onProgress: (percent) =>
          onProgressState?.(
            "uploading",
            Math.min(85, 25 + Math.round(percent * 0.6)),
          ),
      },
    );

    onProgressState?.("submitting", 90);
    const finalPayload = { ...payload, imageUrls };
    return { finalPayload, idempotencyKey };
  };

  return {
    ...sharedMutation,
    mutate: async (variables: CreateSaleVariables) => {
      const { finalPayload, idempotencyKey } = await processCreate(variables);
      return sharedMutation.mutate({
        ...finalPayload,
        idempotencyKey,
      } as CreateBookSaleParams & { idempotencyKey?: string });
    },
    mutateAsync: async (variables: CreateSaleVariables) => {
      const { finalPayload, idempotencyKey } = await processCreate(variables);
      return sharedMutation.mutateAsync({
        ...finalPayload,
        idempotencyKey,
      } as CreateBookSaleParams & { idempotencyKey?: string });
    },
  };
};

/**
 * 판매글 상태를 업데이트하는 뮤테이션 훅입니다.
 */
export const useUpdateBookSaleStatusMutation = () => {
  const router = useRouter();

  return useSharedUpdateBookSaleStatusMutation({
    // 판매 상태(판매중 · 예약중 · 판매완료)는 마켓 목록과 상세의 배지로 노출되므로
    // 클라이언트 캐시(공유 훅의 onSettled)뿐 아니라 ISR 캐시도 함께 비운다.
    onSuccess: (data: UsedBookSale) => {
      void purgeRouteCache(revalidateBookSale({ saleId: data.id }), () =>
        router.refresh(),
      );
    },
  });
};

/**
 * 중고책 판매글 수정을 위한 뮤테이션 훅입니다.
 */
interface UpdateSaleVariables {
  saleId: number;
  payload: UpdateBookSaleParams;
  newImageFiles?: File[];
  deletedImageUrls?: string[];
  onProgressState?: (
    step: "compressing" | "uploading" | "submitting",
    percent: number,
  ) => void;
}

export const useUpdateBookSaleMutation = () => {
  const t = useTranslations("market.toast");
  const router = useRouter();
  const queryClient = useQueryClient();

  const sharedMutation = useSharedUpdateBookSaleMutation({
    onSuccess: async (data: UsedBookSale) => {
      toast.success(t("update_success"));
      // 판매글 하나가 바뀌면 그 글이 실린 마켓 목록 · 인기 · 연관 · 최근 목록이
      // 전부 낡는다. mySales/saleDetail만 지우면 나머지가 옛 가격·상태로 남으므로
      // 도메인 루트 접두사로 일괄 무효화한다. (생성 · 삭제와 동일한 규칙)
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
      await purgeRouteCache(revalidateBookSale({ saleId: data.id }), () =>
        router.refresh(),
      );
      router.push(PATHS.MY_PAGE_SALES);
    },
    onError: (error: Error) => {
      handleMutationError(error, "판매글 수정");
    },
  });

  const processUpdate = async ({
    saleId,
    payload,
    newImageFiles = [],
    deletedImageUrls = [],
    onProgressState,
  }: UpdateSaleVariables) => {
    onProgressState?.("compressing", 15);
    const { user, accessToken } = await ensureFreshAuthToken(
      t("login_required"),
    );

    if (deletedImageUrls.length > 0) {
      await deleteImages(deletedImageUrls);
    }

    let newImageUrls: string[] = [];
    if (newImageFiles.length > 0) {
      onProgressState?.("uploading", 30);
      newImageUrls = await uploadSaleImages(
        newImageFiles,
        { provider: user.provider, id: user.id },
        accessToken,
        {
          onProgress: (p) =>
            onProgressState?.(
              "uploading",
              Math.min(85, 30 + Math.round(p * 0.55)),
            ),
        },
      );
    }

    onProgressState?.("submitting", 90);
    const finalImageUrls = [...(payload.imageUrls || []), ...newImageUrls];
    const finalPayload = { ...payload, imageUrls: finalImageUrls };

    return { saleId, payload: finalPayload };
  };

  return {
    ...sharedMutation,
    mutate: async (variables: UpdateSaleVariables) => {
      const params = await processUpdate(variables);
      return sharedMutation.mutate(params);
    },
    mutateAsync: async (variables: UpdateSaleVariables) => {
      const params = await processUpdate(variables);
      return sharedMutation.mutateAsync(params);
    },
  };
};

/**
 * 중고책 판매글 삭제를 위한 뮤테이션 훅입니다.
 */
export const useDeleteBookSaleMutation = () => {
  const t = useTranslations("market.toast");
  const queryClient = useQueryClient();
  const router = useRouter();

  const sharedMutation = useSharedDeleteBookSaleMutation({
    onSuccess: () => {
      toast.success(t("delete_success"));
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
    },
    onError: (error: Error) => {
      handleMutationError(error, "판매글 삭제");
    },
  });

  return {
    ...sharedMutation,
    mutate: async ({
      saleId,
      imageUrls,
    }: {
      saleId: number;
      imageUrls: string[];
    }) => {
      if (imageUrls.length > 0) {
        await deleteImages(imageUrls);
      }
      return sharedMutation.mutate(saleId, {
        onSuccess: async () => {
          await purgeRouteCache(
            revalidateBookSale({ saleId, deleted: true }),
            () => router.refresh(),
          );
          if (
            typeof window !== "undefined" &&
            window.location.pathname.includes(PATHS.BOOK_SALES_DETAIL(saleId))
          ) {
            router.push(PATHS.MY_PAGE_SALES);
          }
        },
      });
    },
    mutateAsync: async ({
      saleId,
      imageUrls,
    }: {
      saleId: number;
      imageUrls: string[];
    }) => {
      if (imageUrls.length > 0) {
        await deleteImages(imageUrls);
      }
      return sharedMutation.mutateAsync(saleId).then(async (res: void) => {
        await purgeRouteCache(
          revalidateBookSale({ saleId, deleted: true }),
          () => router.refresh(),
        );
        if (
          typeof window !== "undefined" &&
          window.location.pathname.includes(PATHS.BOOK_SALES_DETAIL(saleId))
        ) {
          router.push(PATHS.MY_PAGE_SALES);
        }
        return res;
      });
    },
  };
};
