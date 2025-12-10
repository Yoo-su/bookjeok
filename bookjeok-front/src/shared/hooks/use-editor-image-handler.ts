import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

interface UseEditorImageHandlerOptions {
  uploadPath: (file: File) => string;
  initialContent?: string;
}

export const useEditorImageHandler = ({
  uploadPath,
  initialContent = "",
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

      // 초기 콘텐츠에 있었지만 최종 콘텐츠에는 없는 이미지 URL 찾기 (삭제된 이미지)
      const extractImageUrls = (html: string) => {
        const regex = /<img[^>]+src="([^">]+)"/g;
        const urls: string[] = [];
        let match;
        while ((match = regex.exec(html)) !== null) {
          urls.push(match[1]);
        }
        return urls;
      };

      const initialUrls = extractImageUrls(initialContent);
      const finalUrls = extractImageUrls(newContent);
      const deletedImageUrls = initialUrls.filter(
        (url) => !finalUrls.includes(url)
      );

      return { content: newContent, deletedImageUrls };
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
