import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import { useEditorImageHandler } from "../use-editor-image-handler";

// 외부 의존성(라이브러리 등) 모킹
vi.mock("@vercel/blob/client", () => ({
  upload: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const { createIntlMock } = await import("@/__tests__/helpers/intl");
  return createIntlMock();
});

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/shared/utils/compress-image", () => ({
  compressImage: vi.fn((file) => Promise.resolve(file)), // 압축 로직 생략
  validateImageForUpload: vi.fn(() => null), // 항상 검증 통과되도록 모킹
}));

// 브라우저 URL 메서드 모킹
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe("useEditorImageHandler", () => {
  let mockUploadPath: (file: File) => string;

  beforeEach(() => {
    vi.clearAllMocks();

    // 업로드 경로 함수 모킹 셋업
    mockUploadPath = vi.fn((file) => `uploads/${file.name}`);

    // URL.createObjectURL 기본 동작 모킹
    let objUrlCounter = 0;
    mockCreateObjectURL.mockImplementation(
      () => `blob:test-url-${++objUrlCounter}`,
    );

    // 인증 스토어 상태 초기화
    useAuthStore.setState({ accessToken: "test-token" });
  });

  describe("handleImageAdd", () => {
    it("정상적인 이미지일 경우 validation 에러 없이 URL로 매핑되어 반환되어야 한다", () => {
      const { result } = renderHook(() =>
        useEditorImageHandler({ uploadPath: mockUploadPath }),
      );

      const file = new File(["test"], "test.png", { type: "image/png" });

      let returnedUrl;
      act(() => {
        returnedUrl = result.current.handleImageAdd(file);
      });

      expect(returnedUrl).toBe("blob:test-url-1");
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
    });

    it("이미지 검증 실패 시, toast.error를 호출하고 null을 반환해야 한다", async () => {
      // 오버라이드 validateImageForUpload mock for this test
      const { validateImageForUpload } = await import(
        "@/shared/utils/compress-image"
      );
      vi.mocked(validateImageForUpload).mockReturnValueOnce(
        "용량 초과 에러 메시지",
      );

      const { result } = renderHook(() =>
        useEditorImageHandler({ uploadPath: mockUploadPath }),
      );

      const file = new File(["test-big"], "big.png", { type: "image/png" });

      let returnedUrl;
      act(() => {
        returnedUrl = result.current.handleImageAdd(file);
      });

      expect(returnedUrl).toBeNull();
      const { toast } = await import("sonner");
      expect(toast.error).toHaveBeenCalledWith("용량 초과 에러 메시지");
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });
  });

  describe("uploadImages", () => {
    it("업로드할 이미지가 없어도 content와 삭제된 목록을 정상적으로 반환해야 한다", async () => {
      const { result } = renderHook(() =>
        useEditorImageHandler({
          uploadPath: mockUploadPath,
          initialContent: '<img src="https://old.url" />',
        }),
      );

      let uploadResult:
        | { content: string; deletedImageUrls: string[] }
        | undefined;
      await act(async () => {
        uploadResult =
          await result.current.uploadImages("새로운 컨텐츠 (이미지 없음)");
      });

      expect(uploadResult?.content).toBe("새로운 컨텐츠 (이미지 없음)");
      expect(uploadResult?.deletedImageUrls).toEqual(["https://old.url"]);
    });

    it("handleImageAdd를 통해 추가된 이미지가 컨텐츠에 포함될 경우 Vercel Blob에 업로드하고 URL을 교체해야 한다", async () => {
      const { upload } = await import("@vercel/blob/client");

      // 업로드 응답 데이터 조작
      vi.mocked(upload).mockResolvedValueOnce({
        url: "https://vercel.blob/test.png",
        downloadUrl: "",
        pathname: "",
        contentType: "",
        contentDisposition: "",
      });

      const { result } = renderHook(() =>
        useEditorImageHandler({ uploadPath: mockUploadPath }),
      );

      const file = new File(["test"], "test.png", { type: "image/png" });

      let blobUrl: string | null = null;
      act(() => {
        blobUrl = result.current.handleImageAdd(file);
      });

      expect(blobUrl).toBe("blob:test-url-1");

      const contentHtml = `<p>Test content <img src="${blobUrl}" /></p>`;

      let uploadResult:
        | { content: string; deletedImageUrls: string[] }
        | undefined;
      await act(async () => {
        uploadResult = await result.current.uploadImages(contentHtml);
      });

      expect(upload).toHaveBeenCalledTimes(1);
      expect(uploadResult?.content).toBe(
        `<p>Test content <img src="https://vercel.blob/test.png" /></p>`,
      );
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(blobUrl);
    });

    it("업로드 실패 시 예외를 던지고 isUploading 상태가 다시 false가 되어야 한다", async () => {
      const { upload } = await import("@vercel/blob/client");
      vi.mocked(upload).mockRejectedValueOnce(new Error("Upload failed"));

      // 의도된 에러 로깅이 터미널(stderr)에 찍히지 않도록 모킹
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() =>
        useEditorImageHandler({ uploadPath: mockUploadPath }),
      );

      const file = new File(["test"], "test.png", { type: "image/png" });

      act(() => {
        result.current.handleImageAdd(file);
      });

      const contentHtml = `<p><img src="blob:test-url-1" /></p>`;

      let uploadPromise: Promise<{
        content: string;
        deletedImageUrls: string[];
      }>;
      act(() => {
        uploadPromise = result.current.uploadImages(contentHtml);
      });

      expect(result.current.isUploading).toBe(true);

      await act(async () => {
        try {
          await uploadPromise;
        } catch (e) {
          expect((e as Error).message).toBe("Upload failed");
        }
      });

      expect(result.current.isUploading).toBe(false);

      // 테스트 후 모킹 해제
      consoleErrorSpy.mockRestore();
    });
  });
});
