/**
 * 이미지 압축 유틸리티
 * browser-image-compression 라이브러리를 사용하여 클라이언트 사이드에서 이미지를 압축합니다.
 */

import imageCompression from "browser-image-compression";

import { generateUniqueFilename } from "./generate-unique-filename";

// 첨부 시점 용량 제한 (10MB)
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

// 압축 목표 용량 (500KB) - Next.js Image가 추가 최적화하므로 충분
const TARGET_SIZE_MB = 0.5;

// 압축 최대 해상도 (긴 쪽 기준)
const MAX_WIDTH_OR_HEIGHT = 1920;

export interface CompressImageOptions {
  /** 목표 용량 MB (기본값: 0.5MB = 500KB) */
  maxSizeMB?: number;
  /** 최대 너비/높이 (기본값: 1920) */
  maxWidthOrHeight?: number;
  /** 웹 워커 사용 여부 (기본값: true, 메인 스레드 블로킹 방지) */
  useWebWorker?: boolean;
}

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  maxSizeMB: TARGET_SIZE_MB,
  maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
  useWebWorker: true,
};

/**
 * 이미지 파일을 첨부할 수 있는지 검증합니다.
 * @param file - 검증할 이미지 파일
 * @returns 에러 메시지 (유효하면 null)
 */
export function validateImageForUpload(file: File): string | null {
  // 이미지 타입 검증
  if (!file.type.startsWith("image/")) {
    return "이미지 파일만 업로드할 수 있습니다.";
  }

  // 용량 검증 (10MB)
  if (file.size > MAX_UPLOAD_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `이미지 크기가 너무 큽니다 (${sizeMB}MB). 10MB 이하의 이미지만 첨부할 수 있습니다.`;
  }

  return null;
}

/**
 * 이미지 파일을 압축합니다.
 * browser-image-compression 라이브러리를 사용하여 목표 용량까지 자동으로 최적화합니다.
 * UUID 기반 파일명을 생성하여 충돌을 방지합니다.
 *
 * @param file - 압축할 이미지 파일
 * @param options - 압축 옵션
 * @returns 압축된 이미지 File 객체 (UUID 파일명 적용)
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const { maxSizeMB, maxWidthOrHeight, useWebWorker } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // 이미지가 아니면 파일명만 UUID로 변경하여 반환
  if (!file.type.startsWith("image/")) {
    const extension = file.name.slice(file.name.lastIndexOf("."));
    const newFilename = generateUniqueFilename(file.name, extension);
    return new File([file], newFilename, { type: file.type });
  }

  try {
    // browser-image-compression으로 압축
    const compressedBlob = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      // EXIF 회전 정보 자동 처리
      // JPEG 출력 (WebP보다 호환성 좋음)
      fileType: "image/jpeg",
    });

    // UUID 기반 파일명 생성
    const newFilename = generateUniqueFilename(file.name, ".jpg");

    // Blob을 File로 변환
    const compressedFile = new File([compressedBlob], newFilename, {
      type: "image/jpeg",
    });

    return compressedFile;
  } catch (error) {
    console.error("이미지 압축 실패:", error);
    // 압축 실패 시 원본 파일에 UUID 파일명만 적용하여 반환
    const extension = file.name.slice(file.name.lastIndexOf("."));
    const newFilename = generateUniqueFilename(file.name, extension);
    return new File([file], newFilename, { type: file.type });
  }
}

/**
 * 여러 이미지 파일을 한번에 압축합니다.
 */
export async function compressImages(
  files: File[],
  options: CompressImageOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}
