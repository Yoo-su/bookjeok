import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/features/auth/store";

const baseURL =
  typeof window === "undefined"
    ? process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL;

export const publicAxios = axios.create({
  baseURL,
});

export const privateAxios = axios.create({
  baseURL,
});

privateAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
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
  if (
    response.data &&
    response.data.success === true &&
    response.data.data !== undefined
  ) {
    const unwrappedData = response.data.data;
    if (
      typeof unwrappedData === "object" &&
      unwrappedData !== null &&
      !Array.isArray(unwrappedData)
    ) {
      unwrappedData.success = true;
    }
    response.data = unwrappedData;
  }
  return response;
};

privateAxios.interceptors.response.use(
  commonResponseInterceptor,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // refresh 요청 자체가 실패한 경우 (refresh 토큰 만료)
    if (originalRequest.url?.includes("/auth/refresh")) {
      // 401이면 토큰이 완전히 만료된 것이므로 로그아웃 처리
      if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
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
            return privateAxios(originalRequest);
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
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await publicAxios.post(
          `/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          data;

        if (!newAccessToken) {
          throw new Error("Failed to retrieve new access token");
        }

        useAuthStore.getState().setTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return privateAxios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        useAuthStore.getState().clearAuth();
        // 무한 리디렉션 방지를 위해 reload 대신 login 페이지로 이동
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const internalAxios = axios.create({
  baseURL: "/api",
});

publicAxios.interceptors.response.use(commonResponseInterceptor);
internalAxios.interceptors.response.use(commonResponseInterceptor);
