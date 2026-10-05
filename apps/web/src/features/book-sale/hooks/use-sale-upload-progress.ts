import { useCallback, useState } from "react";

import { UploadStep } from "../components/common/upload-progress-modal";

type ProgressStep = "compressing" | "uploading" | "submitting";
type ReportProgress = (step: ProgressStep, percent: number) => void;

/**
 * 판매글 등록·수정의 진행 모달 상태(인증 확인 → 압축 → 업로드 → 저장)를 관리합니다.
 * 뮤테이션의 `isPending`은 저장 API 구간만 뜻하므로 버튼 잠금에는 `isModalOpen`을 함께 씁니다.
 */
export const useSaleUploadProgress = () => {
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** 작업을 진행 모달과 함께 실행합니다. 실패하면 모달을 닫고 처음 상태로 돌립니다. */
  const trackUpload = useCallback(
    async (task: (reportProgress: ReportProgress) => Promise<unknown>) => {
      setIsModalOpen(true);
      setUploadStep("compressing");
      setUploadProgress(10);

      try {
        await task((step, percent) => {
          setUploadStep(step);
          setUploadProgress(percent);
        });
        setUploadStep("success");
        setUploadProgress(100);
      } catch {
        // 실패 안내는 뮤테이션이 토스트로 처리
        setIsModalOpen(false);
        setUploadStep("idle");
        setUploadProgress(0);
      }
    },
    [],
  );

  return { uploadStep, uploadProgress, isModalOpen, trackUpload };
};
