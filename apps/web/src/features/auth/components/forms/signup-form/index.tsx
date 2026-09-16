"use client";

import { useEmailSignupMutation } from "@bookjeok/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createSignupSchema, SignupSchemaType } from "@/features/auth/schema";
import { Loader2 } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { Link, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import {
  API_ERROR_CODES,
  getErrorCode,
  getErrorMessage,
} from "@/shared/utils/error-handler";

export const SignupForm = () => {
  const t = useTranslations("auth.signup");
  const tValidation = useTranslations("auth.validation");
  const router = useRouter();

  const form = useForm<SignupSchemaType>({
    resolver: zodResolver(createSignupSchema((key) => tValidation(key))),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      nickname: "",
      name: "",
      gender: "U",
      ageRange: "",
    },
  });

  const { mutate: signup, isPending: isLoading } = useEmailSignupMutation({
    onSuccess: () => {
      toast.success(t("success"));
      router.push(PATHS.LOGIN);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const code = getErrorCode(error);
        if (code === API_ERROR_CODES.EMAIL_ALREADY_EXISTS) {
          form.setError("email", { message: t("error.email_exists") });
        } else if (code === API_ERROR_CODES.NICKNAME_ALREADY_EXISTS) {
          form.setError("nickname", {
            message: t("error.nickname_exists"),
          });
        } else {
          toast.error(t("error.info_exists"));
        }
      } else if (axios.isAxiosError(error)) {
        const serverMessage = getErrorMessage(error, "");
        if (serverMessage) {
          toast.error(t("error.server", { message: serverMessage }));
        } else {
          toast.error(t("error.unknown"));
        }
      } else {
        toast.error(t("error.unknown"));
      }
    },
  });

  const onSubmit = (values: SignupSchemaType) => {
    signup({
      email: values.email,
      password: values.password,
      nickname: values.nickname,
      name: values.name,
      gender: values.gender === "U" || !values.gender ? null : values.gender,
      ageRange: values.ageRange ? values.ageRange : null,
    });
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-gray-600">{t("subtitle")}</p>
      </div>

      <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-gray-700 font-medium">
                    {t("labels.email")} <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholders.email")}
                      type="email"
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <div className="min-h-[20px]">
                    <FormMessage className="text-xs" />
                  </div>
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-700 font-medium">
                      {t("labels.password")}{" "}
                      <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholders.password")}
                        type="password"
                        className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <div className="min-h-[20px]">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-700 font-medium">
                      {t("labels.password_confirm")}{" "}
                      <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholders.password_confirm")}
                        type="password"
                        className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <div className="min-h-[20px]">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-700 font-medium">
                      {t("labels.name")}{" "}
                      <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholders.name")}
                        className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <div className="min-h-[20px]">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-700 font-medium">
                      {t("labels.nickname")}{" "}
                      <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholders.nickname")}
                        className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <div className="min-h-[20px]">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-700 font-medium">
                      {t("labels.gender")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "U"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 w-full bg-gray-50 border-gray-200 focus:bg-white text-stone-900">
                          <SelectValue
                            placeholder={t("placeholders.gender_placeholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="U">
                          {t("options.gender_none")}
                        </SelectItem>
                        <SelectItem value="M">
                          {t("options.gender_m")}
                        </SelectItem>
                        <SelectItem value="F">
                          {t("options.gender_f")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="min-h-[20px]">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ageRange"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-700 font-medium">
                      {t("labels.age_range")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 w-full bg-gray-50 border-gray-200 focus:bg-white text-stone-900">
                          <SelectValue
                            placeholder={t(
                              "placeholders.age_range_placeholder",
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          {t("options.age_none")}
                        </SelectItem>
                        <SelectItem value="0-9">
                          {t("options.age_0_9")}
                        </SelectItem>
                        <SelectItem value="10-19">
                          {t("options.age_10_19")}
                        </SelectItem>
                        <SelectItem value="20-29">
                          {t("options.age_20_29")}
                        </SelectItem>
                        <SelectItem value="30-39">
                          {t("options.age_30_39")}
                        </SelectItem>
                        <SelectItem value="40-49">
                          {t("options.age_40_49")}
                        </SelectItem>
                        <SelectItem value="50-59">
                          {t("options.age_50_59")}
                        </SelectItem>
                        <SelectItem value="60-">
                          {t("options.age_60_")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="min-h-[20px]">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 text-[15px] font-medium transition-colors"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("submit")}
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">{t("has_account")} </span>
          <Link
            href={PATHS.LOGIN}
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            {t("login_link")}
          </Link>
        </div>
      </div>
    </div>
  );
};
