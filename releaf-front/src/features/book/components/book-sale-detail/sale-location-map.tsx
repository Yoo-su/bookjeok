"use client";

import { Loader2, MapPin } from "lucide-react";
import {
  CustomOverlayMap,
  Map,
  MapMarker,
  useKakaoLoader,
} from "react-kakao-maps-sdk";

interface SaleLocationMapProps {
  latitude: number;
  longitude: number;
  placeName?: string;
  city: string;
  district: string;
}

export const SaleLocationMap = ({
  latitude,
  longitude,
  placeName,
  city,
  district,
}: SaleLocationMapProps) => {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY!,
    libraries: ["services", "clusterer"],
  });

  if (loading) {
    return (
      <div className="w-full h-[240px] border rounded-xl bg-muted/20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[240px] border rounded-xl bg-muted/20 flex items-center justify-center text-destructive text-sm">
        지도를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="font-semibold text-lg text-gray-900">거래 희망 장소</h3>
        <p className="text-sm text-gray-500">
          {city} {district} {placeName && `· ${placeName}`}
        </p>
      </div>
      <div className="w-full h-[300px] border rounded-xl overflow-hidden shadow-sm relative z-0">
        <Map
          center={{ lat: latitude, lng: longitude }}
          style={{ width: "100%", height: "100%" }}
          level={3}
          draggable={false}
          zoomable={false}
        >
          <MapMarker position={{ lat: latitude, lng: longitude }} />
          <CustomOverlayMap
            position={{ lat: latitude, lng: longitude }}
            yAnchor={1} // 마커 바로 위에 표시되도록 y축 앵커 조정 (값이 클수록 위로 올라감. 1은 마커 머리 부분)
          >
            <div className="relative mb-8 transform transition-all hover:scale-105">
              <div className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-lg ring-1 ring-black/5">
                <MapPin className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                <span>{placeName || "거래 희망 장소"}</span>
              </div>
              {/* 말풍선 꼬리 (선택적 디자인) */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 overflow-hidden">
                <div className="h-3 w-3 origin-top-left -rotate-45 bg-white shadow-sm ring-1 ring-black/5" />
              </div>
            </div>
          </CustomOverlayMap>
        </Map>
      </div>
    </div>
  );
};
