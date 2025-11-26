import { artKeys } from "./art";
import { authKeys } from "./auth";
import { bookKeys } from "./book";
import { chatKeys } from "./chat";
import { userKeys } from "./user";

export const QUERY_KEYS = {
  artKeys,
  bookKeys,
  chatKeys,
  authKeys,
  userKeys,
} as const;
