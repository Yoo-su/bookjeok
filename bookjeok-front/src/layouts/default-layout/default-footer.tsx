import { Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Separator } from "@/shared/components/shadcn/separator";
import { PATHS } from "@/shared/constants/paths";

export const DefaultFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-stone-50 mt-8">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* 좌측 섹션: 브랜드 & 설명 */}
          <div className="space-y-4 md:max-w-xs">
            <Link href={PATHS.HOME} className="flex items-center gap-1.5">
              <Image
                src="/logo.svg"
                alt="북적"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="font-(family-name:--font-bitcount) text-xl font-bold text-stone-800 tracking-tight">
                bookjeok
              </span>
            </Link>
            <p className="text-sm text-stone-500 leading-relaxed">
              도서 리뷰 공유와 중고책 거래 플랫폼
            </p>
          </div>

          {/* 우측 섹션: 링크 모음 */}
          <div className="grid grid-cols-2 gap-10 sm:gap-0">
            {/* Service Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-900">Service</h3>
              <ul className="space-y-2.5 text-sm text-stone-500">
                <li>
                  <Link
                    href={PATHS.BOOK_SEARCH}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    도서 검색
                  </Link>
                </li>
                <li>
                  <Link
                    href={PATHS.BOOK_MARKET}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    중고 장터
                  </Link>
                </li>
                <li>
                  <Link
                    href="/book/reviews"
                    className="hover:text-emerald-600 transition-colors"
                  >
                    북 리뷰
                  </Link>
                </li>
              </ul>
            </div>

            {/* 연락처 & 소셜 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-900">Contact</h3>
              <ul className="space-y-2.5 text-sm text-stone-500">
                <li>rhan0871@naver.com</li>
                <li>Seoul, Republic of Korea</li>
                <li>
                  <a
                    href="https://github.com/Yoo-su"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-emerald-600 transition-colors w-fit"
                    aria-label="GitHub"
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-stone-200" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-stone-400 sm:flex-row">
          <p className="text-zinc-500 text-sm">
            &copy; {currentYear} bookjeok. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-stone-600 transition-colors">
              이용약관
            </Link>
            <Link href="#" className="hover:text-stone-600 transition-colors">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
