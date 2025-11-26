"use client";

import { useRouter } from "next/navigation";

export const Logo = () => {
  const router = useRouter();
  const handleClickLogo = () => {
    router.push("/home");
  };

  return (
    <div
      className="group flex items-center gap-0.5 cursor-pointer select-none"
      onClick={handleClickLogo}
      aria-label="Releaf Home"
    >
      <div className="relative w-9 h-9 transition-transform duration-500 ease-out group-hover:rotate-[-5deg] group-hover:scale-105">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <path
            d="M16 26C12 26 8 26 4 25L4 6C8 5 12 5 16 7"
            className="stroke-[#1a2a4b] stroke-2 fill-[#e3d5b0]"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Page Thickness / Shadow at bottom left */}
          <path
            d="M4 25L4 27C8 28 12 28 16 28"
            className="stroke-[#1a2a4b] stroke-1 opacity-50"
            strokeLinecap="round"
          />

          <path
            d="M7 10H13"
            className="stroke-[#1a2a4b] stroke-1 opacity-30"
            strokeLinecap="round"
          />
          <path
            d="M7 14H13"
            className="stroke-[#1a2a4b] stroke-1 opacity-30"
            strokeLinecap="round"
          />
          <path
            d="M7 18H11"
            className="stroke-[#1a2a4b] stroke-1 opacity-30"
            strokeLinecap="round"
          />
          <path
            d="M16 26C16 26 18 25 22 25C26 25 29 21 29 14C29 7 24 2 19 2C17 2 16 7 16 7"
            className="fill-[#2b6d61]"
          />
          <path
            d="M16 7V26"
            className="stroke-[#2b6d61] stroke-[1.5] opacity-50"
            strokeLinecap="round"
          />
          <path
            d="M16 12C19 11 22 9 24 6"
            className="stroke-white/30 stroke-1"
            strokeLinecap="round"
          />
          <path
            d="M16 18C19 17 22 15 24 13"
            className="stroke-white/30 stroke-1"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex items-baseline leading-none">
        <span className="text-[26px] font-serif font-bold text-[#1a2a4b] tracking-tighter">
          Re
        </span>
        <span className="text-[26px] font-serif font-extrabold text-[#2b6d61] tracking-tighter ml-0.5 group-hover:text-[#3d8b7d] transition-colors">
          leaf
        </span>
      </div>
    </div>
  );
};
