import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";

import type { CoverExt } from "./cover";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface CoverStore {
  /** 이 ISBN의 표지가 이미 있으면 그 키. 확장자가 둘 이상일 수 있어 전부 확인합니다. */
  existingKey(isbn: string): Promise<string | null>;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
}

const EXTS: CoverExt[] = ["webp", "jpg", "png", "gif"];

export const coverKey = (isbn: string, ext: CoverExt) =>
  `covers/${isbn}.${ext}`;

/**
 * 운영 표지와 같은 헤더입니다. 공개 URL이 `immutable`로 나가므로 **같은 키를
 * 덮어쓰면 캐시가 갱신되지 않습니다.** 그래서 이 도구는 기존 키를 덮어쓰지 않습니다.
 */
const CACHE_CONTROL = "public, max-age=31536000, immutable";

export function createR2Store(config: R2Config): CoverStore {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    async existingKey(isbn) {
      for (const ext of EXTS) {
        const key = coverKey(isbn, ext);
        try {
          await client.send(
            new HeadObjectCommand({ Bucket: config.bucket, Key: key }),
          );
          return key;
        } catch (error) {
          if (
            error instanceof S3ServiceException &&
            error.$metadata.httpStatusCode === 404
          ) {
            continue;
          }
          throw error;
        }
      }
      return null;
    },

    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: CACHE_CONTROL,
        }),
      );
    },
  };
}
