import type { Meta, StoryObj } from "@storybook/react";
import Image from "next/image";

import { Logo } from "@/layouts/common/logo";
import { BRAND_ASSETS } from "@/shared/constants/brand";

const BrandAssets = () => (
  <main className="mx-auto max-w-5xl space-y-10 bg-white p-6 text-stone-900">
    <div>
      <h1 className="text-2xl font-semibold">북적 · A 자유로운 펜선</h1>
      <p className="mt-2 text-sm text-stone-500">
        실제 로고 컴포넌트와 배포 자산. 글자와 심벌 크기는 현재 헤더 그대로.
      </p>
    </div>
    <section className="flex flex-wrap items-center gap-8 border-y border-stone-200 py-6">
      <Logo variant="ko" />
      <Logo variant="en" />
      <Logo variant="ko" size="sm" />
      <Logo variant="en" size="sm" />
    </section>
    <section className="flex flex-wrap items-end gap-8">
      {[16, 24, 30, 48, 96, 192].map((size) => (
        <figure key={size}>
          <Image
            src={BRAND_ASSETS.symbol}
            width={size}
            height={size}
            alt={`${size}px 심벌`}
            unoptimized
          />
          <figcaption className="mt-3 text-xs text-stone-500">
            {size}px
          </figcaption>
        </figure>
      ))}
    </section>
    <section className="grid gap-6 sm:grid-cols-3">
      <figure>
        <Image
          src="/brand/pen-v1/social-profile.png"
          width={180}
          height={180}
          alt="원형 SNS 프로필"
          className="rounded-full border border-stone-200"
          unoptimized
        />
        <figcaption className="mt-3 text-sm">SNS 원형 크롭</figcaption>
      </figure>
      <figure>
        <Image
          src={BRAND_ASSETS.maskableIcon}
          width={180}
          height={180}
          alt="원형 앱 아이콘"
          className="rounded-full border border-stone-200"
          unoptimized
        />
        <figcaption className="mt-3 text-sm">앱 아이콘 안전 여백</figcaption>
      </figure>
      <figure className="bg-stone-900 p-4 text-stone-100">
        <Image
          src={BRAND_ASSETS.symbolLight}
          width={148}
          height={148}
          alt="어두운 배경용 심벌"
          unoptimized
        />
        <figcaption className="mt-3 text-sm">어두운 배경용</figcaption>
      </figure>
    </section>
    <section className="grid gap-6 sm:grid-cols-2">
      {(["ko", "en"] as const).map((locale) => (
        <Image
          key={locale}
          src={BRAND_ASSETS.shareCard(locale, "home")}
          width={1200}
          height={630}
          alt={`${locale} 홈 공유 카드`}
          className="h-auto w-full border border-stone-200"
          unoptimized
        />
      ))}
    </section>
  </main>
);

const meta = {
  title: "Shared/Icons/BrandAssets",
  component: BrandAssets,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
} satisfies Meta<typeof BrandAssets>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Pen: Story = {};
