import { Injectable, Logger } from '@nestjs/common';
import { del } from '@vercel/blob';

@Injectable()
export class ReviewImageHelper {
  private readonly logger = new Logger(ReviewImageHelper.name);

  /**
   * HTML 콘텐츠에서 모든 이미지 URL을 추출합니다.
   * @param content HTML 콘텐츠
   * @returns 이미지 URL 배열
   */
  extractImageUrls(content: string): string[] {
    const regex = /<img[^>]+src="([^">]+)"/g;
    const matches = [...content.matchAll(regex)];
    return matches.map((match) => match[1]);
  }

  /**
   * Vercel Blob 스토리지에서 이미지를 삭제합니다.
   * @param urls 삭제할 이미지 URL 배열
   */
  async deleteImages(urls: string[]): Promise<void> {
    if (!urls.length) return;

    try {
      // 외부 이미지를 삭제하려는 시도를 방지하기 위해 Vercel Blob URL만 필터링합니다.
      const blobUrls = urls.filter((url) =>
        url.includes('public.blob.vercel-storage.com'),
      );

      if (blobUrls.length > 0) {
        this.logger.log(`Deleting ${blobUrls.length} images from storage...`);
        await del(blobUrls);
        this.logger.log('Images deleted successfully.');
      }
    } catch (error) {
      this.logger.error('Failed to delete images from storage', error);
      // 메인 작업(예: 리뷰 삭제)을 차단하지 않기 위해 여기서 에러를 던지지 않습니다.
    }
  }

  /**
   * 이전 콘텐츠와 비교하여 새 콘텐츠에서 제거된 이미지를 식별합니다.
   * @param oldContent 이전 HTML 콘텐츠
   * @param newContent 새 HTML 콘텐츠
   * @returns 제거된 이미지 URL 배열
   */
  getRemovedImages(oldContent: string, newContent: string): string[] {
    const oldImages = this.extractImageUrls(oldContent);
    const newImages = this.extractImageUrls(newContent);

    return oldImages.filter((url) => !newImages.includes(url));
  }
}
