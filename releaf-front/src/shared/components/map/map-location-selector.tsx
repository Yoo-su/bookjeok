"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";

import { Button } from "@/shared/components/shadcn/button";

interface MapLocationSelectorProps {
  onLocationSelect: (
    lat: number,
    lng: number,
    addressInfo?: {
      city: string;
      district: string;
      placeName?: string;
    }
  ) => void;
  defaultLat?: number;
  defaultLng?: number;
}

export const MapLocationSelector = ({
  onLocationSelect,
  defaultLat = 37.5665,
  defaultLng = 126.978,
}: MapLocationSelectorProps) => {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY!,
    libraries: ["services", "clusterer"],
  });

  const [searchResults, setSearchResults] = useState<
    kakao.maps.services.PlacesSearchResultItem[]
  >([]);
  const [keyword, setKeyword] = useState("");
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<{
    placeName: string;
    address: string;
  } | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // 현재 위치 가져오기
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          onLocationSelect(latitude, longitude); // 기본 좌표만 먼저 전달 (선택적)
          updateAddress(latitude, longitude); // 주소 찾아서 다시 상세 전달
        },
        (err) => {
          console.error(err);
          alert("현재 위치를 가져올 수 없습니다.");
        }
      );
    } else {
      alert("Geolocation이 지원되지 않는 브라우저입니다.");
    }
  };

  const updateAddress = (
    lat: number,
    lng: number,
    shouldNotifyParent: boolean = true
  ) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const addr = result[0];
        const roadAddr = addr.road_address;
        const jibunAddr = addr.address;

        const city = roadAddr
          ? roadAddr.region_1depth_name
          : jibunAddr.region_1depth_name;
        const district = roadAddr
          ? roadAddr.region_2depth_name
          : jibunAddr.region_2depth_name;

        // 부모 컴포넌트에 주소 정보 전달 (초기 로딩 시에는 전달하지 않음)
        if (shouldNotifyParent) {
          onLocationSelect(lat, lng, {
            city,
            district,
            placeName: "", // updateAddress는 주로 좌표 이동/현재위치 등에서 불리므로 장소명은 초기화
          });
        }

        setSelectedPlaceInfo({
          placeName: "",
          address: addr.road_address
            ? addr.road_address.address_name
            : addr.address.address_name,
        });
      }
    });
  };

  const handleSearch = (value: string) => {
    if (!value.trim() || isSelectionMode) {
      setSearchResults([]);
      return;
    }

    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(value, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    });
  };

  // 검색 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(keyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, isSelectionMode]);

  useEffect(() => {
    if (isMapLoaded && defaultLat && defaultLng) {
      // 초기 로딩 시에는 부모에게 알리지 않고(이미 부모가 데이터를 줌), 마커와 주소 정보만 업데이트
      updateAddress(defaultLat, defaultLng, false);
    }
  }, [isMapLoaded, defaultLat, defaultLng]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">거래 희망 위치</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCurrentLocation}
        >
          현재 위치 찾기
        </Button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setIsSelectionMode(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              // debounce가 느릴 경우를 대비해 즉시 검색을 트리거할 수 있지만,
              // 현재 debounce 로직은 onChange에 의존합니다.
              // useEffect 흐름에 맡깁니다.
            }
          }}
          placeholder="장소 검색 (예: 강남역)"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
            {searchResults.map((place) => (
              <div
                key={place.id}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                onClick={() => {
                  const lat = Number(place.y);
                  const lng = Number(place.x);
                  setPosition({ lat, lng });

                  // 검색 결과 선택 시에는 명확한 장소명이 있음
                  const city = place.road_address_name
                    ? place.road_address_name.split(" ")[0]
                    : place.address_name.split(" ")[0];
                  const district = place.road_address_name
                    ? place.road_address_name.split(" ")[1]
                    : place.address_name.split(" ")[1];

                  onLocationSelect(lat, lng, {
                    city,
                    district,
                    placeName: place.place_name,
                  });

                  setSelectedPlaceInfo({
                    placeName: place.place_name,
                    address: place.road_address_name || place.address_name,
                  });
                  setIsSelectionMode(true);
                  setKeyword(place.place_name);
                  setSearchResults([]); // 선택 후 결과 목록 숨기기
                }}
              >
                <div className="font-medium">{place.place_name}</div>
                <div className="text-xs text-gray-500">
                  {place.road_address_name || place.address_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-[300px] border rounded-md overflow-hidden bg-muted relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <span className="text-muted-foreground">지도를 불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 text-red-500">
            지도를 로드하는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Map
            center={position}
            style={{ width: "100%", height: "100%" }}
            level={3}
            onClick={(_t, mouseEvent) => {
              const lat = mouseEvent.latLng.getLat();
              const lng = mouseEvent.latLng.getLng();
              setPosition({ lat, lng });

              // 지도 클릭 시 역지오코딩 수행 후 부모에게 전달
              const geocoder = new kakao.maps.services.Geocoder();
              geocoder.coord2Address(lng, lat, (result, status) => {
                if (status === kakao.maps.services.Status.OK) {
                  const addr = result[0];
                  const roadAddr = addr.road_address;
                  const jibunAddr = addr.address;

                  const city = roadAddr
                    ? roadAddr.region_1depth_name
                    : jibunAddr.region_1depth_name;
                  const district = roadAddr
                    ? roadAddr.region_2depth_name
                    : jibunAddr.region_2depth_name;

                  setSelectedPlaceInfo({
                    placeName: "", // 클릭 시에는 장소명 없음
                    address: roadAddr?.address_name || jibunAddr.address_name,
                  });

                  onLocationSelect(lat, lng, {
                    city,
                    district,
                    placeName: "",
                  });
                } else {
                  // 주소 정보를 찾을 수 없는 경우 (바다 등)
                  onLocationSelect(lat, lng, undefined);
                  setSelectedPlaceInfo(null);
                }
              });

              setKeyword(""); // 지도 클릭 시 키워드 초기화
              setIsSelectionMode(false);
            }}
            onCreate={() => setIsMapLoaded(true)}
          >
            {isMapLoaded && <MapMarker position={position} />}
          </Map>
        )}
      </div>

      {(selectedPlaceInfo || position) && (
        <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted/30 rounded-md">
          {selectedPlaceInfo?.placeName && (
            <div className="font-medium text-foreground">
              {selectedPlaceInfo.placeName}
            </div>
          )}
          <div>{selectedPlaceInfo?.address || "주소를 불러오는 중..."}</div>
          <div className="text-[10px] opacity-70">
            위도: {position.lat.toFixed(6)}, 경도: {position.lng.toFixed(6)}
          </div>
          <div className="mt-1 font-medium text-primary">
            ※ 정확한 거래 위치가 설정되었습니다.
          </div>
        </div>
      )}
    </div>
  );
};
