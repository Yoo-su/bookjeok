"use client";

import { ReactNode } from "react";

import { RecentBooksDrawer } from "@/features/book/components/recent-books/recent-books-drawer";

import { DefaultFooter } from "./default-footer";
import { DefaultHeader } from "./default-header";

interface DefaultLayoutProps {
  children: ReactNode;
}
export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <DefaultHeader />
      {/* main 영역이 남은 공간을 모두 차지하도록 grow 속성 추가 */}
      <main className="mx-auto w-full max-w-3xl flex-grow p-4 sm:p-6">
        {children}
      </main>
      <DefaultFooter />
      <RecentBooksDrawer />
    </div>
  );
};
