import { UserProfileView } from "@/views/user-profile-view";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  if (isNaN(userId)) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-stone-500">
        잘못된 사용자 ID입니다.
      </div>
    );
  }

  return <UserProfileView userId={userId} />;
}
