import {
  useEmailLoginMutation as useBaseEmailLoginMutation,
  useEmailSignupMutation as useBaseEmailSignupMutation,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * 이메일 로그인 뮤테이션
 */
export const useEmailLoginMutation = () => {
  const t = useTranslations("auth.login");

  return useBaseEmailLoginMutation({
    onSuccess: () => {
      toast.success(t("success"));
    },
    onError: () => {
      toast.error(t("error.invalid_credentials"));
    },
  });
};

/**
 * 이메일 회원가입 뮤테이션
 */
export const useEmailSignupMutation = () => {
  const t = useTranslations("auth.signup");

  return useBaseEmailSignupMutation({
    onSuccess: () => {
      toast.success(t("success"));
    },
    onError: () => {
      toast.error(t("error.email_exists"));
    },
  });
};
