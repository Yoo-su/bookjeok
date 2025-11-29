import { BookHeart, Github } from "lucide-react";
import Link from "next/link";

import { Separator } from "@/shared/components/shadcn/separator";

export const DefaultFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        {/* 상단 섹션: 로고 및 네비게이션 링크 */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-gray-700 transition-colors hover:text-gray-900"
          >
            <BookHeart className="h-6 w-6 text-emerald-600" />
            <span>ReLeaf</span>
          </Link>
        </div>

        <Separator className="my-6" />

        {/* 하단 섹션: 저작권 및 소셜 링크 */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-gray-500">
            © {currentYear} ReLeaf. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Yoo-su"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-gray-400 transition-colors hover:text-gray-800"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
