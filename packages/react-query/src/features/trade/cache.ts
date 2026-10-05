import {
  bookSaleKeys,
  chatKeys,
  orderKeys,
  tradeKeys,
  tradeReviewKeys,
  userKeys,
} from "@bookjeok/core";
import { QueryClient } from "@tanstack/react-query";

/**
 * 예약·완료 요청과 원격 거래 메시지가 같은 조회 상태를 갱신한다.
 * 완료 기록과 후기 자격은 폴링하지 않으므로 거래 변경 시 함께 무효화한다.
 */
export const invalidateTradeCaches = async (
  queryClient: QueryClient,
): Promise<void> => {
  await Promise.all(
    [
      bookSaleKeys._def,
      // 메시지는 소켓에서 병합한다. 재조회하면 전송 중·실패 메시지가 사라진다.
      chatKeys.rooms.queryKey,
      tradeKeys._def,
      tradeReviewKeys._def,
      userKeys._def,
      orderKeys._def,
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
};
