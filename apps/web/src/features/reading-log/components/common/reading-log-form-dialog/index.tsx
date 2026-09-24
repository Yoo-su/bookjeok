"use client";

import { MAX_MEMO_LENGTH } from "@bookjeok/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CoolMode } from "@/shared/components/magicui/cool-mode";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import { Textarea } from "@/shared/components/shadcn/textarea";

export interface ReadingLogFormValues {
  memo: string;
  date: string; // YYYY-MM-DD
}

interface ReadingLogFormDialogProps {
  book: {
    title: string;
    author: string;
    image: string;
  } | null;
  initialMemo?: string;
  initialDate: string;
  mode: "create" | "edit";
  open: boolean;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ReadingLogFormValues) => void;
}

export function ReadingLogFormDialog({
  book,
  initialMemo = "",
  initialDate,
  mode,
  open,
  isPending = false,
  onOpenChange,
  onSubmit,
}: ReadingLogFormDialogProps) {
  const t = useTranslations("reading_log.form_modal");

  // 로컬 기준 오늘. 미래 날짜 기록을 막는다.
  const today = format(new Date(), "yyyy-MM-dd");

  const formSchema = z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: t("error_date_required") })
      .refine((value) => value <= today, { message: t("error_date_future") }),
    memo: z.string().max(MAX_MEMO_LENGTH, {
      message: t("error_max_length", { max: MAX_MEMO_LENGTH }),
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memo: initialMemo,
      date: initialDate,
    },
  });

  // 새로 열었을 때 초기화
  useEffect(() => {
    if (open) {
      form.reset({ memo: initialMemo, date: initialDate });
    }
  }, [open, initialMemo, initialDate, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    if (mode === "create") form.reset();
  };

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center font-serif text-stone-900">
            {mode === "create" ? t("title_create") : t("title_edit")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 p-4 bg-stone-50 rounded-2xl mb-2 items-center border border-stone-100/50">
          <div className="relative w-14 h-20 shrink-0 rounded-md overflow-hidden shadow-sm border border-stone-200">
            <Image
              src={book.image}
              alt={book.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-stone-800 line-clamp-1 font-serif tracking-tight">
              {book.title}
            </h4>
            <p className="text-sm text-stone-500 line-clamp-1">{book.author}</p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-stone-600 font-medium">
                    {t("label_date")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      max={today}
                      className="h-11 border-stone-200 text-base md:text-sm focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-stone-400"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-stone-600 font-medium">
                    {t("label_memo")}{" "}
                    <span className="text-xs text-stone-400 font-normal">
                      {t("label_optional")}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("placeholder_memo")}
                      className="resize-none h-24 focus-visible:ring-1 focus-visible:ring-offset-0 disabled:opacity-50 focus-visible:ring-stone-400 border-stone-200"
                      maxLength={MAX_MEMO_LENGTH}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-right text-xs text-stone-400">
                    {field.value.length} / {MAX_MEMO_LENGTH}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto h-11 border-stone-200 text-stone-600 hover:bg-stone-50"
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <CoolMode>
                <Button
                  type="submit"
                  className="w-full sm:w-auto h-11 font-bold text-white hover:opacity-90 transition-opacity shadow-sm bg-stone-900 hover:bg-stone-800"
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t("processing")}</span>
                    </div>
                  ) : mode === "create" ? (
                    t("submit_create")
                  ) : (
                    t("submit_edit")
                  )}
                </Button>
              </CoolMode>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
