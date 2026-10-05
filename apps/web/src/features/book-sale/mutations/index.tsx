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
import { useRef } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { revalidateBookSale } from "@/shared/actions/revalidate";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { handleMutationError } from "@/shared/utils/error-handler";
import { purgeRouteCache } from "@/shared/utils/purge-route-cache";

import { deleteImages } from "../actions/delete-action";
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
 * 저장 요청 전 단계(인증 확인·압축·업로드)의 실패를 저장 실패와 같은 경로로 알립니다.
 * 이 단계는 공유 뮤테이션 밖이라 그 `onError`가 호출되지 않습니다.
 */
const prepareOrReport = async <T,>(
  prepare: () => Promise<T>,
  context: string,
): Promise<T> => {
  try {
    return await prepare();
  } catch (error) {
    handleMutationError(error, context);
    throw error;
  }
};

/**
 * 판매글에서 빠진 이미지를 스토리지에서 지웁니다.
 * 저장이 성공한 뒤에만 부릅니다. 먼저 지우면 저장이 실패했을 때 글은 남고 이미지만 사라집니다.
 * 실패해도 저장 결과에는 영향이 없어 에러를 삼킵니다.
 */
const removeSaleImages = async (urls: string[]) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (urls.length === 0 || !accessToken) return;

  try {
    const result = await deleteImages(urls, accessToken);
    if (!result.success) {
      console.error("판매글 이미지 삭제 실패:", result.error);
    }
  } catch (error) {
    console.error("판매글 이미지 삭제 실패:", error);
  }
};

/**
 * 중고책 판매글을 생성하는 뮤테이션 훅입니다.
 */
export const useCreateBookSaleMutation = () => {
  const t = useTranslations("market.toast");
  const router = useRouter();
  const queryClient = useQueryClient();

  const sharedMutation = useSharedCreateBookSaleMutation({
    // 재검증 대상이 없다. 방금 만든 id의 상세는 아직 ISR에 없어 비울 것이 없고,
    // 마켓·홈은 시간 기반에 위임한다(`shared/actions/revalidate.ts`의 범위 규칙).
    // 작성자 본인은 쿼리 무효화 + refetchOnMount로 목록에서 바로 확인한다.
    // 리뷰 생성(`features/review/mutations`)과 같은 규칙이다.
    onSuccess: () => {
      toast.success(t("create_success"));
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
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
      const { finalPayload, idempotencyKey } = await prepareOrReport(
        () => processCreate(variables),
        "판매글 등록",
      );
      return sharedMutation.mutate({
        ...finalPayload,
        idempotencyKey,
      } as CreateBookSaleParams & { idempotencyKey?: string });
    },
    mutateAsync: async (variables: CreateSaleVariables) => {
      const { finalPayload, idempotencyKey } = await prepareOrReport(
        () => processCreate(variables),
        "판매글 등록",
      );
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
      void purgeRouteCache(
        revalidateBookSale({
          saleId: data.id,
          accessToken: useAuthStore.getState().accessToken,
        }),
        () => router.refresh(),
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
      await purgeRouteCache(
        revalidateBookSale({
          saleId: data.id,
          accessToken: useAuthStore.getState().accessToken,
        }),
        () => router.refresh(),
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
    onProgressState,
  }: UpdateSaleVariables) => {
    onProgressState?.("compressing", 15);
    const { user, accessToken } = await ensureFreshAuthToken(
      t("login_required"),
    );

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
      const params = await prepareOrReport(
        () => processUpdate(variables),
        "판매글 수정",
      );
      // 실패는 공유 훅의 onError가 알린다. 여기서는 처리되지 않은 거부만 막는다
      await sharedMutation
        .mutateAsync(params)
        .then(() => removeSaleImages(variables.deletedImageUrls ?? []))
        .catch(() => undefined);
    },
    mutateAsync: async (variables: UpdateSaleVariables) => {
      const params = await prepareOrReport(
        () => processUpdate(variables),
        "판매글 수정",
      );
      const updated = await sharedMutation.mutateAsync(params);
      await removeSaleImages(variables.deletedImageUrls ?? []);
      return updated;
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
  // 삭제가 성공한 판매글의 이미지만 지운다. 훅 수준 콜백은 목록에서 항목이
  // 사라져 컴포넌트가 언마운트돼도 실행되므로 여기서 처리한다.
  const pendingImagesRef = useRef(new Map<number, string[]>());

  const sharedMutation = useSharedDeleteBookSaleMutation({
    onSuccess: (_data, saleId) => {
      toast.success(t("delete_success"));
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });

      const imageUrls = pendingImagesRef.current.get(saleId) ?? [];
      pendingImagesRef.current.delete(saleId);
      void removeSaleImages(imageUrls);
    },
    onError: (error: Error, saleId) => {
      pendingImagesRef.current.delete(saleId);
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
      pendingImagesRef.current.set(saleId, imageUrls);
      return sharedMutation.mutate(saleId, {
        onSuccess: async () => {
          await purgeRouteCache(
            revalidateBookSale({
              saleId,
              deleted: true,
              accessToken: useAuthStore.getState().accessToken,
            }),
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
      pendingImagesRef.current.set(saleId, imageUrls);
      return sharedMutation.mutateAsync(saleId).then(async (res: void) => {
        await purgeRouteCache(
          revalidateBookSale({
            saleId,
            deleted: true,
            accessToken: useAuthStore.getState().accessToken,
          }),
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
