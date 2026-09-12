import "@/styles/globals.css";
import "@/styles/swiper.css";
import "@/shared/libs/axios";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { ChatProvider } from "@/features/chat/providers/chat-provider";
import { ConfirmHost } from "@/features/confirm";
import {
  FloatingMusicPill,
  GlobalMusicHost,
  MusicPlayerModal,
} from "@/features/music";
import { NotificationProvider } from "@/features/notification/providers/notification-provider";
import GoogleAnalytics from "@/shared/components/analytics/google-analytics";
import MicrosoftClarity from "@/shared/components/analytics/microsoft-clarity";
import { JsonLd } from "@/shared/components/json-ld";
import { NavigationProgress } from "@/shared/components/navigation-progress";
import { Toaster } from "@/shared/components/shadcn/sonner";
import { config } from "@/shared/config/env";
import { Locale, routing } from "@/shared/config/i18n/routing";
import { getJsonLd } from "@/shared/config/json-ld";
import { generateGlobalMetadata } from "@/shared/config/metadata";
import { OverlayProvider } from "@/shared/hooks/use-overlay";
import { QueryProvider } from "@/shared/providers/query-provider";
import { SocketProvider } from "@/shared/providers/socket-provider";
import UserProvider from "@/shared/providers/user-provider";
import {
  bitcount,
  diphylleia,
  do_hyeon,
  gowun_batang,
  nanum_gothic,
  pretendard,
  song_myung,
} from "@/styles/fonts";

// 메타데이터 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return generateGlobalMetadata(t, locale);
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Layout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // 유효하지 않은 locale 진입 시 404 처리
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // 정적 렌더링(SSG) 활성화
  setRequestLocale(locale);

  // 다국어 메시지 로드
  const messages = await getMessages();
  const t = await getTranslations({ locale });
  const jsonLdData = getJsonLd(t, locale);

  return (
    <html
      lang={locale}
      className={`${pretendard.variable} ${nanum_gothic.variable} ${bitcount.variable} ${gowun_batang.variable} ${song_myung.variable} ${do_hyeon.variable} ${diphylleia.variable}`}
    >
      <body style={{ fontFamily: "var(--font-pretendard)" }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {t("common.aria.skip_to_content")}
        </a>
        <NextIntlClientProvider messages={messages}>
          <NavigationProgress />
          <QueryProvider>
            <UserProvider>
              {/* 알림 시스템 */}
              <SocketProvider namespace="/notification">
                <NotificationProvider />
              </SocketProvider>

              {/* 채팅 시스템 (중첩 또는 병렬 - 리스너가 각 제공자 내부에 있으므로 형제 관계도 작동함) */}
              <SocketProvider namespace="/chat">
                <ChatProvider>
                  <OverlayProvider>
                    <div
                      id="main-content"
                      tabIndex={-1}
                      className="outline-none"
                    >
                      {children}
                    </div>
                  </OverlayProvider>
                </ChatProvider>
              </SocketProvider>
            </UserProvider>

            <Analytics />
            <SpeedInsights />
            <GoogleAnalytics />
            <MicrosoftClarity />
          </QueryProvider>
          <ConfirmHost />
          <GlobalMusicHost />
          <MusicPlayerModal />
          <FloatingMusicPill />
          <Toaster position="bottom-center" />
          <JsonLd data={jsonLdData} />
          {config.NEXT_PUBLIC_GOOGLE_ADSENSE_ID && (
            <Script
              id="adsense-init"
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
