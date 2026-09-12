import { getPublicUserProfile } from "@bookjeok/api-client";
import { userKeys } from "@bookjeok/core";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { ProfilePageJsonLd } from "@/features/user/components/profile/profile-page-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { getQueryClient } from "@/shared/libs/query-client";
import { isNotFoundError } from "@/shared/utils/api-error";
import { UserProfileView } from "@/views/user-profile-view";

interface UserProfilePageProps {
  params: Promise<{ locale: string; handle: string }>;
}

// 닉네임·통계 변경 반영용. 방문자는 refetchOnMount로 최신을 보므로
// 시간 기반 주기는 크롤러 기준으로 잡는다. (revalidate 누락 시 s-maxage 1년 고착)
export const revalidate = 3600; // 1시간

// ISR 활성화용 빈 파라미터 목록
// - generateStaticParams가 없으면 Next가 Dynamic으로 분류해 revalidate를 무시
// - 빌드 타임 프리렌더 없이 첫 요청 시 생성 후 ISR 캐시에 등록 (dynamicParams 기본값 true)
export function generateStaticParams() {
  return [];
}

// React.cache를 사용하여 metadata와 page 렌더링 간 중복 API 요청 방지
// 부재(404)만 null 반환, 일시적 API 장애는 재던짐 (장애로 만든 404가 10분 캐시되는 것 방지)
const getCachedPublicProfile = cache(async (handle: string) => {
  try {
    return await getPublicUserProfile(handle);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
});

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const t = await getTranslations({
    locale,
    namespace: "user_profile.metadata",
  });

  const profile = await getCachedPublicProfile(handle);
  if (!profile) {
    return createPageMetadata({
      title: t("title"),
      description: t("description"),
      locale,
      path: `/users/${handle}`,
    });
  }

  // 검색 결과 향상을 위해 유저의 실제 닉네임을 타이틀에 동적으로 활용
  return createPageMetadata({
    title: `${profile.nickname}님의 프로필`,
    description: `${profile.nickname}님의 독서 기록, 최근 작성한 리뷰 및 중고 거래 상품 목록을 만나보세요.`,
    imageUrl: profile.profileImageUrl || null,
    locale,
    path: `/users/${handle}`,
  });
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  const queryClient = getQueryClient();
  const profile = await getCachedPublicProfile(handle);

  if (!profile) {
    notFound(); // 존재하지 않는 회원일 경우 즉시 서버 레벨에서 404 상태 코드 반환
  }

  // React Query 캐시에 데이터 주입하여 클라이언트 사이드 하이드레이션 지원
  queryClient.setQueryData(userKeys.publicProfile(handle).queryKey, profile);

  return (
    <ServerQueryBoundary queryClient={queryClient}>
      <ProfilePageJsonLd profile={profile} locale={locale} />
      <UserProfileView handle={handle} />
    </ServerQueryBoundary>
  );
}
