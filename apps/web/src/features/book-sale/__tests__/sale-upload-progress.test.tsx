import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSaleUploadProgress } from "@/features/book-sale/hooks/use-sale-upload-progress";

describe("useSaleUploadProgress", () => {
  it("reports each step and ends at success with the modal open", async () => {
    const { result } = renderHook(() => useSaleUploadProgress());

    await act(() =>
      result.current.trackUpload(async (report) => {
        report("uploading", 50);
        report("submitting", 90);
      }),
    );

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.uploadStep).toBe("success");
    expect(result.current.uploadProgress).toBe(100);
  });

  it("closes the modal and resets when the task fails", async () => {
    const { result } = renderHook(() => useSaleUploadProgress());

    await act(() =>
      result.current.trackUpload(async (report) => {
        report("uploading", 40);
        throw new Error("업로드 실패");
      }),
    );

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.uploadStep).toBe("idle");
    expect(result.current.uploadProgress).toBe(0);
  });
});
