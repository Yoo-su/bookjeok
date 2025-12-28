"use client";

import { Loader2, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CustomOverlayMap, Map, useKakaoLoader } from "react-kakao-maps-sdk";

import { getLocationSales } from "@/features/insights/apis";
import {
  EmptyState,
  InsightCard,
} from "@/features/insights/components/insight-card";
import { LocationSales, LocationStat } from "@/features/insights/types";
import { PATHS } from "@/shared/constants/paths";

// 색상 팔레트
const COLORS = {
  matcha: { dark: "#4b6043", medium: "#658354", light: "#7a9968" },
  cream: { light: "#faf7f2", medium: "#f5f0e6", dark: "#e8dfd0" },
  mustard: { dark: "#d4a72c", medium: "#e5b84c" },
};

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
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const geocoderRef = useRef<kakao.maps.services.Geocoder | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationStat | null>(
    null
  );
  const [sales, setSales] = useState<LocationSales[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [selectedSale, setSelectedSale] = useState<LocationSales | null>(null);

  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY!,
    libraries: ["services", "clusterer"],
  });

  const hasData = data.length > 0;

  // TOP 5 장소 (count 기준 정렬)
  const top5Locations = [...data].sort((a, b) => b.count - a.count).slice(0, 5);

  // Geocoder 초기화
  useEffect(() => {
    if (!loading && !error && typeof kakao !== "undefined") {
      geocoderRef.current = new kakao.maps.services.Geocoder();
    }
  }, [loading, error]);

  // 주소로 좌표 검색
  const searchAddressToCoords = useCallback(
    (address: string): Promise<{ lat: number; lng: number } | null> => {
      return new Promise((resolve) => {
        if (!geocoderRef.current) {
          resolve(null);
          return;
        }
        geocoderRef.current.addressSearch(address, (result, status) => {
          if (status === kakao.maps.services.Status.OK && result.length > 0) {
            resolve({
              lat: parseFloat(result[0].y),
              lng: parseFloat(result[0].x),
            });
          } else {
            resolve(null);
          }
        });
      });
    },
    []
  );

  // 장소 버튼 클릭 핸들러
  const handleLocationClick = useCallback(
    async (location: LocationStat) => {
      setSelectedLocation(location);
      setSelectedSale(null);
      setIsLoadingSales(true);

      try {
        // 1. 해당 지역 판매글 조회
        const salesData = await getLocationSales(
          location.city,
          location.district
        );
        setSales(salesData);

        // 2. Geocoder로 해당 시/군/구 중심점 검색
        const address = `${location.city} ${location.district}`;
        const coords = await searchAddressToCoords(address);

        if (coords && mapRef.current) {
          setMapCenter(coords);
          const moveLatLng = new kakao.maps.LatLng(coords.lat, coords.lng);
          mapRef.current.panTo(moveLatLng);
          mapRef.current.setLevel(7);
        }
      } finally {
        setIsLoadingSales(false);
      }
    },
    [searchAddressToCoords]
  );

  // 초기 로딩 시 첫 번째 장소 선택
  useEffect(() => {
    if (
      hasData &&
      !selectedLocation &&
      top5Locations.length > 0 &&
      !loading &&
      geocoderRef.current
    ) {
      const timer = setTimeout(() => {
        handleLocationClick(top5Locations[0]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasData, top5Locations, selectedLocation, loading, handleLocationClick]);

  // 가격 포맷
  const formatPrice = (price: number) => {
    return price.toLocaleString() + "원";
  };

  if (loading) {
    return (
      <InsightCard
        title="지역별 거래 현황"
        description="어느 지역에서 거래가 활발할까요?"
        icon={<MapPin className="h-5 w-5" />}
      >
        <div className="flex h-60 items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: COLORS.matcha.medium }}
          />
        </div>
      </InsightCard>
    );
  }

  if (error) {
    return (
      <InsightCard
        title="지역별 거래 현황"
        description="어느 지역에서 거래가 활발할까요?"
        icon={<MapPin className="h-5 w-5" />}
      >
        <div className="flex h-60 items-center justify-center text-red-500">
          지도를 불러오는 중 오류가 발생했습니다.
        </div>
      </InsightCard>
    );
  }

  return (
    <InsightCard
      title="지역별 거래 현황"
      description="지역을 선택하면 해당 지역의 최근 판매글을 보여드려요"
      icon={<MapPin className="h-5 w-5" />}
    >
      {hasData ? (
        <div className="space-y-4">
          {/* 인기 장소 TOP 5 버튼 */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Navigation
                className="h-4 w-4"
                style={{ color: COLORS.matcha.medium }}
              />
              거래 활발 지역 TOP 5
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
                        ? COLORS.matcha.medium
                        : COLORS.cream.medium,
                      color: isSelected ? "#fff" : COLORS.matcha.dark,
                    }}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.3)"
                          : COLORS.matcha.light,
                        color: "#fff",
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium">
                      {location.city} {location.district}
                    </span>
                    <span style={{ opacity: 0.7 }}>({location.count}개)</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 지도 */}
          <div className="relative overflow-hidden rounded-xl border border-gray-100">
            {isLoadingSales && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                <Loader2
                  className="h-8 w-8 animate-spin"
                  style={{ color: COLORS.matcha.medium }}
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
                          ? COLORS.mustard.dark
                          : COLORS.matcha.medium,
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
                    <div className="rounded-lg bg-white p-3 shadow-lg ring-1 ring-gray-100">
                      <div className="mb-1 text-xs text-gray-500">
                        {selectedSale.placeName}
                      </div>
                      <div
                        className="mb-1 truncate text-sm font-semibold text-gray-800"
                        title={selectedSale.bookTitle}
                      >
                        {selectedSale.bookTitle}
                      </div>
                      <div
                        className="mb-2 text-sm font-bold"
                        style={{ color: COLORS.mustard.dark }}
                      >
                        {formatPrice(selectedSale.price)}
                      </div>
                      <Link
                        href={PATHS.BOOK_SALES_DETAIL(String(selectedSale.id))}
                        className="block rounded-md py-1.5 text-center text-xs font-medium text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: COLORS.matcha.medium }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        상세보기
                      </Link>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <div className="h-3 w-3 rotate-45 bg-white shadow ring-1 ring-gray-100" />
                    </div>
                  </div>
                </CustomOverlayMap>
              )}
            </Map>
          </div>

          {/* 선택된 지역 정보 */}
          {selectedLocation && (
            <div
              className="rounded-lg p-3 text-center text-sm"
              style={{ backgroundColor: COLORS.cream.light }}
            >
              <span
                className="font-medium"
                style={{ color: COLORS.matcha.dark }}
              >
                {selectedLocation.city} {selectedLocation.district}
              </span>
              <span className="mx-2 text-gray-400">·</span>
              <span style={{ color: COLORS.mustard.dark }}>
                최근 판매글 {sales.length}개 표시 중
              </span>
            </div>
          )}
        </div>
      ) : (
        <EmptyState message="아직 등록된 판매글이 없어요" />
      )}
    </InsightCard>
  );
};
