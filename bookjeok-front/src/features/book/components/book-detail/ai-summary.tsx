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
  isRequested: boolean;
  onRequestSummary: () => void;
}

export const AISummary = ({
  summary,
  isLoading,
  isError,
  isRequested,
  onRequestSummary,
}: BookSummaryProps) => {
  return (
    <Card className="overflow-hidden border-emerald-100 shadow-sm bg-linear-to-br from-emerald-50/50 to-white">
      <CardHeader className="flex flex-row items-center gap-3 pb-4 border-b border-emerald-50">
        <div className="p-2.5 bg-emerald-100 rounded-xl shadow-inner">
          <BotMessageSquare className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold tracking-tight text-gray-900">
            AI 서재 비서
          </CardTitle>
          <p className="text-sm font-medium text-gray-500">
            Gemini가 분석한 책의 핵심 정보입니다
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!isRequested ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="p-4 bg-white rounded-full shadow-sm border border-emerald-100">
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900">
                이 책의 핵심 내용이 궁금하신가요?
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                AI가 책의 줄거리, 핵심 포인트, 추천 대상을 빠르게
                요약해드립니다.
                <br />
                버튼을 눌러 요약 정보를 확인해보세요.
              </p>
            </div>
            <button
              onClick={onRequestSummary}
              className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI 요약 보기
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-25"></div>
              <div className="relative p-4 bg-white rounded-full shadow-sm border border-emerald-100">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-gray-900">
                AI가 책을 읽고 있어요
              </p>
              <p className="text-sm text-gray-500">잠시만 기다려주세요...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="p-3 bg-red-50 rounded-full text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">
                요약 정보를 불러오지 못했습니다
              </p>
              <p className="text-sm text-gray-500">
                일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.
              </p>
            </div>
            <button
              onClick={onRequestSummary}
              className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              다시 시도하기
            </button>
          </div>
        ) : summary ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. 요약 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-100 to-teal-100 rounded-2xl opacity-50 group-hover:opacity-70 transition duration-300 blur-sm"></div>
              <div className="relative p-5 bg-white rounded-xl border border-emerald-100 shadow-sm">
                <h3 className="flex items-center gap-2 mb-3 font-bold text-emerald-800">
                  <Sparkles className="w-4 h-4" />한 줄 요약
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg font-medium">
                  {summary.summary}
                </p>
              </div>
            </div>

            {/* 2. 핵심 포인트 */}
            <div>
              <h3 className="flex items-center gap-2 mb-4 font-bold text-gray-900 text-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                핵심 포인트
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {summary.keyPoints?.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 leading-relaxed">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator className="bg-emerald-100/50" />

            {/* 3. 추천 대상 & 키워드 */}
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <User className="w-5 h-5 text-gray-500" />
                  이런 분께 추천해요
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 leading-relaxed">
                  {summary.targetAudience}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <Badge variant="outline" className="px-2 py-0.5 text-xs">
                    TAGS
                  </Badge>
                  키워드
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summary.keywords?.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-sm font-medium transition-colors"
                    >
                      #{keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
