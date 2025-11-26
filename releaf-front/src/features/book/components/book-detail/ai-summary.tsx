import { AlertTriangle,BotMessageSquare, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";

interface BookSummaryProps {
  summary?: string;
  isLoading: boolean;
  isError: boolean;
}

export const AISummary = ({
  summary,
  isLoading,
  isError,
}: BookSummaryProps) => {
  return (
    <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <BotMessageSquare className="w-6 h-6 text-emerald-600" />
        <CardTitle className="text-xl font-bold text-gray-800">
          AI 서재 비서
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI가 책을 분석하고 있어요...</span>
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span>요약 정보를 불러오는 데 실패했습니다.</span>
          </div>
        )}
        {summary && (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
