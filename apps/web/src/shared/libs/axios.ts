import { privateApiClient, publicApiClient } from "@bookjeok/api-client";
import { API_PATHS } from "@bookjeok/core";
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { config } from "@/shared/config/env";
import { redirectToLogin } from "@/shared/utils/session";

// 런타임 환경(서버/브라우저) 및 구동 방식(컨테이너/생로컬)에 따라 베이스 API 주소 동적 결정
// - SSR/ISR (서버): 내부망 주소(API_URL) 우선 적용 ➔ 미지정 시 로컬 주소(NEXT_PUBLIC_API_URL)로 폴백
// - CSR (브라우저): 항상 브라우저용 포트 매핑 주소(NEXT_PUBLIC_API_URL) 사용
const baseURL =
  (typeof window === "undefined"
    ? process.env.API_URL || config.NEXT_PUBLIC_API_URL
    : config.NEXT_PUBLIC_API_URL) || "http://localhost:8000";

// @bookjeok/api-client의 전역 인스턴스들에 baseURL 반영
publicApiClient.defaults.baseURL = baseURL;
privateApiClient.defaults.baseURL = baseURL;

privateApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  },
);

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: PendingRequest[] = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const commonResponseInterceptor = (response: AxiosResponse): AxiosResponse => {
  // 서버 응답이 { success, data } 형태인 경우 투명하게 data 필드만 반환합니다.
  if (
    response.data &&
    typeof response.data === "object" &&
    response.data.success === true &&
    response.data.data !== undefined
  ) {
    response.data = response.data.data;
  }
  return response;
};

privateApiClient.interceptors.response.use(
  commonResponseInterceptor,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // refresh 요청 자체가 실패한 경우 (refresh 토큰 만료)
    if (originalRequest.url?.includes(API_PATHS.auth.refresh)) {
      // 401이면 토큰이 완전히 만료된 것이므로 로그아웃 처리
      if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") {
          redirectToLogin();
        }
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return privateApiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        // refresh token이 없으면 로그아웃 처리
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") {
          redirectToLogin();
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await publicApiClient.post<{
          accessToken: string;
          refreshToken?: string;
        }>(
          API_PATHS.auth.refresh,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          data;

        if (!newAccessToken) {
          throw new Error("Failed to retrieve new access token");
        }

        useAuthStore.getState().setTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || refreshToken,
        });

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return privateApiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        useAuthStore.getState().clearAuth();
        // 무한 리디렉션 방지를 위해 reload 대신 login 페이지로 이동
        if (typeof window !== "undefined") {
          redirectToLogin();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const internalAxios = axios.create({
  baseURL: "/api",
});

publicApiClient.interceptors.response.use(commonResponseInterceptor);
internalAxios.interceptors.response.use(commonResponseInterceptor);

// 💡 기존 래퍼들과의 코드 호환성 유지를 위해 publicAxios/privateAxios 명칭으로 re-export
export { privateApiClient as privateAxios, publicApiClient as publicAxios };
