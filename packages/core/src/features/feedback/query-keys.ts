import { createQueryKeys } from "@lukemorales/query-key-factory";

import { GetAdminFeedbackParams } from "./types";

export const feedbackKeys = createQueryKeys("feedback", {
  my: null,
  admin: (params: GetAdminFeedbackParams) => ({
    queryKey: [params],
  }),
});
