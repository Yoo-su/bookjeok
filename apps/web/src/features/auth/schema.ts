import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  type NicknameError,
  normalizeNickname,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  USER_NAME_MAX_LENGTH,
  validateNickname,
} from "@bookjeok/core";
import { z } from "zod";

type Translate = (key: string, values?: Record<string, number>) => string;

const nicknameMessage = (t: Translate, error: NicknameError) => {
  switch (error) {
    case "too_short":
      return t("nickname_min", { min: NICKNAME_MIN_LENGTH });
    case "too_long":
      return t("nickname_max", { max: NICKNAME_MAX_LENGTH });
    case "invalid_chars":
      return t("nickname_invalid");
  }
};

export const createSignupSchema = (t: Translate) =>
  z
    .object({
      email: z.string().email(t("email_invalid")),
      password: z
        .string()
        .min(
          PASSWORD_MIN_LENGTH,
          t("password_min", { min: PASSWORD_MIN_LENGTH }),
        )
        .regex(PASSWORD_PATTERN, t("password_regex")),
      passwordConfirm: z.string(),
      // 프로필 수정과 같은 규칙(core validateNickname)
      nickname: z.string().superRefine((value, ctx) => {
        const error = validateNickname(normalizeNickname(value));
        if (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: nicknameMessage(t, error),
          });
        }
      }),
      name: z
        .string()
        .min(1, t("name_required"))
        .max(
          USER_NAME_MAX_LENGTH,
          t("name_max", { max: USER_NAME_MAX_LENGTH }),
        ),
      gender: z.string().optional().nullable(),
      ageRange: z.string().optional().nullable(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: t("password_mismatch"),
      path: ["passwordConfirm"],
    });

export const createLoginSchema = (t: Translate) =>
  z.object({
    email: z.string().email(t("email_invalid")),
    password: z.string().min(1, t("password_required")),
  });

// Schema Types (Use a dummy schema or infer from Zod directly, but since we need generic T, we can use ReturnType or just static inference if possible.
// Actually, types shouldn't depend on translation values.
// We can define a BASE schema for types or just use Zod helpers with `z.ZodType<...>`.
// Simplest way: Define the Shape separately? Or just instantiate one for type inference with dummy function.)
const dummyT = (k: string) => k;
export const SignupSchema = createSignupSchema(dummyT);
export const LoginSchema = createLoginSchema(dummyT);

export type SignupSchemaType = z.infer<typeof SignupSchema>;
export type LoginSchemaType = z.infer<typeof LoginSchema>;
