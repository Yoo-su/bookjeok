import { z } from "zod";

const _clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_KAKAO_APP_KEY: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_ADSENSE_ID: z.string().optional(),
  NEXT_PUBLIC_CLARITY_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
});

const _serverEnvSchema = z.object({
  NAVER_CLIENT_ID: z.string().min(1),
  NAVER_CLIENT_SECRET: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

const _clientEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_KAKAO_APP_KEY: process.env.NEXT_PUBLIC_KAKAO_APP_KEY,
  NEXT_PUBLIC_GOOGLE_ADSENSE_ID: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID,
  NEXT_PUBLIC_CLARITY_PROJECT_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
};

const _serverEnv = {
  NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
};

// [주석 처리된 엄격한 검증 로직]
// const parsedClientEnv = _clientEnvSchema.safeParse(_clientEnv);
// if (!parsedClientEnv.success) {
//   console.error("❌ Invalid client environment variables:", parsedClientEnv.error.flatten().fieldErrors);
//   throw new Error("Invalid client environment variables");
// }

// let parsedServerEnv = { success: true, data: _serverEnv } as any;
// if (typeof window === "undefined") {
//   parsedServerEnv = _serverEnvSchema.safeParse(_serverEnv);
//   if (!parsedServerEnv.success) {
//     console.error("❌ Invalid server environment variables:", parsedServerEnv.error.flatten().fieldErrors);
//     throw new Error("Invalid server environment variables");
//   }
// }

export const config = {
  ..._clientEnv,
  ..._serverEnv,
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
} as unknown as z.infer<typeof _clientEnvSchema> &
  z.infer<typeof _serverEnvSchema> & { isDev: boolean; isProd: boolean };
