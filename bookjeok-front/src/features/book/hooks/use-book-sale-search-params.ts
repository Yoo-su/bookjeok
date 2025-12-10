"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { SaleStatus, SearchBookSalesParams } from "@/features/book/types";

export const useBookSaleSearchParams = (): SearchBookSalesParams => {
  const searchParams = useSearchParams();

  const filterParams: SearchBookSalesParams = useMemo(() => {
    const params: SearchBookSalesParams = {};
    const search = searchParams.get("search");
    const city = searchParams.get("city");
    const district = searchParams.get("district");
    const status = searchParams.getAll("status") as SaleStatus[];
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    if (search) params.search = search;
    if (city) params.city = city;
    if (district) params.district = district;
    if (status.length > 0) params.status = status;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (minPrice) params.minPrice = Number(minPrice);
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");

    if (lat) params.lat = Number(lat);
    if (lng) params.lng = Number(lng);
    if (radius) params.radius = Number(radius);

    return params;
  }, [searchParams]);

  return filterParams;
};
