"use client";

import { getLocationSales } from "@bookjeok/api-client";
import { LocationSales, LocationStat } from "@bookjeok/core";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { CustomOverlayMap, Map, useKakaoLoader } from "react-kakao-maps-sdk";

import {
  EmptyState,
  InsightCard,
} from "@/features/insights/components/common/insight-card";
import { COLORS } from "@/features/insights/constants/ui";
import { Loader2, MapPin, Navigation } from "@/shared/components/icons/iconsax";
import { config } from "@/shared/config/env";
import { formatCurrency } from "@/shared/utils/format-currency";

// 서울 기본 좌표
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

interface LocationHeatmapProps {
  data: LocationStat[];
}

/**
 * 지역별 거래 현황 지도
 * - 인기 장소 버튼 클릭 시 해당 지역 판매글 5개 조회 및 마커 표시
 */
export const LocationHeatmap = ({ data }: LocationHeatmapProps) => {
  const t = useTranslations("insights.charts.location");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationStat | null>(
    null,
  );
  const [sales, setSales] = useState<LocationSales[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [selectedSale, setSelectedSale] = useState<LocationSales | null>(null);

  const [loading, error] = useKakaoLoader({
    appkey: config.NEXT_PUBLIC_KAKAO_APP_KEY!,
    libraries: ["services", "clusterer"],
  });

  const hasData = data.length > 0;

  // TOP 5 장소 (count 기준 정렬)
  const top5Locations = [...data].sort((a, b) => b.count - a.count).slice(0, 5);

  // 장소 버튼 클릭 핸들러
  const handleLocationClick = useCallback(async (location: LocationStat) => {
    setSelectedLocation(location);
    setSelectedSale(null);
    setIsLoadingSales(true);

    try {
      // 1. 해당 지역 판매글 조회
      const salesData = await getLocationSales(
        location.city,
        location.district,
      );
      setSales(salesData);

      // 2. 백엔드에서 제공된 좌표로 지도 이동
      if (mapRef.current) {
        const moveLatLng = new kakao.maps.LatLng(
          location.latitude,
          location.longitude,
        );
        setMapCenter({ lat: location.latitude, lng: location.longitude });
        mapRef.current.panTo(moveLatLng);
        mapRef.current.setLevel(7);
      }
    } finally {
      setIsLoadingSales(false);
    }
  }, []);

  // 초기 로딩 시 첫 번째 장소 선택
  useEffect(() => {
    if (hasData && !selectedLocation && top5Locations.length > 0 && !loading) {
      const timer = setTimeout(() => {
        handleLocationClick(top5Locations[0]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasData, top5Locations, selectedLocation, loading, handleLocationClick]);

  const formatPrice = (price: number) =>
    formatCurrency(price, locale, tCommon("won"));

  if (loading) {
    return (
      <InsightCard
        title={t("title")}
        description={t("desc_error")}
        icon={<MapPin className="h-5 w-5" />}
      >
        <div className="flex h-60 items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: COLORS.stone[400] }}
          />
        </div>
      </InsightCard>
    );
  }

  if (error) {
    return (
      <InsightCard
        title={t("title")}
        description={t("desc_error")}
        icon={<MapPin className="h-5 w-5" />}
      >
        <div className="flex h-60 items-center justify-center text-red-500">
          {t("error")}
        </div>
      </InsightCard>
    );
  }

  return (
    <InsightCard
      title={t("title")}
      description={t("desc")}
      icon={<MapPin className="h-5 w-5" />}
    >
      {hasData ? (
        <div className="space-y-4">
          {/* 인기 장소 TOP 5 버튼 */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-700">
              <Navigation
                className="h-4 w-4"
                style={{ color: COLORS.stone[400] }}
              />
              {t("top5")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {top5Locations.map((location, index) => {
                const isSelected =
                  selectedLocation?.city === location.city &&
                  selectedLocation?.district === location.district;

                return (
                  <button
                    key={`${location.city}-${location.district}`}
                    onClick={() => handleLocationClick(location)}
                    disabled={isLoadingSales}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all hover:shadow-sm disabled:opacity-50"
                    style={{
                      backgroundColor: isSelected
                        ? COLORS.stone[800]
                        : COLORS.stone[100],
                      color: isSelected ? "#fff" : COLORS.stone[600],
                    }}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.2)"
                          : COLORS.stone[200],
                        color: isSelected ? "#fff" : COLORS.stone[500],
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium">
                      {location.city} {location.district}
                    </span>
                    <span style={{ opacity: 0.7 }}>
                      {t("count_unit", { count: location.count })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 지도 */}
          <div className="relative overflow-hidden rounded-xl border border-stone-200">
            {isLoadingSales && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                <Loader2
                  className="h-8 w-8 animate-spin"
                  style={{ color: COLORS.stone[400] }}
                />
              </div>
            )}
            <Map
              center={mapCenter}
              style={{ width: "100%", height: "300px" }}
              level={5}
              onCreate={(map) => {
                mapRef.current = map;
              }}
              onClick={() => setSelectedSale(null)}
            >
              {/* 판매글 마커들 - 책 모양 커스텀 마커 */}
              {sales.map((sale) => (
                <CustomOverlayMap
                  key={sale.id}
                  position={{ lat: sale.latitude, lng: sale.longitude }}
                  yAnchor={1.3}
                >
                  <button
                    onClick={() => setSelectedSale(sale)}
                    className="flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-transform hover:scale-110"
                    style={{
                      backgroundColor:
                        selectedSale?.id === sale.id
                          ? COLORS.stone[800]
                          : COLORS.stone[500],
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                    </svg>
                  </button>
                </CustomOverlayMap>
              ))}

              {/* 선택된 판매글 오버레이 */}
              {selectedSale && (
                <CustomOverlayMap
                  position={{
                    lat: selectedSale.latitude,
                    lng: selectedSale.longitude,
                  }}
                  yAnchor={1.4}
                >
                  <div className="relative min-w-[180px] max-w-[220px]">
                    <div className="rounded-lg bg-white p-3 shadow-lg ring-1 ring-stone-200">
                      <div className="mb-1 text-xs text-stone-500">
                        {selectedSale.placeName}
                      </div>
                      <div
                        className="mb-1 truncate text-sm font-semibold text-stone-800"
                        title={selectedSale.bookTitle}
                      >
                        {selectedSale.bookTitle}
                      </div>
                      <div className="text-sm font-bold text-stone-900">
                        {formatPrice(selectedSale.price)}
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <div className="h-3 w-3 rotate-45 bg-white shadow ring-1 ring-stone-200" />
                    </div>
                  </div>
                </CustomOverlayMap>
              )}
            </Map>
          </div>

          {/* 선택된 지역 정보 */}
          {selectedLocation && (
            <div className="rounded-lg bg-stone-50 p-3 text-center text-sm">
              <span className="font-medium text-stone-700">
                {selectedLocation.city} {selectedLocation.district}
              </span>
              <span className="mx-2 text-stone-300">·</span>
              <span className="text-stone-500">
                {t("showing", { count: sales.length })}
              </span>
            </div>
          )}
        </div>
      ) : (
        <EmptyState message={t("empty")} />
      )}
    </InsightCard>
  );
};
