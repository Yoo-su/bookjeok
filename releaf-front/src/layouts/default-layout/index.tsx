"use client";

import { RecentBooksDrawer } from "@/features/book/components/recent-books/recent-books-drawer";

import { DefaultFooter } from "./default-footer";
import { DefaultHeader } from "./default-header";

interface DefaultLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}
export const DefaultLayout = ({
  children,
  fullWidth = false,
}: DefaultLayoutProps) => {
  return (
    <div className="flex min-h-dvh w-full flex-col relative">
      <DefaultHeader />
      {/* main 영역이 남은 공간을 모두 차지하도록 grow 속성 추가 */}
      <main
        className={`mx-auto w-full grow p-4 sm:p-6 ${fullWidth ? "" : "max-w-4xl"}`}
      >
        {children}
      </main>
      <DefaultFooter />
      <RecentBooksDrawer />
    </div>
  );
};
