"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { PATHS } from "@/shared/constants/paths";

export const Logo = () => {
  const router = useRouter();
  const handleClickLogo = () => {
    router.push(PATHS.HOME);
  };

  return (
    <div
      className="group flex items-center gap-0.5 cursor-pointer select-none"
      onClick={handleClickLogo}
      aria-label="북적 홈으로 이동"
    >
      <div className="relative w-9 h-9 transition-transform duration-500 ease-out group-hover:rotate-[-5deg] group-hover:scale-105">
        <Image
          src="/logo.svg"
          alt="북적"
          width={36}
          height={36}
          className="w-full h-full"
        />
      </div>

      <div className="flex items-baseline leading-none">
        <span className="text-[26px] font-[family-name:var(--font-bitcount)] font-semibold text-[#1a2a4b] tracking-tight">
          book
        </span>
        <span className="text-[26px] font-[family-name:var(--font-bitcount)] font-bold text-[#2b6d61] tracking-tight ml-0.5 group-hover:text-[#3d8b7d] transition-colors">
          jeok
        </span>
      </div>
    </div>
  );
};
