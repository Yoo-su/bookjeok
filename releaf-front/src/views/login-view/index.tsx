"use client";

import { Logo } from "@/layouts/common/logo";

export const LoginView = () => {
  const handleSocialLogin = (callbackUrl: string) => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/${callbackUrl}`;
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-sm p-8 mx-4 space-y-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <Logo />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            시작하기
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            SNS 계정으로 3초만에 간편하게 로그인하세요.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* 카카오 로그인 버튼 */}
          <button
            onClick={() => handleSocialLogin("auth/kakao")}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] transition-colors rounded-lg font-medium text-[#000000] text-[15px]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9 0C4.0293 0 0 3.28125 0 7.33125C0 9.87188 1.5457 12.1125 3.9375 13.4062L2.9707 17.1562C2.91445 17.3719 3.07695 17.5688 3.29883 17.5688C3.38672 17.5688 3.47461 17.5406 3.54492 17.4797L7.95117 14.4C8.29688 14.4281 8.64844 14.4469 9 14.4469C13.9707 14.4469 18 11.1656 18 7.11562C18 3.28125 13.9707 0 9 0Z"
                fill="#000000"
              />
            </svg>
            카카오 로그인
          </button>

          {/* 네이버 로그인 버튼 */}
          <button
            onClick={() => handleSocialLogin("auth/naver")}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#03C75A] hover:bg-[#02B350] transition-colors rounded-lg font-medium text-white text-[15px]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M12.1575 9.7125L5.5575 0H0V18H5.8425V8.2875L12.4425 18H18V0H12.1575V9.7125Z"
                fill="white"
              />
            </svg>
            네이버 로그인
          </button>
        </div>

        <p className="px-8 text-xs text-center text-gray-500">
          로그인은{" "}
          <a href="/terms" className="underline hover:text-gray-700">
            이용약관
          </a>{" "}
          및{" "}
          <a href="/privacy" className="underline hover:text-gray-700">
            개인정보처리방침
          </a>
          에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </main>
  );
};
