import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/features/auth/store";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

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

    if (originalRequest.url?.includes("/auth/refresh")) {
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
        return Promise.reject(error);
      }

      try {
        console.log("Attempting to refresh token...");
        const { data } = await publicAxios.post(
          `/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );
        console.log("Refresh response data:", data);

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          data;

        if (!newAccessToken) {
          console.error("New access token is missing!");
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
        console.error("Refresh failed:", refreshError);
        processQueue(refreshError as AxiosError, null);
        useAuthStore.getState().clearAuth();
        location.reload();
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
