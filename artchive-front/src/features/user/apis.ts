import { privateAxios } from "@/shared/libs/axios";

import { UserStats } from "./queries";

export const getUserStats = async (): Promise<UserStats> => {
  const { data } = await privateAxios.get<UserStats>("/user/stats");
  return data;
};
