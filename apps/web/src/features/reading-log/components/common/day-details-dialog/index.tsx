import { BookInfo, ReadingLog } from "@bookjeok/core";
import { useReadingLogsQuery } from "@bookjeok/react-query";
import { format } from "date-fns";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { BookSearchModal } from "@/features/book/components/common/book-search-modal";
import { useConfirm } from "@/features/confirm";
import {
  Calendar as CalendarIcon,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { ScrollArea } from "@/shared/components/shadcn/scroll-area";
import { useSafeSubmit } from "@/shared/hooks/use-safe-submit";
import { formatDate } from "@/shared/utils/format-date";

import {
  useCreateReadingLogMutation,
  useDeleteReadingLogMutation,
  useUpdateReadingLogMutation,
} from "../../../mutations";
import {
  ReadingLogFormDialog,
  ReadingLogFormValues,
} from "../reading-log-form-dialog";

interface DayDetailsDialogProps {
  date: Date | null;
  logs: ReadingLog[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

export function DayDetailsDialog({
  date,
  logs: initialLogs = [],
  open,
  onOpenChange,
  readOnly = false,
}: DayDetailsDialogProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("reading_log.details_dialog");
  const tLog = useTranslations("reading_log");
  const tCommon = useTranslations("common");

  // 생성 모드 상태
  const [selectedBookForCreate, setSelectedBookForCreate] =
    useState<BookInfo | null>(null);

  // 수정 모드 상태
  const [editingLog, setEditingLog] = useState<ReadingLog | null>(null);

  const createMutation = useCreateReadingLogMutation();
  const deleteMutation = useDeleteReadingLogMutation();
  const updateMutation = useUpdateReadingLogMutation();
  const { executeSafeSubmit } = useSafeSubmit();

  // readOnly가 아닐 때는 TanStack Query로부터 해당 월의 실시간 기록 목록을 직접 구독
  const { data: monthlyLogs = [] } = useReadingLogsQuery(
    date ? { year: date.getFullYear(), month: date.getMonth() + 1 } : undefined,
    { enabled: !readOnly && !!date },
  );

  // 현재 날짜의 로그 필터링
  const currentLogs = readOnly
    ? initialLogs
    : monthlyLogs.filter(
        (log) => log.date === (date ? format(date, "yyyy-MM-dd") : ""),
      );

  if (!date) return null;

  const handleBookSelect = (book: BookInfo) => {
    // 해당 날짜에 이미 추가된 책인지 확인
    const exists = currentLogs.some((log) => log.isbn === book.isbn);
    if (exists) {
      toast.error(tLog("toast.already_added"));
      return;
    }

    setSelectedBookForCreate(book);
  };

  const handleCreateLog = ({ memo, date: logDate }: ReadingLogFormValues) => {
    if (!selectedBookForCreate) return;

    executeSafeSubmit(async (idempotencyKey) => {
      await createMutation.mutateAsync(
        {
          isbn: selectedBookForCreate.isbn,
          date: logDate,
          memo,
          idempotencyKey,
        },
        {
          onSuccess: () => {
            setSelectedBookForCreate(null);
          },
        },
      );
    }).catch(() => {
      // 실패 안내는 뮤테이션 onError가 띄운다. 폼은 열어 둔다.
    });
  };

  const handleEditClick = (log: ReadingLog) => {
    setEditingLog(log);
  };

  const handleUpdateLog = ({ memo, date: logDate }: ReadingLogFormValues) => {
    if (!editingLog) return;

    updateMutation.mutate(
      {
        id: editingLog.id,
        memo,
        date: logDate,
      },
      {
        onSuccess: () => {
          setEditingLog(null);
        },
      },
    );
  };

  const confirm = useConfirm();

  const handleRemoveLog = async (log: ReadingLog) => {
    const isConfirmed = await confirm({
      title: tLog("dialog.delete_title"),
      description: tLog("dialog.delete_desc"),
      confirmText: tCommon("actions.delete"),
      variant: "destructive",
    });

    if (isConfirmed) {
      deleteMutation.mutate({ id: log.id, date: log.date });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold font-serif tracking-tight text-stone-900">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl shadow-sm bg-stone-100 text-stone-600">
                <CalendarIcon className="w-5 h-5" />
              </span>
              {formatDate(date, locale, "monthDayWeekday")}
            </DialogTitle>
            <DialogDescription className="text-stone-500">
              {readOnly ? t("desc_read") : t("desc_write")}
            </DialogDescription>
          </DialogHeader>

          {!readOnly && (
            <div className="mt-4 mb-2">
              <BookSearchModal
                open={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                onSelect={handleBookSelect}
                trigger={
                  <Button
                    variant="outline"
                    className="w-full justify-center h-12 border-dashed transition-all hover:bg-stone-50 hover:border-stone-300 border-stone-200 text-stone-500 bg-white"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {tLog("dialog.record_new")}
                  </Button>
                }
              />
            </div>
          )}

          <ScrollArea className="max-h-[60vh] mt-2 -mx-6 px-6">
            {currentLogs.length === 0 ? (
              <div className="py-12 text-center text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 text-sm mx-1">
                <p>{readOnly ? t("empty_read") : t("empty_write")}</p>
                {!readOnly && <p className="mt-1">{t("empty_write_sub")}</p>}
              </div>
            ) : (
              <div className="space-y-4 p-1">
                {currentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="group relative flex gap-4 p-4 border border-stone-100 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-stone-200 transition-all hover:-translate-y-0.5"
                  >
                    <div className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden shadow-md bg-stone-100 ring-1 ring-black/5">
                      <Image
                        src={log.book.image}
                        alt={log.book.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-stone-800 line-clamp-1 text-base font-serif tracking-tight">
                            {log.book.title}
                          </h4>
                          <p className="text-xs text-stone-500 font-medium mt-0.5">
                            {log.book.author}
                          </p>
                        </div>
                        {!readOnly && (
                          <div className="flex items-center -mt-1 -mr-1 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 pointer-fine:h-8 pointer-fine:w-8 text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
                              onClick={() => handleEditClick(log)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 pointer-fine:h-8 pointer-fine:w-8 text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                              onClick={() => handleRemoveLog(log)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {log.memo && (
                        <div className="mt-auto pt-3 border-t border-stone-50">
                          <div className="flex items-start gap-2.5">
                            <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0 text-stone-400" />
                            {/* 전체 메모 표시 (line-clamp 제거) */}
                            <p className="text-sm text-stone-600 leading-relaxed break-all font-medium">
                              {log.memo}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 새 기록 생성 다이얼로그 */}
      <ReadingLogFormDialog
        mode="create"
        book={selectedBookForCreate}
        initialDate={format(date, "yyyy-MM-dd")}
        open={!!selectedBookForCreate}
        isPending={createMutation.isPending}
        onOpenChange={(open) => !open && setSelectedBookForCreate(null)}
        onSubmit={handleCreateLog}
      />

      {/* 기록 수정 다이얼로그 */}
      <ReadingLogFormDialog
        mode="edit"
        book={
          editingLog
            ? {
                title: editingLog.book.title,
                author: editingLog.book.author,
                image: editingLog.book.image,
              }
            : null
        }
        initialMemo={editingLog?.memo}
        initialDate={editingLog?.date ?? format(date, "yyyy-MM-dd")}
        open={!!editingLog}
        isPending={updateMutation.isPending}
        onOpenChange={(open) => !open && setEditingLog(null)}
        onSubmit={handleUpdateLog}
      />
    </>
  );
}
