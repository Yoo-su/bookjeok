/**
 * Vercel Blob 업로드 시 파일명 충돌을 방지하기 위해
 * UUID 기반의 고유한 파일명을 생성합니다.
 */

/**
 * 파일 확장자를 추출합니다.
 * @param filename - 원본 파일명
 * @returns 소문자로 변환된 확장자 (점 포함)
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

/**
 * UUID 기반의 고유한 파일명을 생성합니다.
 * 형식: {timestamp}-{uuid}.{extension}
 *
 * @param originalFilename - 원본 파일명 (확장자 추출용)
 * @param overrideExtension - 확장자를 강제로 변경할 경우 (예: 압축 후 .jpg)
 * @returns 고유한 파일명
 */
export function generateUniqueFilename(
  originalFilename: string,
  overrideExtension?: string
): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const extension = overrideExtension || getFileExtension(originalFilename);

  return `${timestamp}-${uuid}${extension}`;
}
