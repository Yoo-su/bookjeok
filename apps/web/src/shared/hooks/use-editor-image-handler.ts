import { upload } from "@vercel/blob/client";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  compressImage,
  validateImageForUpload,
} from "@/shared/utils/compress-image";

interface UseEditorImageHandlerOptions {
  uploadPath: (file: File) => string;
}

/**
 * 에디터에 넣은 이미지를 저장 시점에 업로드하고 본문의 임시 URL을 교체합니다.
 * 본문에서 빠진 기존 이미지는 서버가 저장을 커밋한 뒤 지우므로 여기서 다루지 않습니다.
 */
export const useEditorImageHandler = ({
  uploadPath,
}: UseEditorImageHandlerOptions) => {
  const t = useTranslations("common");
  const [isUploading, setIsUploading] = useState(false);
  const imageMapRef = useRef<Map<string, File>>(new Map());

  const handleImageAdd = (file: File) => {
    // 이미지 용량 검증 (10MB 제한)
    const validationError = validateImageForUpload(file, {
      onlyImage: t("image.only_image_allowed"),
      sizeLimitExceeded: (sizeMB, maxSizeMB) =>
        t("image.size_limit_exceeded", { size: sizeMB, maxSize: maxSizeMB }),
    });
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    const url = URL.createObjectURL(file);
    imageMapRef.current.set(url, file);
    return url;
  };

  const uploadImages = async (content: string) => {
    setIsUploading(true);
    const accessToken = useAuthStore.getState().accessToken;

    try {
      let newContent = content;
      const imagesToUpload: File[] = [];
      const placeholderUrls: string[] = [];

      // 업로드가 필요한 콘텐츠 내 모든 이미지 찾기
      imageMapRef.current.forEach((file, url) => {
        if (newContent.includes(url)) {
          imagesToUpload.push(file);
          placeholderUrls.push(url);
        }
      });

      if (imagesToUpload.length > 0) {
        // @vercel/blob/client를 사용한 클라이언트 측 업로드
        const blobs = await Promise.all(
          imagesToUpload.map(async (file) => {
            // 이미지 압축 후 업로드 (압축 시 UUID 파일명 자동 생성)
            const compressedFile = await compressImage(file);
            return upload(uploadPath(compressedFile), compressedFile, {
              access: "public",
              handleUploadUrl: "/api/upload",
              clientPayload: JSON.stringify({
                token: accessToken,
              }),
            });
          }),
        );

        // blob URL을 실제 Vercel Blob URL로 교체
        blobs.forEach((blob, index) => {
          newContent = newContent.replace(placeholderUrls[index], blob.url);
        });
      }

      // object URL 정리
      imageMapRef.current.forEach((_, url) => URL.revokeObjectURL(url));
      imageMapRef.current.clear();

      return { content: newContent };
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    handleImageAdd,
    uploadImages,
    isUploading,
  };
};
