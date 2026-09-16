"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

/**
 * 사용자 위치 정보 인터페이스
 */
export interface UserLocation {
  lat: number;
  lng: number;
}

/**
 * 위치 요청 상태
 */
export type LocationStatus = "idle" | "loading" | "success" | "error";

/**
 * useUserLocation 훅 반환 타입
 */
export interface UseUserLocationReturn {
  /** 사용자 위치 정보 (null이면 아직 위치를 가져오지 않음) */
  location: UserLocation | null;
  /** 현재 위치 요청 상태 */
  status: LocationStatus;
  /** 에러 메시지 (에러 발생 시) */
  errorMessage: string | null;
  /** 위치 권한을 요청하고 위치를 가져오는 함수 */
  requestLocation: () => Promise<UserLocation | null>;
  /** 위치 정보 초기화 (정렬 변경 시 사용) */
  clearLocation: () => void;
}

/**
 * 사용자의 현재 위치(geolocation)를 관리하는 훅
 *
 * 특징:
 * - 위치 권한 요청 및 상태 관리
 * - 에러 처리 (권한 거부, 위치 불가 등)
 * - URL에 위치 정보를 노출하지 않음
 */
export const useUserLocation = (): UseUserLocationReturn => {
  const t = useTranslations("market.location");
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation =
    useCallback(async (): Promise<UserLocation | null> => {
      // 이미 위치가 있으면 바로 반환
      if (location) {
        return location;
      }

      // 브라우저 지원 확인
      if (typeof window === "undefined" || !navigator.geolocation) {
        setStatus("error");
        setErrorMessage(t("unsupported"));
        return null;
      }

      setStatus("loading");
      setErrorMessage(null);

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          // 성공 콜백
          (position) => {
            const newLocation: UserLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setLocation(newLocation);
            setStatus("success");
            resolve(newLocation);
          },
          // 에러 콜백
          (error) => {
            setStatus("error");
            let message = t("unavailable");

            switch (error.code) {
              case error.PERMISSION_DENIED:
                message = t("permission_denied");
                break;
              case error.POSITION_UNAVAILABLE:
                message = t("position_unavailable");
                break;
              case error.TIMEOUT:
                message = t("timeout");
                break;
            }

            setErrorMessage(message);
            resolve(null);
          },
          // 옵션
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
          },
        );
      });
    }, [location, t]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  return {
    location,
    status,
    errorMessage,
    requestLocation,
    clearLocation,
  };
};
