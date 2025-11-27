import {
  AlertTriangle,
  BotMessageSquare,
  CheckCircle2,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";

import { Badge } from "@/shared/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import { Separator } from "@/shared/components/shadcn/separator";

interface AIResponse {
  summary: string;
  keyPoints: string[];
  targetAudience: string;
  keywords: string[];
}

interface BookSummaryProps {
  summary?: AIResponse;
  isLoading: boolean;
  isError: boolean;
}

export const AISummary = ({
  summary,
  isLoading,
  isError,
}: BookSummaryProps) => {
  return (
    <Card className="bg-linear-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="p-2 bg-emerald-100 rounded-full">
          <BotMessageSquare className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <CardTitle className="text-xl font-bold text-gray-800">
            AI 서재 비서
          </CardTitle>
          <p className="text-sm text-gray-500">
            Gemini가 분석한 책의 핵심 정보입니다.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="font-medium animate-pulse">
              AI가 책을 꼼꼼히 읽고 있어요...
            </span>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg border border-red-100">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">
              요약 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.
            </span>
          </div>
        )}

        {summary && (
          <>
            {/* 1. 요약 */}
            <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
              <h3 className="flex items-center gap-2 mb-2 font-semibold text-emerald-800">
                <Sparkles className="w-4 h-4" />한 줄 요약
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {summary.summary}
              </p>
            </div>

            {/* 2. 핵심 포인트 */}
            <div>
              <h3 className="mb-3 font-semibold text-gray-800">핵심 포인트</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {summary.keyPoints?.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-100"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator className="bg-emerald-100" />

            {/* 3. 추천 대상 & 키워드 */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-2 mb-3 font-semibold text-gray-800">
                  <User className="w-4 h-4 text-gray-500" />
                  이런 분께 추천해요
                </h3>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
                  {summary.targetAudience}
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-gray-800">키워드</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.keywords?.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                    >
                      #{keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
