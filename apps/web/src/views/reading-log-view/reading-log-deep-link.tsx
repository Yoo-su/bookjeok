"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  parseReadingLogLink,
  type ReadingLogLink,
} from "@/features/reading-log/utils/reading-log-link";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

/** 주소의 딥링크를 한 번 적용하고 지움. 새로고침·뒤로가기로 상세가 다시 뜨지 않게 */
export function ReadingLogDeepLink({
  onApply,
}: {
  onApply: (link: ReadingLogLink) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const link = parseReadingLogLink(new URLSearchParams(searchParams));
    if (!link) return;
    onApply(link);
    router.replace(PATHS.READING_LOG, { scroll: false });
  }, [searchParams, onApply, router]);

  return null;
}
