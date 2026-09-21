"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";

import { Button } from "@/shared/components/shadcn/button";
import { config } from "@/shared/config/env";

interface MapLocationSelectorProps {
  onLocationSelect: (
    lat: number,
    lng: number,
    addressInfo?: {
      city: string;
      district: string;
      placeName?: string;
    },
  ) => void;
  defaultLat?: number;
  defaultLng?: number;
}

export const MapLocationSelector = ({
  onLocationSelect,
  defaultLat = 37.5665,
  defaultLng = 126.978,
}: MapLocationSelectorProps) => {
  const t = useTranslations("common.map");
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [loading, error] = useKakaoLoader({
    appkey: config.NEXT_PUBLIC_KAKAO_APP_KEY,
    libraries: ["services", "clusterer"],
  });

  const [searchResults, setSearchResults] = useState<
    kakao.maps.services.PlacesSearchResultItem[]
  >([]);
  const [keyword, setKeyword] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<{
    placeName: string;
    address: string;
  } | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const resultsListRef = useRef<HTMLDivElement>(null);

  // 선택된 검색 결과 항목 처리
  const selectPlace = (place: kakao.maps.services.PlacesSearchResultItem) => {
    const lat = Number(place.y);
    const lng = Number(place.x);
    setPosition({ lat, lng });

    const rawCity = place.road_address_name
      ? place.road_address_name.split(" ")[0]
      : place.address_name.split(" ")[0];
    const rawDistrict = place.road_address_name
      ? place.road_address_name.split(" ")[1]
      : place.address_name.split(" ")[1];

    const city = rawCity ? rawCity.trim() : "";
    const district = rawDistrict ? rawDistrict.trim() : "";

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
    setSearchResults([]);
    setFocusedIndex(-1);
  };

  // 현재 위치 가져오기
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });

          onLocationSelect(latitude, longitude);
          updateAddress(latitude, longitude);
        },
        (err) => {
          console.error(err);
          alert(t("geolocation_unavailable"));
        },
      );
    } else {
      alert(t("geolocation_unsupported"));
    }
  };

  const updateAddress = (
    lat: number,
    lng: number,
    shouldNotifyParent: boolean = true,
  ) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const addr = result[0];
        const roadAddr = addr.road_address;
        const jibunAddr = addr.address;

        const rawCity = roadAddr
          ? roadAddr.region_1depth_name
          : jibunAddr.region_1depth_name;
        const rawDistrict = roadAddr
          ? roadAddr.region_2depth_name
          : jibunAddr.region_2depth_name;

        const city = rawCity ? rawCity.trim() : "";
        const district = rawDistrict ? rawDistrict.trim() : "";

        if (shouldNotifyParent) {
          onLocationSelect(lat, lng, {
            city,
            district,
            placeName: "",
          });
        }

        setSelectedPlaceInfo({
          placeName: "",
          address: roadAddr?.address_name || jibunAddr.address_name,
        });
      }
    });
  };

  const handleSearch = (value: string) => {
    if (!value.trim() || isSelectionMode) {
      setSearchResults([]);
      setFocusedIndex(-1);
      return;
    }

    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(value, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        setSearchResults(data);
        setFocusedIndex(-1);
      } else {
        setSearchResults([]);
        setFocusedIndex(-1);
      }
    });
  };

  // 키보드 방향키 및 엔터 조작 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
        selectPlace(searchResults[focusedIndex]);
      }
    } else if (e.key === "Escape") {
      setSearchResults([]);
      setFocusedIndex(-1);
    }
  };

  // focusedIndex 변경 시 자동 스크롤
  useEffect(() => {
    if (focusedIndex >= 0 && resultsListRef.current) {
      const activeEl = resultsListRef.current.children[
        focusedIndex
      ] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex]);

  // 검색 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(keyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, isSelectionMode]);

  useEffect(() => {
    if (isMapLoaded && defaultLat && defaultLng) {
      updateAddress(defaultLat, defaultLng, false);
    }
  }, [isMapLoaded, defaultLat, defaultLng]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("location_title")}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCurrentLocation}
        >
          {t("find_current_location")}
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
          onKeyDown={handleKeyDown}
          placeholder={t("search_placeholder")}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm md:text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {searchResults.length > 0 && (
          <div
            ref={resultsListRef}
            className="absolute top-full left-0 z-20 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto custom-scrollbar stable-scroll"
          >
            {searchResults.map((place, index) => (
              <div
                key={place.id}
                tabIndex={-1}
                className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                  index === focusedIndex
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => selectPlace(place)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <div className="font-medium">{place.place_name}</div>
                <div className="text-xs text-muted-foreground">
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
            <span className="text-muted-foreground">{t("loading")}</span>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 text-red-500">
            {t("error")}
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

              const geocoder = new kakao.maps.services.Geocoder();
              geocoder.coord2Address(lng, lat, (result, status) => {
                if (status === kakao.maps.services.Status.OK) {
                  const addr = result[0];
                  const roadAddr = addr.road_address;
                  const jibunAddr = addr.address;

                  const rawCity = roadAddr
                    ? roadAddr.region_1depth_name
                    : jibunAddr.region_1depth_name;
                  const rawDistrict = roadAddr
                    ? roadAddr.region_2depth_name
                    : jibunAddr.region_2depth_name;

                  const city = rawCity ? rawCity.trim() : "";
                  const district = rawDistrict ? rawDistrict.trim() : "";

                  setSelectedPlaceInfo({
                    placeName: "",
                    address: roadAddr?.address_name || jibunAddr.address_name,
                  });

                  onLocationSelect(lat, lng, {
                    city,
                    district,
                    placeName: "",
                  });
                } else {
                  onLocationSelect(lat, lng, undefined);
                  setSelectedPlaceInfo(null);
                }
              });

              setKeyword("");
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
          <div>{selectedPlaceInfo?.address || t("address_loading")}</div>
          <div className="text-[10px] opacity-70">
            {t("lat")}: {position.lat.toFixed(6)}, {t("lng")}:{" "}
            {position.lng.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
};
