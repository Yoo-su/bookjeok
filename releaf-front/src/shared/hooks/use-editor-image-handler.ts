import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

interface UseEditorImageHandlerOptions {
  uploadPath: (file: File) => string;
}

export const useEditorImageHandler = ({
  uploadPath,
}: UseEditorImageHandlerOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const imageMapRef = useRef<Map<string, File>>(new Map());

  const handleImageAdd = (file: File) => {
    const url = URL.createObjectURL(file);
    imageMapRef.current.set(url, file);
    return url;
  };

  const uploadImages = async (content: string) => {
    setIsUploading(true);
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
          imagesToUpload.map((file) => {
            return upload(uploadPath(file), file, {
              access: "public",
              handleUploadUrl: "/api/upload",
            });
          })
        );

        // blob URL을 실제 Vercel Blob URL로 교체
        blobs.forEach((blob, index) => {
          newContent = newContent.replace(placeholderUrls[index], blob.url);
        });
      }

      // object URL 정리
      imageMapRef.current.forEach((_, url) => URL.revokeObjectURL(url));
      imageMapRef.current.clear();

      return newContent;
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
