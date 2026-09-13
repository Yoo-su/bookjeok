import { PublicUserProfile, SaleStatus } from "@bookjeok/core";
import {
  usePublicUserProfileQuery,
  useSellerStatsQuery,
} from "@bookjeok/react-query";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { SaleStatusBadge } from "@/features/book-sale/components/common/sale-status-badge";
import { ReadingLogCalendar } from "@/features/reading-log/components/calendar-view/reading-log-calendar";
import { ReadingLogListView } from "@/features/reading-log/components/list-view/reading-log-list-view";
import { SellerTrustBadge, UserTradeReviewsList } from "@/features/trade";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShoppingBag,
  User,
} from "@/shared/components/icons/iconsax";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatDate, formatRelativeTime } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface UserProfileProps {
  handle: string;
}

type ProfileTab = "READING" | "TRADE_REVIEWS";

/**
 * 유저 프로필 메인 컴포넌트
 */
export const UserProfile = ({ handle }: UserProfileProps) => {
  const t = useTranslations("user_profile");
  const tReview = useTranslations("order.trade_review");
  const { data: profile, isLoading, error } = usePublicUserProfileQuery(handle);
  // 거래 후기는 결제와 무관하게 쌓이므로 결제 봉인 여부로 가리지 않는다.
  const { data: sellerStats } = useSellerStatsQuery(handle, {
    enabled: Boolean(handle),
  });
  const [activeTab, setActiveTab] = useState<ProfileTab>("READING");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (error || !profile) {
    return <NotFoundRedirect message={t("not_found")} useBack />;
  }

  const reviewCount = sellerStats?.totalReviews ?? 0;

  return (
    <div
      className="container mx-auto max-w-5xl px-4 py-10"
      data-clarity-mask="true"
    >
      <UserProfileHeader profile={profile} />
      <UserProfileStats stats={profile.stats} />

      {/* 탭 네비게이션 (결제/리뷰 기능 활성화 시에만 탭 노출) */}
      <div className="mb-8 border-b border-stone-200/80">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("READING")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "READING"
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            {tReview("list.tab_reading")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("TRADE_REVIEWS")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "TRADE_REVIEWS"
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            <span>
              {tReview("list.tab_trade_reviews", { count: reviewCount })}
            </span>
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠: 독서 활동 */}
      {activeTab === "READING" && (
        <div className="space-y-10">
          {/* 독서 기록 영역 (PC: 캘린더, 모바일: 리스트) */}
          {Array.isArray(profile.readingLogs) &&
            profile.readingLogs.length > 0 && (
              <div>
                {/* PC 뷰 (md 이상: 캘린더) */}
                <div className="hidden md:block rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs sm:p-8">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <h3 className="font-serif text-xl font-semibold text-stone-900 break-keep">
                      {t("reading_log_calendar_title", {
                        name: profile.nickname,
                      })}
                    </h3>
                    <span className="text-xs text-stone-400 font-serif shrink-0 whitespace-nowrap">
                      {t("sections.badge_calendar")}
                    </span>
                  </div>
                  <ReadingLogCalendar
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    readOnly
                    initialLogs={profile.readingLogs}
                  />
                </div>

                {/* 모바일 뷰 (md 미만: 리스트 & 무한 스크롤) */}
                <div className="block md:hidden rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-xs">
                  <div className="mb-4">
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-stone-900 break-keep">
                      {t("reading_log_calendar_title", {
                        name: profile.nickname,
                      })}
                    </h3>
                  </div>
                  <ReadingLogListView logs={profile.readingLogs} readOnly />
                </div>
              </div>
            )}

          {/* 최근 리뷰 및 최근 판매글 (2-column layout) */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* 형태가 어긋난 응답에서 `{}.length`는 0이 아니라 undefined라 가드를 통과한다 */}
            {Array.isArray(profile.recentReviews) &&
              profile.recentReviews.length > 0 && (
                <UserRecentReviews reviews={profile.recentReviews} />
              )}
            {Array.isArray(profile.recentSales) &&
              profile.recentSales.length > 0 && (
                <UserRecentSales sales={profile.recentSales} />
              )}
          </div>
        </div>
      )}

      {/* 탭 콘텐츠: 거래 후기 */}
      {activeTab === "TRADE_REVIEWS" && (
        <UserTradeReviewsList handle={handle} />
      )}
    </div>
  );
};

/**
 * 프로필 헤더 - 아바타, 닉네임, 가입일, 거래 신뢰 지표
 */
interface UserProfileHeaderProps {
  profile: Pick<
    PublicUserProfile,
    | "profileImageUrl"
    | "nickname"
    | "createdAt"
    | "handle"
    | "isEmailVerified"
    | "lastActiveAt"
  >;
}

const UserProfileHeader = ({ profile }: UserProfileHeaderProps) => {
  const t = useTranslations("user_profile");
  const locale = useLocale();
  const profileImageSrc = getProfileImageUrl(profile.profileImageUrl);

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs sm:p-8">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-stone-100 bg-stone-50 shadow-sm sm:h-28 sm:w-28">
          {profileImageSrc ? (
            <Image
              src={profileImageSrc}
              alt={profile.nickname}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <User className="h-12 w-12 text-stone-400" />
          )}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {profile.nickname}
            </h1>
            {profile.handle && (
              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                @{profile.handle}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-500 sm:justify-start sm:text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              <span>
                {t("joined", {
                  date: formatDate(profile.createdAt, locale, "yearMonth"),
                })}
              </span>
            </div>
            {/* 최근 접속: 정확한 시각 대신 상대시간만 노출 */}
            {profile.lastActiveAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                <span>
                  {t("last_active", {
                    time: formatRelativeTime(profile.lastActiveAt, locale),
                  })}
                </span>
              </div>
            )}
            {/* 이메일 인증 배지: 인증 여부만 노출하며 이메일 주소는 공개하지 않음 */}
            {profile.isEmailVerified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="font-medium">{t("email_verified")}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t("email_verified_tooltip")}
                </TooltipContent>
              </Tooltip>
            )}
            {/* 판매자 안전거래 신뢰 뱃지 */}
            {process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED === "true" &&
              profile.handle && (
                <SellerTrustBadge handle={profile.handle} size="sm" />
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

/** 사용자 지정 SVG 아이콘 - 도서 */
const BookIcon = ({
  className = "h-4 w-4",
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path d="M20.5 16V18.5C20.5 20.43 18.93 22 17 22H7C5.07 22 3.5 20.43 3.5 18.5V17.85C3.5 16.28 4.78 15 6.35 15H19.5C20.05 15 20.5 15.45 20.5 16Z" />
    <path d="M15.5 2H8.5C4.5 2 3.5 3 3.5 7V14.58C4.26 13.91 5.26 13.5 6.35 13.5H19.5C20.05 13.5 20.5 13.05 20.5 12.5V7C20.5 3 19.5 2 15.5 2ZM13 10.75H8C7.59 10.75 7.25 10.41 7.25 10C7.25 9.59 7.59 9.25 8 9.25H13C13.41 9.25 13.75 9.59 13.75 10C13.75 10.41 13.41 10.75 13 10.75ZM16 7.25H8C7.59 7.25 7.25 6.91 7.25 6.5C7.25 6.09 7.59 5.75 8 5.75H16C16.41 5.75 16.75 6.09 16.75 6.5C16.75 6.91 16.41 7.25 16 7.25Z" />
  </svg>
);

/** 사용자 지정 SVG 아이콘 - 리뷰/인용 */
const QuoteUpCircleIcon = ({
  className = "h-4 w-4",
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M17 11.8398H14.32C13.61 11.8398 13.13 11.2998 13.13 10.6498V9.15973C13.13 8.50973 13.61 7.96973 14.32 7.96973H15.81C16.46 7.96973 17 8.50973 17 9.15973V11.8398Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 11.8398C17 14.6298 16.48 15.0998 14.91 16.0298"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.86 11.8398H8.17998C7.46998 11.8398 6.98999 11.2998 6.98999 10.6498V9.15973C6.98999 8.50973 7.46998 7.96973 8.17998 7.96973H9.66998C10.32 7.96973 10.86 8.50973 10.86 9.15973V11.8398Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.86 11.8398C10.86 14.6298 10.34 15.0998 8.77002 16.0298"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 활동 통계 - 판매 수, 리뷰 수
 */
interface UserProfileStatsProps {
  stats: PublicUserProfile["stats"];
}

const UserProfileStats = ({ stats }: UserProfileStatsProps) => {
  const t = useTranslations("user_profile.stats");

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4">
      {/* 판매 중인 도서 */}
      <div className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-4.5 sm:p-5 shadow-xs transition-all duration-200 hover:border-stone-300 hover:shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-stone-500 sm:text-sm break-keep">
            {t("sales_count")}
          </span>
          <BookIcon className="h-5 w-5 text-stone-400 transition-all duration-200 group-hover:text-stone-800 group-hover:scale-110" />
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 transition-colors group-hover:text-stone-950">
            {stats.salesCount}
          </span>
          <span className="font-serif text-xs text-stone-400 font-medium sm:text-sm">
            {t("unit_books")}
          </span>
        </div>
      </div>

      {/* 작성한 리뷰 */}
      <div className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-4.5 sm:p-5 shadow-xs transition-all duration-200 hover:border-stone-300 hover:shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-stone-500 sm:text-sm break-keep">
            {t("reviews_count")}
          </span>
          <QuoteUpCircleIcon className="h-5 w-5 text-stone-400 transition-all duration-200 group-hover:text-stone-800 group-hover:scale-110" />
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 transition-colors group-hover:text-stone-950">
            {stats.reviewsCount}
          </span>
          <span className="font-serif text-xs text-stone-400 font-medium sm:text-sm">
            {t("unit_reviews")}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * 최근 리뷰 목록
 */
interface UserRecentReviewsProps {
  reviews: PublicUserProfile["recentReviews"];
}

const UserRecentReviews = ({ reviews }: UserRecentReviewsProps) => {
  const t = useTranslations("user_profile.sections");

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-900">
          {t("recent_reviews")}
        </h2>
        <span className="text-xs text-stone-400">
          {t("badge_recent_reviews")}
        </span>
      </div>
      <div className="space-y-3">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={PATHS.REVIEW_DETAIL(review.id)}
            className="group flex items-center gap-3.5 rounded-xl border border-stone-100 bg-stone-50/50 p-3 transition-all hover:border-stone-200 hover:bg-stone-50"
          >
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-200 shadow-2xs">
              {review.bookImage ? (
                <Image
                  src={review.bookImage}
                  alt={review.bookTitle}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <BookOpen className="h-5 w-5 text-stone-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900 transition-colors group-hover:text-stone-950">
                {review.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-stone-500">
                {review.bookTitle}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-600" />
          </Link>
        ))}
      </div>
    </div>
  );
};

/**
 * 최근 판매 목록
 */
interface UserRecentSalesProps {
  sales: PublicUserProfile["recentSales"];
}

const UserRecentSales = ({ sales }: UserRecentSalesProps) => {
  const t = useTranslations("user_profile.sections");

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-900">
          {t("recent_sales")}
        </h2>
        <span className="text-xs text-stone-400">
          {t("badge_recent_sales")}
        </span>
      </div>
      <div className="space-y-3">
        {sales.map((sale) => (
          <Link
            key={sale.id}
            href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
            className="group flex items-center gap-3.5 rounded-xl border border-stone-100 bg-stone-50/50 p-3 transition-all hover:border-stone-200 hover:bg-stone-50"
          >
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-200 shadow-2xs">
              {sale.bookImage ? (
                <Image
                  src={sale.bookImage}
                  alt={sale.bookTitle}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-stone-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900 transition-colors group-hover:text-stone-950">
                {sale.bookTitle}
              </p>
              <div className="mt-0.5">
                <PriceDisplay value={sale.price} size="sm" />
              </div>
            </div>
            <SaleStatusBadge status={sale.status as SaleStatus} />
          </Link>
        ))}
      </div>
    </div>
  );
};

/**
 * 로딩 스켈레톤
 */
export const UserProfileSkeleton = () => (
  <div className="container mx-auto max-w-5xl px-4 py-10">
    <div className="mb-8 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs sm:p-8">
      <div className="flex items-center gap-5">
        <Skeleton className="h-24 w-24 rounded-full sm:h-28 sm:w-28" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
    <div className="mb-8 grid grid-cols-2 gap-4">
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
    <Skeleton className="h-64 rounded-2xl" />
  </div>
);
