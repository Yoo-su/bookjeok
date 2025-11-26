import { useWithdrawMutation } from "@/features/user/mutations";
import { Button } from "@/shared/components/shadcn/button";

export const WithdrawalModal = () => {
  const { mutate: withdraw, isPending } = useWithdrawMutation();

  const handleWithdraw = () => {
    if (
      window.confirm(
        "정말 탈퇴하시겠습니까?\n\n회원 탈퇴 시 모든 개인정보가 삭제되거나 익명화되며, 이 작업은 되돌릴 수 없습니다.\n작성하신 판매글은 모두 숨김 처리되며, 채팅방 참여도 비활성화됩니다."
      )
    ) {
      withdraw();
    }
  };

  return (
    <Button
      variant="destructive"
      className="w-full sm:w-auto"
      onClick={handleWithdraw}
      disabled={isPending}
    >
      {isPending ? "처리 중..." : "회원 탈퇴"}
    </Button>
  );
};
