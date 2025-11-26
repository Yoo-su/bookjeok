import { BookHeart } from "lucide-react";

export const FullScreenLoader = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-white fixed inset-0 z-[100]">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Pulsating Glow Effect */}
        <div className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></div>
        {/* Logo or Icon */}
        <div className="relative inline-flex items-center justify-center rounded-full w-20 h-20 bg-emerald-500">
          <BookHeart className="w-10 h-10 text-white" />
        </div>
      </div>
    </div>
  );
};
