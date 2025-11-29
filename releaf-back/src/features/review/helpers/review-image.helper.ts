import { Injectable, Logger } from '@nestjs/common';
import { del } from '@vercel/blob';

@Injectable()
export class ReviewImageHelper {
  private readonly logger = new Logger(ReviewImageHelper.name);

  /**
   * Extracts all image URLs from the HTML content.
   * @param content HTML content
   * @returns Array of image URLs
   */
  extractImageUrls(content: string): string[] {
    const regex = /<img[^>]+src="([^">]+)"/g;
    const matches = [...content.matchAll(regex)];
    return matches.map((match) => match[1]);
  }

  /**
   * Deletes images from Vercel Blob storage.
   * @param urls Array of image URLs to delete
   */
  async deleteImages(urls: string[]): Promise<void> {
    if (!urls.length) return;

    try {
      // Filter only Vercel Blob URLs to avoid trying to delete external images
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
      // We don't throw here to prevent blocking the main operation (e.g., review deletion)
    }
  }

  /**
   * Identifies images that were removed in the new content compared to the old content.
   * @param oldContent Old HTML content
   * @param newContent New HTML content
   * @returns Array of removed image URLs
   */
  getRemovedImages(oldContent: string, newContent: string): string[] {
    const oldImages = this.extractImageUrls(oldContent);
    const newImages = this.extractImageUrls(newContent);

    return oldImages.filter((url) => !newImages.includes(url));
  }
}
