/**
 * 이미지 압축 유틸리티
 * Canvas API를 사용하여 클라이언트 사이드에서 이미지를 압축합니다.
 */

export interface CompressImageOptions {
  /** 최대 너비/높이 (기본값: 1200) */
  maxSize?: number;
  /** JPEG 품질 0-1 (기본값: 0.8) */
  quality?: number;
  /** 출력 타입 (기본값: image/jpeg) */
  type?: "image/jpeg" | "image/webp";
}

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  maxSize: 1200,
  quality: 0.8,
  type: "image/jpeg",
};

/**
 * 이미지 파일을 압축합니다.
 * @param file - 압축할 이미지 파일
 * @param options - 압축 옵션
 * @returns 압축된 이미지 File 객체
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const { maxSize, quality, type } = { ...DEFAULT_OPTIONS, ...options };

  // 이미지가 아니면 원본 반환
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context를 생성할 수 없습니다."));
      return;
    }

    img.onload = () => {
      // 원본 크기가 maxSize보다 작으면 리사이즈 불필요
      let { width, height } = img;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 흰색 배경 (투명 PNG 대응)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("이미지 압축에 실패했습니다."));
            return;
          }

          // 새 파일명 생성 (확장자 변경)
          const extension = type === "image/webp" ? ".webp" : ".jpg";
          const newFileName = file.name.replace(/\.[^/.]+$/, "") + extension;

          const compressedFile = new File([blob], newFileName, { type });

          // 압축 후 오히려 커지면 원본 반환 (이미 최적화된 이미지)
          if (compressedFile.size >= file.size) {
            resolve(file);
            return;
          }

          resolve(compressedFile);
        },
        type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("이미지를 로드할 수 없습니다."));
    };

    // 파일을 Data URL로 읽기
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("파일을 읽을 수 없습니다."));
    };
    reader.readAsDataURL(file);
  });
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
