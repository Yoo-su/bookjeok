"use client";

import { useSendVerificationEmailMutation } from "@bookjeok/react-query";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { UserStatsDashboard } from "@/features/user/components/dashboard/user-stats-dashboard";
import { ProfileEditModal } from "@/features/user/components/profile/profile-edit-modal";
import { WithdrawalModal } from "@/features/user/components/profile/withdrawal-modal";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Handshake,
  Heart,
  MessageSquare,
  MessageSquareText,
  PackageCheck,
  Pencil,
  ShoppingBag,
  Truck,
  User,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

export const MyPageView = () => {
  const t = useTranslations("my_page");
  const user = useAuthStore((state) => state.user);
  const locale = useLocale();

  if (!user) {
    return null;
  }

  const profileImageSrc = getProfileImageUrl(user.profileImageUrl);

  const isPaymentEnabled =
    process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED === "true";

  const activityMenus = [
    {
      icon: CalendarDays,
      label: t("menu.reading_log.label"),
      description: t("menu.reading_log.desc"),
      href: PATHS.READING_LOG,
    },
    ...(isPaymentEnabled
      ? [
          {
            icon: PackageCheck,
            label: t("menu.purchases.label"),
            description: t("menu.purchases.desc"),
            href: PATHS.MY_PAGE_PURCHASES,
          },
          {
            icon: Truck,
            label: t("menu.sales_orders.label"),
            description: t("menu.sales_orders.desc"),
            href: PATHS.MY_PAGE_SALES_ORDERS,
          },
        ]
      : []),
    {
      icon: ShoppingBag,
      label: t("menu.sales.label"),
      description: t("menu.sales.desc"),
      href: PATHS.MY_PAGE_SALES,
    },
    // 직거래는 주문 기록이 없어 구매내역에 잡히지 않으므로
    // 결제 봉인 여부와 무관하게 항상 노출한다.
    {
      icon: Handshake,
      label: t("menu.trades.label"),
      description: t("menu.trades.desc"),
      href: PATHS.MY_PAGE_TRADES,
    },
    {
      icon: BookOpen,
      label: t("menu.reviews.label"),
      description: t("menu.reviews.desc"),
      href: PATHS.MY_REVIEWS,
    },
    {
      icon: Heart,
      label: t("menu.wishlist.label"),
      description: t("menu.wishlist.desc"),
      href: PATHS.MY_PAGE_WISHLIST,
    },
    {
      icon: MessageSquare,
      label: t("menu.comments.label"),
      description: t("menu.comments.desc"),
      href: PATHS.MY_COMMENTS,
    },
    {
      icon: MessageSquareText,
      label: t("menu.feedback.label"),
      description: t("menu.feedback.desc"),
      href: PATHS.MY_PAGE_FEEDBACK,
    },
  ];

  return (
    <div
      className="container mx-auto max-w-5xl px-4 py-8"
      data-clarity-mask="true"
    >
      {/* 상단 페이지 헤더 */}
      <div className="mb-6 border-b border-stone-200/80 pb-5">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          {t("title")}
        </h1>
      </div>

      {/* 프로필 섹션 */}
      <div className="mb-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs transition-shadow duration-300 hover:shadow-sm sm:p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {/* 아바타 */}
            <div className="relative group">
              <div
                className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-50 shadow-2xs sm:h-22 sm:w-22"
                data-nosnippet
              >
                {profileImageSrc ? (
                  <Image
                    src={profileImageSrc}
                    alt={user.nickname}
                    fill
                    sizes="88px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="h-9 w-9 text-stone-400" />
                )}
              </div>
              <ProfileEditModal
                trigger={
                  <button
                    type="button"
                    className="absolute right-0 bottom-0 flex h-6.5 w-6.5 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-xs transition-transform hover:scale-105 hover:text-stone-900"
                    aria-label={t("profile.edit")}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                }
              />
            </div>

            {/* 사용자 정보 */}
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h2 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                  {user.nickname}
                </h2>
                {user.name && (
                  <span className="text-xs text-stone-500 font-medium">
                    ({user.name})
                  </span>
                )}
                {user.handle && (
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
                    @{user.handle}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start text-xs text-stone-500">
                {user.email ? (
                  <>
                    <span>{user.email}</span>
                    {user.isEmailVerified ? (
                      <>
                        <span className="text-stone-300">·</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("profile.verified")}
                        </span>
                      </>
                    ) : (
                      <ResendVerificationAction />
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-stone-400">
                      {t("profile.no_email")}
                    </span>
                    <span className="text-stone-300">·</span>
                    <ProfileEditModal
                      trigger={
                        <button
                          type="button"
                          className="font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          {t("profile.register_email")}
                        </button>
                      }
                    />
                  </>
                )}
              </div>

              {user.createdAt && (
                <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-stone-400 sm:justify-start">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {t("profile.joined", {
                      date: formatDate(user.createdAt, locale, "yearMonth"),
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <ProfileEditModal
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 rounded-xl border-stone-200 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
              >
                <Pencil className="mr-1.5 h-3 w-3" />
                <span>{t("profile.edit")}</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* 통계 대시보드 */}
      <UserStatsDashboard />

      {/* 활동 메뉴 */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
          {t("activity_manage")}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activityMenus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="group flex flex-col justify-between rounded-xl border border-stone-200/80 bg-white p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-sm"
            >
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-700 transition-colors group-hover:bg-stone-900 group-hover:text-white">
                  <menu.icon className="h-4.5 w-4.5" />
                </div>
                <h4 className="mt-3 text-sm font-semibold text-stone-900 transition-colors group-hover:text-stone-950">
                  {menu.label}
                </h4>
                <p className="mt-0.5 text-xs text-stone-500">
                  {menu.description}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-stone-400 transition-colors group-hover:text-stone-700">
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 계정 탈퇴 */}
      <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-xs font-semibold text-stone-700">
              {t("danger_zone.withdraw_title")}
            </h4>
            <p className="mt-0.5 text-xs text-stone-500">
              {t("danger_zone.withdraw_desc")}
            </p>
          </div>
          <WithdrawalModal />
        </div>
      </div>
    </div>
  );
};

const ResendVerificationAction = () => {
  const t = useTranslations("my_page.profile");
  const { mutate: resend, isPending } = useSendVerificationEmailMutation({
    onSuccess: () => {
      toast.success(t("resend_success"));
    },
    onError: () => {
      toast.error(t("resend_error"));
    },
  });

  return (
    <>
      <span className="text-stone-300">·</span>
      <span className="text-stone-400">{t("unverified")}</span>
      <span className="text-stone-300">·</span>
      <button
        type="button"
        onClick={() => resend()}
        disabled={isPending}
        className="font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isPending ? t("resending") : t("resend_verification")}
      </button>
    </>
  );
};
