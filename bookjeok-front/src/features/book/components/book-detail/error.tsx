import { BookOpen } from "lucide-react";

export const BookDetailError = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 bg-gray-50 rounded-lg">
      <BookOpen className="w-12 h-12 mb-4 text-gray-400" />
      <h2 className="text-xl font-semibold">책 정보를 불러올 수 없습니다.</h2>
      <p className="mt-2 text-sm">
        요청하신 책을 찾지 못했거나 오류가 발생했습니다.
      </p>
    </div>
  );
};
