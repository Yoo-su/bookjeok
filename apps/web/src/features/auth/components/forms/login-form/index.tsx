import { useEmailLoginMutation } from "@bookjeok/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createLoginSchema, LoginSchemaType } from "@/features/auth/schema"; // Using centralized schema
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { consumeReturnUrl } from "@/features/auth/utils/return-url";
import { Logo } from "@/layouts/common/logo";
import { Loader2 } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import { config } from "@/shared/config/env";
import { Link, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { API_ERROR_CODES, getErrorCode } from "@/shared/utils/error-handler";

export const LoginForm = () => {
  const t = useTranslations("auth.login");
  const handleSocialLogin = (callbackUrl: string) => {
    window.location.href = `${config.NEXT_PUBLIC_API_URL}/${callbackUrl}`;
  };

  return (
    <div className="w-full max-w-sm p-8 mx-4 space-y-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <Logo />
        <h1 className="font-(family-name:--font-gowun-batang) text-2xl font-bold text-gray-900">
          {t("title")}
        </h1>
        <p className="font-(family-name:--font-gowun-batang) text-sm text-gray-500">
          {t("subtitle")}
        </p>
      </div>

      <EmailLoginForm />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center font-(family-name:--font-gowun-batang) text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">{t("or_social")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* 네이버 로그인 버튼 */}
        <button
          type="button"
          onClick={() => handleSocialLogin("auth/naver")}
          className="w-full h-11 flex items-center justify-center gap-2 bg-[#03C75A] hover:bg-[#02B350] transition-colors rounded-xl font-medium text-white text-[15px] cursor-pointer shadow-xs"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12.1575 9.7125L5.5575 0H0V18H5.8425V8.2875L12.4425 18H18V0H12.1575V9.7125Z"
              fill="white"
            />
          </svg>
          {t("naver")}
        </button>

        {/* 카카오 로그인 버튼 */}
        <button
          type="button"
          onClick={() => handleSocialLogin("auth/kakao")}
          className="w-full h-11 flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] transition-colors rounded-xl font-medium text-[#191919] text-[15px] cursor-pointer shadow-xs"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 1.5C4.58172 1.5 1 4.31682 1 7.79167C1 9.94825 2.37894 11.8384 4.49258 12.8715L3.60195 16.1423C3.52285 16.4328 3.85698 16.6663 4.10398 16.5028L7.96207 13.9488C8.30232 14.0041 8.64778 14.0326 9 14.0326C13.4183 14.0326 17 11.2158 17 7.79167C17 4.31682 13.4183 1.5 9 1.5Z"
              fill="#191919"
            />
          </svg>
          {t("kakao")}
        </button>
      </div>

      <div className="text-center font-(family-name:--font-gowun-batang) text-sm">
        <span className="text-gray-500">{t("no_account")} </span>
        <Link
          href={PATHS.SIGNUP}
          className="font-medium text-emerald-600 hover:text-emerald-500"
        >
          {t("signup_link")}
        </Link>
      </div>
    </div>
  );
};

function EmailLoginForm() {
  const t = useTranslations("auth.login");
  const tValidation = useTranslations("auth.validation");
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(createLoginSchema((key) => tValidation(key))),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: login, isPending: isLoading } = useEmailLoginMutation({
    onSuccess: (data) => {
      setAuth(data);
      toast.success(t("success"));
      const returnUrl = consumeReturnUrl();
      router.push(returnUrl || "/");
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (getErrorCode(error) === API_ERROR_CODES.SOCIAL_LOGIN_USER) {
          form.setError("root", {
            message: t("error.social_login_user"),
          });
        } else {
          form.setError("root", {
            message: t("error.invalid_credentials"),
          });
        }
      } else {
        toast.error(t("error.general"));
      }
    },
  });

  const onSubmit = (values: LoginSchemaType) => {
    login(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder={t("placeholders.email")}
                  aria-label={t("placeholders.email")}
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder={t("placeholders.password")}
                  aria-label={t("placeholders.password")}
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div
            role="alert"
            aria-live="assertive"
            className="text-[13px] font-medium text-destructive text-center"
          >
            {form.formState.errors.root.message}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("submit")}
        </Button>
      </form>
    </Form>
  );
}
