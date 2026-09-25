import { permanentRedirect } from "next/navigation";

import { PATHS } from "@/shared/constants/paths";

type Props = {
  params: Promise<{ locale: string; handle: string }>;
};

/**
 * 카드덱 공유 페이지는 책탑으로 대체되며 없어졌다. 이미 퍼진 링크가 404가 나지 않게
 * 그 사용자의 공개 프로필로 보낸다.
 */
export default async function LegacyShareDeckPage({ params }: Props) {
  const { locale, handle } = await params;
  const encoded = encodeURIComponent(decodeURIComponent(handle));
  permanentRedirect(`/${locale}${PATHS.USER_PROFILE(encoded)}`);
}
