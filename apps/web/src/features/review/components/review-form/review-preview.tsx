"use client";

import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/shadcn/dialog";

import { ReviewDetailContent } from "../review-detail/book-review-detail/content";

export function ReviewPreview({ content }: { content: string }) {
  const t = useTranslations("common.editor");
  const reduced = useReducedMotion();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {t("preview")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto bg-white p-5 sm:p-8"
        initial={reduced ? false : undefined}
        transition={reduced ? { duration: 0 } : undefined}
      >
        <DialogHeader className="pr-8">
          <DialogTitle>{t("preview")}</DialogTitle>
          <DialogDescription>{t("preview_description")}</DialogDescription>
        </DialogHeader>
        <ReviewDetailContent content={content} preview />
      </DialogContent>
    </Dialog>
  );
}
