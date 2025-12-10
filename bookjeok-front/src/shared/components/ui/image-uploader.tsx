"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef } from "react";

import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils/cn";

interface ImageUploaderProps {
  /**
   * 현재 이미지 미리보기 URL 목록 (새로 추가된 이미지)
   */
  previews: string[];
  /**
   * 기존 이미지 URL 목록 (수정 모드용)
   */
  existingImages?: string[];
  /**
   * 이미지가 추가될 때 호출되는 콜백
   */
  onImagesAdd: (files: FileList) => void;
  /**
   * 새 이미지가 삭제될 때 호출되는 콜백
   */
  onImageRemove: (index: number) => void;
  /**
   * 기존 이미지가 삭제될 때 호출되는 콜백
   */
  onExistingImageRemove?: (url: string) => void;
  /**
   * 최대 허용 이미지 개수
   * @default 5
   */
  maxFiles?: number;
  className?: string;
}

export const ImageUploader = ({
  previews,
  existingImages = [],
  onImagesAdd,
  onImageRemove,
  onExistingImageRemove,
  maxFiles = 5,
  className,
}: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const totalImages = previews.length + existingImages.length;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImagesAdd(e.target.files);
    }
    // 필요한 경우 동일한 파일을 다시 선택할 수 있도록 입력 값을 초기화합니다.
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {/* Existing Images */}
      {existingImages.map((url, index) => (
        <div key={url} className="relative group">
          <Image
            src={url}
            alt={`Existing ${index}`}
            width={96}
            height={96}
            className="object-cover w-24 h-24 rounded-lg shadow-sm border border-gray-200"
          />
          {onExistingImageRemove && (
            <button
              type="button"
              onClick={() => onExistingImageRemove(url)}
              aria-label={`기존 이미지 삭제`}
              className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {/* New Image Previews */}
      {previews.map((src, index) => (
        <div key={src} className="relative group">
          <Image
            src={src}
            alt={`Preview ${index}`}
            width={96}
            height={96}
            className="object-cover w-24 h-24 rounded-lg shadow-sm border border-gray-200"
          />
          <button
            type="button"
            onClick={() => onImageRemove(index)}
            aria-label={`이미지 ${index + 1} 삭제`}
            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {totalImages < maxFiles && (
        <>
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            <ImagePlus className="w-8 h-8 text-gray-400 mb-1" />
            <span className="text-xs text-gray-500 font-medium">
              이미지 추가
            </span>
          </label>
          <Input
            id="image-upload"
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
        </>
      )}
    </div>
  );
};
