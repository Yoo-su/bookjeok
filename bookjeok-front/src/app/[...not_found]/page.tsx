import { redirect } from "next/navigation";

import { PATHS } from "@/shared/constants/paths";

export default function Page() {
  redirect(PATHS.HOME);
}
